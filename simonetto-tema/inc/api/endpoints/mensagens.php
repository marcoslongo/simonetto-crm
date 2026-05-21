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

  $telefone = sanitize_text_field($body['telefone'] ?? '');
  $loja_id  = !empty($body['loja_id']) ? intval($body['loja_id']) : null;
  $conteudo = $body['conteudo'] ?? '';

  $wamid  = null;
  $status = 'erro';

  // Enviar via Evolution API se a loja tiver credenciais configuradas
  if ($loja_id && $telefone) {
    $evo_url      = get_option('evolution_api_url', '');
    $evo_instance = get_post_meta($loja_id, '_evolution_instance', true);
    $evo_key      = get_post_meta($loja_id, '_evolution_api_key', true);

    if ($evo_url && $evo_instance && $evo_key) {
      $phone_clean = preg_replace('/\D/', '', $telefone);
      if (!str_starts_with($phone_clean, '55')) {
        $phone_clean = '55' . $phone_clean;
      }

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

      $evo_code = !is_wp_error($evo_response) ? wp_remote_retrieve_response_code($evo_response) : null;
      $evo_body = !is_wp_error($evo_response) ? wp_remote_retrieve_body($evo_response) : null;
      $evo_err  = is_wp_error($evo_response)  ? $evo_response->get_error_message()     : null;

      if (!is_wp_error($evo_response) && $evo_code < 300) {
        $evo_data = json_decode($evo_body, true);
        $wamid    = $evo_data['id'] ?? ($evo_data['key']['id'] ?? null);
        $status   = 'enviada';
      }
    }
  }

  $result = Mensagem_Handler::create(array_merge($body, [
    'lead_id'    => $lead_id,
    'usuario_id' => get_current_user_id(),
    'status'     => $status,
    'wamid'      => $wamid,
    'metadata'   => isset($evo_err) || isset($evo_code) ? [
      'http_code'     => $evo_code ?? null,
      'error'         => $evo_err  ?? null,
      'response_body' => $evo_body ?? null,
    ] : null,
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
  $body = $request->get_json_params();

  // Log temporário para diagnóstico — remover após confirmar formato
  $log_dir = WP_CONTENT_DIR . '/uploads/evo-debug';
  if (!is_dir($log_dir)) wp_mkdir_p($log_dir);
  file_put_contents(
    $log_dir . '/webhook-' . time() . '.json',
    wp_json_encode($body, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
  );

  $event    = $body['event']      ?? ($body['type'] ?? '');
  // Evolution Go pode mandar 'instanceId' (UUID) ou 'instance' (nome)
  $instance = $body['instanceId'] ?? ($body['instance'] ?? '');

  if (empty($instance)) {
    return new WP_REST_Response(['status' => 'ignored'], 200);
  }

  $loja_id = Mensagem_Handler::find_loja_by_instance($instance);
  if (!$loja_id) {
    return new WP_REST_Response(['status' => 'instance_not_found', 'instance' => $instance], 200);
  }

  // Mensagem recebida
  if (in_array($event, ['messages.upsert', 'message', 'MESSAGE'], true)) {
    $data = $body['data'] ?? ($body['message'] ?? []);
    $key  = $data['key']  ?? [];

    if (!empty($key['fromMe'])) {
      return new WP_REST_Response(['status' => 'ok'], 200);
    }

    $remote_jid = $key['remoteJid']         ?? ($data['from'] ?? '');
    $wamid      = $key['id']                ?? ($data['id']   ?? '');
    $push_name  = $data['pushName']         ?? ($data['notifyName'] ?? '');
    $timestamp  = $data['messageTimestamp'] ?? ($data['timestamp']  ?? '');
    $msg        = $data['message']          ?? [];
    $texto      = $msg['conversation']      ?? ($msg['extendedTextMessage']['text'] ?? ($data['body'] ?? ''));

    if (empty($remote_jid) || empty($texto)) {
      return new WP_REST_Response(['status' => 'ok'], 200);
    }

    $phone = preg_replace('/@.*$/', '', $remote_jid);
    $phone = preg_replace('/\D/', '', $phone);

    $lead_id = Mensagem_Handler::find_lead_by_phone($phone);
    if (!$lead_id) {
      return new WP_REST_Response(['status' => 'lead_not_found', 'phone' => $phone], 200);
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
      ],
    ]);

    return new WP_REST_Response(['status' => 'ok'], 200);
  }

  // Atualização de status (entregue/lido)
  if (in_array($event, ['messages.update', 'message.update', 'MESSAGE_UPDATE'], true)) {
    $map     = ['DELIVERY_ACK' => 'entregue', 'READ' => 'lida', 'PLAYED' => 'lida'];
    $updates = is_array($body['data']) ? $body['data'] : [];

    foreach ($updates as $upd) {
      $wamid  = $upd['key']['id']        ?? '';
      $status = $upd['update']['status'] ?? '';
      if ($wamid && isset($map[$status])) {
        Mensagem_Handler::update_status($wamid, $map[$status]);
      }
    }

    return new WP_REST_Response(['status' => 'ok'], 200);
  }

  return new WP_REST_Response(['status' => 'ok', 'event' => $event], 200);
}
