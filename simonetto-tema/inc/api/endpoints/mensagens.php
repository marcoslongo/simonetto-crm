<?php
/**
 * Endpoints REST de Mensagens (Atendimento WhatsApp)
 *
 * GET  /api/v1/mensagens/{lead_id}           — listar mensagens do lead
 * POST /api/v1/mensagens/{lead_id}           — enviar mensagem via Evolution API + salvar
 * POST /api/v1/mensagens/evolution-webhook   — receber mensagens da Evolution API (sem auth)
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

add_action('rest_api_init', function () {

  // GET  /api/v1/mensagens/{lead_id} — listar mensagens do lead
  // POST /api/v1/mensagens/{lead_id} — enviar via Evolution API e salvar
  register_rest_route('api/v1', '/mensagens/(?P<lead_id>\d+)', [
    [
      'methods'             => 'GET',
      'callback'            => 'mytheme_api_list_mensagens',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
    [
      'methods'             => 'POST',
      'callback'            => 'mytheme_api_create_mensagem',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
  ]);

  // POST /api/v1/mensagens/evolution-webhook — webhook da Evolution API
  register_rest_route('api/v1', '/mensagens/evolution-webhook', [
    [
      'methods'             => 'POST',
      'callback'            => 'mytheme_api_evolution_webhook',
      'permission_callback' => '__return_true',
    ],
  ]);
});

// -------------------------------------------------------------------------
// LISTAR mensagens de um lead
// -------------------------------------------------------------------------

function mytheme_api_list_mensagens(WP_REST_Request $request): WP_REST_Response
{
  $lead_id = intval($request->get_param('lead_id'));

  $mensagens = Mensagem_Handler::list_by_lead($lead_id);

  return new WP_REST_Response([
    'success'   => true,
    'mensagens' => $mensagens,
    'total'     => count($mensagens),
  ], 200);
}

// -------------------------------------------------------------------------
// SALVAR mensagem enviada pelo CRM + enviar via Evolution API
// -------------------------------------------------------------------------

function mytheme_api_create_mensagem(WP_REST_Request $request): WP_REST_Response
{
  $lead_id = intval($request->get_param('lead_id'));
  $body    = $request->get_json_params();

  $telefone   = sanitize_text_field($body['telefone']   ?? '');
  $loja_id    = !empty($body['loja_id'])    ? intval($body['loja_id'])    : null;
  $conteudo   = $body['conteudo']   ?? '';
  $media_url  = $body['media_url']  ?? null;
  $media_type = $body['media_type'] ?? null; // 'image' | 'document' | 'audio' | 'video'
  $caption    = $body['caption']    ?? '';
  $filename   = $body['filename']   ?? '';

  $wamid  = null;
  $status = 'erro';

  if ($loja_id && $telefone) {
    $evo_url      = get_option('evolution_api_url', '');
    $evo_instance = get_post_meta($loja_id, '_evolution_instance', true);
    $evo_key      = get_post_meta($loja_id, '_evolution_api_key', true);

    if ($evo_url && $evo_instance && $evo_key) {
      $phone_clean = preg_replace('/\D/', '', $telefone);
      if (!str_starts_with($phone_clean, '55')) {
        $phone_clean = '55' . $phone_clean;
      }

      if ($media_url) {
        // Enviar mídia via Evolution Go
        $evo_payload = [
          'instanceId' => $evo_instance,
          'number'     => $phone_clean,
          'type'       => $media_type ?? 'document',
          'url'        => $media_url,
        ];
        if ($caption)  $evo_payload['caption']  = $caption;
        if ($filename) $evo_payload['filename']  = $filename;

        $evo_response = wp_remote_post(
          trailingslashit($evo_url) . 'send/media',
          [
            'timeout'   => 30,
            'sslverify' => false,
            'headers'   => [
              'apikey'       => $evo_key,
              'Content-Type' => 'application/json',
            ],
            'body' => wp_json_encode($evo_payload),
          ]
        );
      } else {
        // Enviar texto
        $evo_response = wp_remote_post(
          trailingslashit($evo_url) . 'send/text',
          [
            'timeout'   => 15,
            'sslverify' => false,
            'headers'   => [
              'apikey'       => $evo_key,
              'Content-Type' => 'application/json',
            ],
            'body' => wp_json_encode([
              'instanceId' => $evo_instance,
              'number'     => $phone_clean,
              'text'       => $conteudo,
            ]),
          ]
        );
      }

      $evo_code = !is_wp_error($evo_response) ? wp_remote_retrieve_response_code($evo_response) : null;
      $evo_body = !is_wp_error($evo_response) ? wp_remote_retrieve_body($evo_response)           : null;
      $evo_err  = is_wp_error($evo_response)  ? $evo_response->get_error_message()               : null;

      if (!is_wp_error($evo_response) && $evo_code < 300) {
        $evo_data = json_decode($evo_body, true);
        $wamid    = $evo_data['data']['Info']['ID'] ?? null;
        $status   = 'enviada';
      }
    }
  }

  $meta = isset($evo_err) || isset($evo_code) ? [
    'http_code'     => $evo_code ?? null,
    'error'         => $evo_err  ?? null,
    'response_body' => $evo_body ?? null,
  ] : null;

  if ($media_url) {
    $meta = array_merge($meta ?? [], [
      'media_type' => $media_type,
      'media_url'  => $media_url,
      'mimetype'   => $body['mimetype'] ?? null,
    ]);
  }

  $result = Mensagem_Handler::create(array_merge($body, [
    'lead_id'    => $lead_id,
    'usuario_id' => get_current_user_id(),
    'status'     => $status,
    'wamid'      => $wamid,
    'metadata'   => $meta,
  ]));

  if (is_wp_error($result)) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => $result->get_error_message(),
    ], $result->get_error_data('status') ?? 400);
  }

  return new WP_REST_Response([
    'success'  => true,
    'mensagem' => $result,
  ], 201);
}

// -------------------------------------------------------------------------
// WEBHOOK — Evolution API (mensagens recebidas e atualizações de status)
// -------------------------------------------------------------------------

function mytheme_api_evolution_webhook(WP_REST_Request $request): WP_REST_Response
{
  $body  = $request->get_json_params();
  $event = $body['event'] ?? '';
  $data  = $body['data']  ?? [];
  $info  = $data['Info']  ?? [];

  // instanceId é UUID — confirmado pelo Evolution Go
  $instance = $body['instanceId'] ?? ($body['instanceName'] ?? '');
  $loja_id  = $instance ? Mensagem_Handler::find_loja_by_instance($instance) : null;
  if (!$loja_id) {
    $loja_id = Mensagem_Handler::find_any_configured_loja();
  }
  if (!$loja_id) {
    return new WP_REST_Response(['status' => 'no_loja'], 200);
  }

  // ---- Recibo de leitura / entrega (event = "Receipt") ----
  if ($event === 'Receipt') {
    $state_map = [
      'Delivered' => 'entregue',
      'Read'      => 'lida',
      'Played'    => 'lida',
    ];
    $state = $body['state'] ?? ($data['Type'] ?? '');
    if (isset($state_map[$state])) {
      $ids = $data['MessageIDs'] ?? [];
      foreach ($ids as $wamid) {
        if ($wamid) Mensagem_Handler::update_status($wamid, $state_map[$state]);
      }
    }
    return new WP_REST_Response(['status' => 'ok'], 200);
  }

  // ---- Mensagem recebida (event = "Message" ou similar) ----
  // Ignora mensagens enviadas por nós
  if (!empty($info['IsFromMe'])) {
    return new WP_REST_Response(['status' => 'ok'], 200);
  }

  $chat      = $info['Chat']      ?? ($info['Sender'] ?? '');
  $wamid     = $info['ID']        ?? '';
  $push_name = $info['PushName']  ?? '';
  $timestamp = $info['Timestamp'] ?? '';
  $msg_type  = $info['Type']      ?? '';

  // Ignora grupos, newsletters e JIDs @lid
  if (
    empty($chat) ||
    str_contains($chat, '@g.us') ||
    str_contains($chat, '@newsletter') ||
    str_contains($chat, '@lid')
  ) {
    return new WP_REST_Response(['status' => 'ok'], 200);
  }

  $phone = preg_replace('/\D/', '', preg_replace('/@.*$/', '', $chat));
  $msg   = $data['Message'] ?? [];

  // Texto da mensagem (suporta texto simples e extendido; caption de imagem/doc)
  $texto = $msg['conversation']
        ?? ($msg['extendedTextMessage']['text']
        ?? ($msg['text']
        ?? ($msg['caption'] ?? '')));

  // Detecta tipo de mídia
  $media_map = [
    'pttMessage'      => 'audio',
    'audioMessage'    => 'audio',
    'imageMessage'    => 'image',
    'documentMessage' => 'document',
    'videoMessage'    => 'video',
    'stickerMessage'  => 'sticker',
  ];
  $detected_msg_key    = null;
  $detected_media_type = null;
  foreach ($media_map as $mk => $mt) {
    if (!empty($msg[$mk])) {
      $detected_msg_key    = $mk;
      $detected_media_type = $mt;
      break;
    }
  }

  // Ignora se não tem texto nem mídia reconhecida
  if (empty($texto) && !$detected_media_type) {
    return new WP_REST_Response(['status' => 'ok'], 200);
  }

  $lead_id = Mensagem_Handler::find_lead_by_phone($phone);
  if (!$lead_id) {
    return new WP_REST_Response(['status' => 'lead_not_found', 'phone' => $phone], 200);
  }

  // Baixa a mídia se houver
  $media_url  = null;
  $media_mime = null;
  if ($detected_media_type) {
    $evo_url_opt  = get_option('evolution_api_url', '');
    $evo_inst_opt = get_post_meta($loja_id, '_evolution_instance', true);
    $evo_key_opt  = get_post_meta($loja_id, '_evolution_api_key', true);

    if ($evo_url_opt && $evo_key_opt) {
      $dl = wp_remote_post(
        trailingslashit($evo_url_opt) . 'message/downloadimage',
        [
          'timeout'   => 30,
          'sslverify' => false,
          'headers'   => [
            'apikey'       => $evo_key_opt,
            'Content-Type' => 'application/json',
          ],
          'body' => wp_json_encode(['message' => $msg]),
        ]
      );

      // Log temporário do download para diagnóstico
      $dl_log_dir = WP_CONTENT_DIR . '/uploads/evo-debug';
      if (!is_dir($dl_log_dir)) wp_mkdir_p($dl_log_dir);
      $dl_code = !is_wp_error($dl) ? wp_remote_retrieve_response_code($dl) : 'wp_error';
      $dl_body = !is_wp_error($dl) ? wp_remote_retrieve_body($dl) : $dl->get_error_message();
      file_put_contents(
        $dl_log_dir . '/download-' . time() . '.json',
        wp_json_encode([
          'media_type'     => $detected_media_type,
          'msg_key'        => $detected_msg_key,
          'http_code'      => $dl_code,
          'response_keys'  => array_keys(json_decode($dl_body, true) ?? []),
          'response_short' => substr($dl_body, 0, 300),
        ], JSON_PRETTY_PRINT)
      );

      if (!is_wp_error($dl) && $dl_code < 300) {
        $dl_data    = json_decode($dl_body, true);
        // Evolution Go pode retornar 'base64' ou 'data'
        $b64        = $dl_data['base64'] ?? ($dl_data['data'] ?? null);
        $media_mime = $dl_data['mimetype'] ?? ($dl_data['mime'] ?? 'application/octet-stream');

        if ($b64) {
          $raw_ext   = strtolower(explode(';', explode('/', $media_mime)[1] ?? '')[0] ?? 'bin');
          $safe_exts = ['ogg', 'mp3', 'mp4', 'pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'aac', 'webm', 'opus'];
          $ext       = in_array($raw_ext, $safe_exts, true) ? $raw_ext : 'bin';

          $upload_dir = WP_CONTENT_DIR . '/uploads/whatsapp-media';
          if (!is_dir($upload_dir)) wp_mkdir_p($upload_dir);

          $safe_wamid = sanitize_key(str_replace(['/', '\\', ':'], '-', $wamid));
          $filename   = 'wa-' . $safe_wamid . '.' . $ext;
          $filepath   = $upload_dir . '/' . $filename;
          file_put_contents($filepath, base64_decode($b64));

          $uploads   = wp_upload_dir();
          $media_url = $uploads['baseurl'] . '/whatsapp-media/' . $filename;
        }
      }
    }

    // Se não tem caption, usa label padrão como conteúdo
    if (empty($texto)) {
      $labels = [
        'audio'    => '[Áudio]',
        'image'    => '[Imagem]',
        'document' => '[Documento]',
        'video'    => '[Vídeo]',
        'sticker'  => '[Figurinha]',
      ];
      $texto = $labels[$detected_media_type] ?? '[Mídia]';
    }
  }

  Mensagem_Handler::create([
    'lead_id'  => $lead_id,
    'loja_id'  => $loja_id,
    'conteudo' => $texto,
    'direcao'  => 'recebida',
    'status'   => 'recebida',
    'wamid'    => $wamid,
    'metadata' => [
      'from'         => $phone,
      'timestamp'    => $timestamp,
      'contact_name' => $push_name,
      'type'         => $msg_type,
      'media_type'   => $detected_media_type,
      'media_url'    => $media_url,
      'mimetype'     => $media_mime,
    ],
  ]);

  return new WP_REST_Response(['status' => 'ok'], 200);
}
