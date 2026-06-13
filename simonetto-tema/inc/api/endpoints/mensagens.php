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

  // POST /api/v1/mensagens/{lead_id}/read — marcar mensagens recebidas como lidas
  register_rest_route('api/v1', '/mensagens/(?P<lead_id>\d+)/read', [
    [
      'methods'             => 'POST',
      'callback'            => 'mytheme_api_mark_mensagens_read',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
  ]);

  // GET /api/v1/mensagens/unread-counts — contagem de não lidas por lead (para polling)
  register_rest_route('api/v1', '/mensagens/unread-counts', [
    [
      'methods'             => 'GET',
      'callback'            => 'mytheme_api_mensagens_unread_counts',
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

  // POST /api/v1/mensagens/upload — upload de mídia para envio via WhatsApp
  // Usa wp_handle_upload() diretamente para evitar o check de upload_files da REST core.
  register_rest_route('api/v1', '/mensagens/upload', [
    [
      'methods'             => 'POST',
      'callback'            => 'mytheme_api_mensagens_upload',
      'permission_callback' => 'mytheme_api_is_authenticated',
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
// MARCAR mensagens recebidas como lidas (agente abriu o chat)
// -------------------------------------------------------------------------

function mytheme_api_mark_mensagens_read(WP_REST_Request $request): WP_REST_Response
{
  global $wpdb;
  $lead_id = intval($request->get_param('lead_id'));
  $user_id = get_current_user_id();

  // Persiste "lido agora" no mapa de leituras do usuário (wp_usermeta)
  $read_map                     = get_user_meta($user_id, 'lead_reads', true) ?: [];
  $read_map[(string) $lead_id]  = current_time('mysql');
  update_user_meta($user_id, 'lead_reads', $read_map);

  // Atualiza status no banco também para integridade
  $wpdb->query($wpdb->prepare(
    "UPDATE {$wpdb->prefix}mensagens
     SET status = 'vista', atualizado_em = %s
     WHERE lead_id = %d AND direcao = 'recebida' AND status != 'vista'",
    current_time('mysql'),
    $lead_id
  ));

  return new WP_REST_Response(['success' => true], 200);
}

// -------------------------------------------------------------------------
// Mensagens não lidas por lead — baseado em wp_usermeta por usuário
// -------------------------------------------------------------------------

function mytheme_api_mensagens_unread_counts(WP_REST_Request $request): WP_REST_Response
{
  global $wpdb;

  $user_id = get_current_user_id();
  $raw_loja = $request->get_param('loja_id') ?? '';
  $loja_ids = array_values(array_filter(array_map('intval', explode(',', $raw_loja))));

  $table_msgs  = $wpdb->prefix . 'mensagens';
  $table_leads = $wpdb->prefix . 'leads';

  // Timestamp da mensagem recebida mais recente por lead
  if (!empty($loja_ids)) {
    $placeholders = implode(',', array_fill(0, count($loja_ids), '%d'));
    $rows = $wpdb->get_results(
      $wpdb->prepare(
        "SELECT m.lead_id, MAX(m.criado_em) AS latest_at
         FROM {$table_msgs} m
         INNER JOIN {$table_leads} l ON l.id = m.lead_id
         WHERE m.direcao = 'recebida'
           AND l.loja_id IN ({$placeholders})
         GROUP BY m.lead_id",
        ...$loja_ids
      ),
      ARRAY_A
    );
  } else {
    $rows = $wpdb->get_results(
      "SELECT lead_id, MAX(criado_em) AS latest_at
       FROM {$table_msgs}
       WHERE direcao = 'recebida'
       GROUP BY lead_id",
      ARRAY_A
    );
  }

  $latest_map = [];
  foreach ($rows as $row) {
    $latest_map[(string) $row['lead_id']] = $row['latest_at'];
  }

  // Mapa de leituras do usuário salvo no wp_usermeta
  $read_map = get_user_meta($user_id, 'lead_reads', true) ?: [];

  // Primeiro acesso: inicializa todos os leads como "lidos agora"
  // para não exibir badge em mensagens históricas
  if (empty($read_map) && !empty($latest_map)) {
    $now = current_time('mysql');
    foreach (array_keys($latest_map) as $lid) {
      $read_map[$lid] = $now;
    }
    update_user_meta($user_id, 'lead_reads', $read_map);
  }

  // Quais leads têm mensagem recebida após a última leitura do usuário
  $unread = [];
  foreach ($latest_map as $lead_id => $latest_at) {
    $last_read = $read_map[$lead_id] ?? null;
    if ($last_read === null || strtotime($latest_at) > strtotime($last_read)) {
      $unread[$lead_id] = 1;
    }
  }

  return new WP_REST_Response(['success' => true, 'unread' => $unread], 200);
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

  $current_user_id = get_current_user_id();
  $evo_url         = get_option('evolution_api_url', '');
  $evo_instance    = get_user_meta($current_user_id, '_evolution_instance', true);
  $evo_key         = get_user_meta($current_user_id, '_evolution_api_key', true); // chave por instância de usuário

  if ($telefone && $evo_url && $evo_instance && $evo_key) {
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
// DOWNLOAD direto de mídia WhatsApp (HKDF + AES-256-CBC)
// O /message/downloadimage da Evolution Go não está acessível; descriptografamos
// diretamente usando os campos do webhook (MediaKey, URL, Mimetype).
// -------------------------------------------------------------------------

function mytheme_download_whatsapp_media(array $msg, string $msg_key, string $wamid): ?array
{
  $type_map = [
    'pttMessage'      => ['info' => 'WhatsApp Audio Keys',    'ext' => 'ogg'],
    'audioMessage'    => ['info' => 'WhatsApp Audio Keys',    'ext' => 'mp3'],
    'imageMessage'    => ['info' => 'WhatsApp Image Keys',    'ext' => 'jpg'],
    'documentMessage' => ['info' => 'WhatsApp Document Keys', 'ext' => 'pdf'],
    'videoMessage'    => ['info' => 'WhatsApp Video Keys',    'ext' => 'mp4'],
    'stickerMessage'  => ['info' => 'WhatsApp Image Keys',    'ext' => 'webp'],
  ];

  $type_info = $type_map[$msg_key] ?? null;
  if (!$type_info) return null;

  $media_obj = $msg[$msg_key] ?? [];

  // Suporta PascalCase (Go JSON padrão) e camelCase
  $url      = $media_obj['URL']      ?? ($media_obj['url']      ?? null);
  $b64_key  = $media_obj['MediaKey'] ?? ($media_obj['mediaKey'] ?? null);
  $mimetype = $media_obj['Mimetype'] ?? ($media_obj['mimetype'] ?? null);

  if (!$url || !$b64_key) return null;

  // Baixa arquivo criptografado do CDN do WhatsApp
  $enc_resp = wp_remote_get($url, ['timeout' => 60, 'sslverify' => false]);
  if (is_wp_error($enc_resp)) return null;
  $enc_bytes = wp_remote_retrieve_body($enc_resp);
  if (strlen($enc_bytes) < 11) return null;

  // HKDF-SHA256: deriva iv + cipherKey de 32 bytes do MediaKey
  $media_key = base64_decode($b64_key);
  $app_info  = $type_info['info'];
  $salt      = str_repeat("\x00", 32);

  $prk = hash_hmac('sha256', $media_key, $salt, true); // Extract

  $t = $output = '';
  for ($i = 1; strlen($output) < 112; $i++) {           // Expand
    $t       = hash_hmac('sha256', $t . $app_info . chr($i), $prk, true);
    $output .= $t;
  }

  $iv         = substr($output, 0, 16);
  $cipher_key = substr($output, 16, 32);

  // Remove 10 bytes de MAC do final e descriptografa
  $ciphertext = substr($enc_bytes, 0, -10);
  $decrypted  = openssl_decrypt($ciphertext, 'aes-256-cbc', $cipher_key, OPENSSL_RAW_DATA, $iv);
  if ($decrypted === false) return null;

  // Extensão a partir do MIME type
  $ext = $type_info['ext'];
  if ($mimetype) {
    $raw_ext   = strtolower(explode(';', explode('/', $mimetype)[1] ?? '')[0] ?? '');
    $safe_exts = ['ogg', 'mp3', 'mp4', 'pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'aac', 'webm', 'opus'];
    if ($raw_ext && in_array($raw_ext, $safe_exts, true)) {
      $ext = $raw_ext;
    }
  }

  $upload_dir = WP_CONTENT_DIR . '/uploads/whatsapp-media';
  if (!is_dir($upload_dir)) wp_mkdir_p($upload_dir);

  $safe_id  = sanitize_key(str_replace(['/', '\\', ':'], '-', $wamid));
  $filename = 'wa-' . $safe_id . '.' . $ext;
  file_put_contents($upload_dir . '/' . $filename, $decrypted);

  $uploads = wp_upload_dir();
  return [
    'url'      => $uploads['baseurl'] . '/whatsapp-media/' . $filename,
    'mimetype' => $mimetype ?? ('audio/' . $ext),
  ];
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

  // Normaliza nomes de eventos: Evolution API Go/v2 usa snake-case, v1 usava PascalCase
  $event_aliases = [
    'connection.update' => 'Connection',
    'messages.update'   => 'Receipt',
    'messages.upsert'   => 'Message',
    'send.message'      => 'Message',
  ];
  $event = $event_aliases[$event] ?? $event;

  // Tenta instanceName primeiro (é o que fica salvo no user meta); UUID como fallback
  $instance_name = $body['instanceName'] ?? '';
  $instance_uuid = $body['instanceId']   ?? '';
  $instance      = $instance_name ?: $instance_uuid;

  $usuario_id = null;
  if ($instance_name) {
    $usuario_id = Mensagem_Handler::find_user_by_instance($instance_name);
  }
  if (!$usuario_id && $instance_uuid && $instance_uuid !== $instance_name) {
    $usuario_id = Mensagem_Handler::find_user_by_instance($instance_uuid);
  }
  $instance_matched = (bool) $usuario_id;
  if (!$usuario_id) {
    $usuario_id = Mensagem_Handler::find_any_configured_user();
  }

  if (!$usuario_id) {
    error_log('[AUTO-LEAD] no_user event=' . $event . ' instance=' . $instance);
    return new WP_REST_Response(['status' => 'no_user'], 200);
  }

  // Deriva loja_id: get_user_meta primeiro (IDs brutos, confiável), ACF como fallback
  $loja_id = null;
  if ($usuario_id) {
    $meta_loja_ids = get_user_meta($usuario_id, 'loja_id', true);
    if (is_array($meta_loja_ids) && !empty($meta_loja_ids)) {
      $first   = $meta_loja_ids[0];
      $loja_id = is_object($first) ? intval($first->ID) : intval($first);
    } elseif (!empty($meta_loja_ids)) {
      $loja_id = is_object($meta_loja_ids) ? intval($meta_loja_ids->ID) : intval($meta_loja_ids);
    }

    // Fallback via ACF (pode retornar WP_Post objects — extrai ->ID se necessário)
    if (!$loja_id && function_exists('get_field')) {
      $acf_loja_ids = get_field('loja_id', 'user_' . $usuario_id);
      if (is_array($acf_loja_ids) && !empty($acf_loja_ids)) {
        $first   = $acf_loja_ids[0];
        $loja_id = is_object($first) ? intval($first->ID) : intval($first);
      }
    }
  }

  $meta_debug = get_user_meta($usuario_id, 'loja_id', true);
  error_log('[AUTO-LEAD] event=' . $event . ' instance=' . $instance . ' matched=' . ($instance_matched ? 'yes' : 'fallback') . ' usuario_id=' . $usuario_id . ' loja_id=' . ($loja_id ?? 'null') . ' meta_loja_ids_raw=' . var_export($meta_debug, true));

  // ---- Estado da conexão (event = "Connection") ----
  if ($event === 'Connection') {
    // v2/Go: data.connection (OPEN|CONNECTING|CLOSED); v1: data.state (open|close|...)
    $raw_state = $data['connection'] ?? ($data['state'] ?? ($body['state'] ?? ''));
    $state_map_conn = [
      'OPEN'       => 'open',
      'CONNECTING' => 'connecting',
      'CLOSING'    => 'close',
      'CLOSED'     => 'close',
    ];
    $state = $state_map_conn[strtoupper((string) $raw_state)] ?? strtolower((string) $raw_state);
    if ($state) {
      update_user_meta($usuario_id, '_whatsapp_connection_state', sanitize_text_field($state));
    }
    return new WP_REST_Response(['status' => 'ok'], 200);
  }

  // ---- Recibo de leitura / entrega (event = "Receipt") ----
  if ($event === 'Receipt') {
    // v2/Go: data é array de {key, update:{status:"READ"|"DELIVERY_ACK"|...}}
    if (isset($data[0]['key'])) {
      $status_map_v2 = [
        'READ'         => 'lida',
        'PLAYED'       => 'lida',
        'DELIVERY_ACK' => 'entregue',
      ];
      foreach ($data as $upd) {
        $wamid_r = $upd['key']['id']        ?? '';
        $st      = $upd['update']['status'] ?? '';
        if ($wamid_r && isset($status_map_v2[strtoupper($st)])) {
          Mensagem_Handler::update_status($wamid_r, $status_map_v2[strtoupper($st)]);
        }
      }
    } else {
      // v1 format
      $state_map_v1 = ['Delivered' => 'entregue', 'Read' => 'lida', 'Played' => 'lida'];
      $state = $body['state'] ?? ($data['Type'] ?? '');
      if (isset($state_map_v1[$state])) {
        $ids = $data['MessageIDs'] ?? [];
        foreach ($ids as $wamid_r) {
          if ($wamid_r) Mensagem_Handler::update_status($wamid_r, $state_map_v1[$state]);
        }
      }
    }
    return new WP_REST_Response(['status' => 'ok'], 200);
  }

  // ---- Mensagem recebida (event = "Message") ----
  // Suporte a Evolution API Go/v2 (data.key) e v1 (data.Info)
  $key_v2 = $data['key'] ?? null;
  if ($key_v2) {
    // Evolution API Go / v2 format
    $from_me   = (bool) ($key_v2['fromMe']            ?? false);
    $chat      = $key_v2['remoteJid']                 ?? '';
    $wamid     = $key_v2['id']                        ?? '';
    $push_name = $data['pushName']                    ?? '';
    $timestamp = $data['messageTimestamp']            ?? '';
    $msg_type  = $data['messageType']                 ?? '';
    $msg       = $data['message']                     ?? [];
  } else {
    // Evolution API v1 / Go format
    $from_me   = !empty($info['IsFromMe']);
    $chat      = $info['Chat']      ?? ($info['Sender'] ?? '');
    $wamid     = $info['ID']        ?? '';
    $push_name = $info['PushName']  ?? '';
    $timestamp = $info['Timestamp'] ?? '';
    $msg_type  = $info['Type']      ?? '';
    // Go coloca Message dentro de data.Info; v1 Node colocava em data.Message
    $msg       = $info['Message']   ?? ($data['Message'] ?? []);
  }

  // Mapa de tipos de mídia (usado tanto para enviadas quanto recebidas)
  $media_map = [
    'pttMessage'      => 'audio',
    'audioMessage'    => 'audio',
    'imageMessage'    => 'image',
    'documentMessage' => 'document',
    'videoMessage'    => 'video',
    'stickerMessage'  => 'sticker',
  ];
  $media_labels = [
    'audio'    => '[Áudio]',
    'image'    => '[Imagem]',
    'document' => '[Documento]',
    'video'    => '[Vídeo]',
    'sticker'  => '[Figurinha]',
  ];

  // ---- Mensagem enviada pelo celular (IsFromMe = true) ----
  // Registra no chat se o lead já existir (não cria novo lead)
  if ($from_me) {
    // Para @lid, tenta obter o JID real do destinatário via RecipientAlt
    $recipient_jid = $chat;
    if (str_contains((string) $recipient_jid, '@lid')) {
      $alt = $info['RecipientAlt'] ?? ($key_v2['participant'] ?? '');
      if ($alt && !str_contains($alt, '@lid')) {
        $recipient_jid = $alt;
      }
    }

    // Ignora grupos, newsletters e @lid sem fallback
    if (
      empty($recipient_jid) ||
      str_contains($recipient_jid, '@g.us') ||
      str_contains($recipient_jid, '@newsletter') ||
      str_contains($recipient_jid, '@lid')
    ) {
      return new WP_REST_Response(['status' => 'ok'], 200);
    }

    $sent_phone = preg_replace('/\D/', '', preg_replace('/@.*$/', '', $recipient_jid));
    if (empty($sent_phone)) {
      return new WP_REST_Response(['status' => 'ok'], 200);
    }

    $sent_lead_id = Mensagem_Handler::find_lead_by_phone($sent_phone);
    if (!$sent_lead_id) {
      return new WP_REST_Response(['status' => 'ok'], 200);
    }

    $sent_texto = $msg['conversation']
      ?? ($msg['extendedTextMessage']['text']
      ?? ($msg['text']
      ?? ($msg['caption'] ?? '')));

    $sent_media_type = null;
    foreach ($media_map as $mk => $mt) {
      if (!empty($msg[$mk])) { $sent_media_type = $mt; break; }
    }

    if (empty($sent_texto) && $sent_media_type) {
      $sent_texto = $media_labels[$sent_media_type] ?? '[Mídia]';
    }

    if (empty($sent_texto)) {
      return new WP_REST_Response(['status' => 'ok'], 200);
    }

    Mensagem_Handler::create([
      'lead_id'  => $sent_lead_id,
      'loja_id'  => $loja_id,
      'conteudo' => $sent_texto,
      'direcao'  => 'enviada',
      'status'   => 'lida',
      'wamid'    => $wamid,
      'metadata' => [
        'from'      => $push_name,
        'timestamp' => $timestamp,
        'type'      => $msg_type,
      ],
    ]);

    return new WP_REST_Response(['status' => 'ok'], 200);
  }

  // ---- Mensagem recebida (IsFromMe = false) ----

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

  // Texto da mensagem (suporta texto simples e extendido; caption de imagem/doc)
  $texto = $msg['conversation']
        ?? ($msg['extendedTextMessage']['text']
        ?? ($msg['text']
        ?? ($msg['caption'] ?? '')));
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
    error_log('[AUTO-LEAD] sem_conteudo phone=' . $phone . ' msg_keys=' . implode(',', array_keys($msg)));
    return new WP_REST_Response(['status' => 'ok'], 200);
  }

  $lead_id = Mensagem_Handler::find_lead_by_phone($phone);
  error_log('[AUTO-LEAD] phone=' . $phone . ' lead_id=' . ($lead_id ?? 'null') . ' timestamp=' . $timestamp);

  if (!$lead_id) {
    $auto_create  = get_user_meta($usuario_id, '_whatsapp_auto_create_lead', true);
    $active_since = (int) get_user_meta($usuario_id, '_whatsapp_auto_create_lead_since', true);

    error_log('[AUTO-LEAD] auto_create=' . var_export($auto_create, true) . ' active_since=' . $active_since . ' usuario_id=' . $usuario_id);

    // Feature desativada
    if (!$auto_create) {
      return new WP_REST_Response(['status' => 'lead_not_found', 'phone' => $phone], 200);
    }

    // Ignora mensagens anteriores à ativação da feature (conversas antigas)
    // Suporta Unix timestamp (int) e ISO 8601 string (Evolution API Go)
    $ts_int = is_numeric($timestamp) ? (int) $timestamp : (int) strtotime((string) $timestamp);
    if ($active_since && $ts_int > 0 && $ts_int < $active_since) {
      error_log('[AUTO-LEAD] bloqueado por timestamp antigo ts=' . $ts_int . ' since=' . $active_since);
      return new WP_REST_Response(['status' => 'lead_not_found', 'phone' => $phone], 200);
    }

    // Segunda verificação para evitar duplicata por race condition
    $lead_id = Mensagem_Handler::find_lead_by_phone($phone);
    if (!$lead_id) {
      $nome     = !empty($push_name) ? sanitize_text_field($push_name) : 'Contato WhatsApp';
      $new_lead = Lead_Handler::create([
        'nome'     => $nome,
        'telefone' => $phone,
        'loja_id'  => $loja_id ?: null,
        'origem'   => 'proprio',
      ]);
      if (is_wp_error($new_lead)) {
        error_log('[AUTO-LEAD] erro ao criar lead: ' . $new_lead->get_error_message() . ' | phone=' . $phone . ' loja_id=' . var_export($loja_id, true) . ' nome=' . $nome);
        return new WP_REST_Response(['status' => 'lead_not_found', 'phone' => $phone], 200);
      }
      error_log('[AUTO-LEAD] lead criado id=' . $new_lead['lead_id'] . ' phone=' . $phone . ' nome=' . $nome . ' loja_id=' . ($loja_id ?? 'null'));
      $lead_id = $new_lead['lead_id'];
    }
  }

  // Baixa e descriptografa a mídia diretamente do WhatsApp CDN
  $media_url  = null;
  $media_mime = null;
  if ($detected_media_type) {
    $dl_result = mytheme_download_whatsapp_media($msg, $detected_msg_key, $wamid);
    if ($dl_result) {
      $media_url  = $dl_result['url'];
      $media_mime = $dl_result['mimetype'];
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

// -------------------------------------------------------------------------
// UPLOAD de mídia para envio via WhatsApp
// Usa wp_handle_upload() diretamente para não exigir capability upload_files.
// -------------------------------------------------------------------------

function mytheme_api_mensagens_upload(WP_REST_Request $request): WP_REST_Response
{
  $files = $request->get_file_params();

  if (empty($files['file'])) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Nenhum arquivo enviado.'], 400);
  }

  $file = $files['file'];

  $max_bytes = 16 * 1024 * 1024; // 16 MB
  if ($file['size'] > $max_bytes) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Arquivo muito grande (máx. 16 MB).'], 400);
  }

  require_once ABSPATH . 'wp-admin/includes/file.php';
  require_once ABSPATH . 'wp-admin/includes/media.php';
  require_once ABSPATH . 'wp-admin/includes/image.php';

  $uploaded = wp_handle_upload($file, ['test_form' => false]);

  if (isset($uploaded['error'])) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $uploaded['error']], 500);
  }

  return new WP_REST_Response([
    'success'  => true,
    'url'      => $uploaded['url'],
    'filename' => basename($uploaded['file']),
    'mimetype' => $uploaded['type'],
  ], 200);
}
