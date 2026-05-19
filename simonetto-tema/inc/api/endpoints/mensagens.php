<?php
/**
 * Endpoints REST de Mensagens (Atendimento WhatsApp)
 *
 * GET  /api/v1/mensagens/{lead_id}         — listar mensagens do lead
 * POST /api/v1/mensagens/{lead_id}         — salvar mensagem enviada
 * POST /api/v1/mensagens/webhook           — receber mensagens da Meta (sem auth)
 * POST /api/v1/mensagens/webhook/status    — receber status de entrega da Meta
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

add_action('rest_api_init', function () {

  // GET  /api/v1/mensagens/{lead_id} — listar mensagens do lead
  // POST /api/v1/mensagens/{lead_id} — salvar mensagem (enviada pelo CRM)
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

  // POST /api/v1/mensagens/webhook — webhook de mensagens recebidas da Meta
  register_rest_route('api/v1', '/mensagens/webhook', [
    [
      'methods'             => 'GET',
      'callback'            => 'mytheme_api_webhook_verify',
      'permission_callback' => '__return_true',
    ],
    [
      'methods'             => 'POST',
      'callback'            => 'mytheme_api_webhook_receive',
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
// SALVAR mensagem enviada pelo CRM
// -------------------------------------------------------------------------

function mytheme_api_create_mensagem(WP_REST_Request $request): WP_REST_Response
{
  $lead_id = intval($request->get_param('lead_id'));
  $body    = $request->get_json_params();

  $result = Mensagem_Handler::create(array_merge($body, [
    'lead_id'    => $lead_id,
    'usuario_id' => get_current_user_id(),
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
// WEBHOOK — verificação de token (GET, exigido pela Meta na configuração)
// -------------------------------------------------------------------------

function mytheme_api_webhook_verify(WP_REST_Request $request): WP_REST_Response|WP_Error
{
  $mode      = $request->get_param('hub_mode')         ?? $request->get_param('hub.mode');
  $token     = $request->get_param('hub_verify_token') ?? $request->get_param('hub.verify_token');
  $challenge = $request->get_param('hub_challenge')    ?? $request->get_param('hub.challenge');

  $verify_token = defined('META_WEBHOOK_VERIFY_TOKEN')
    ? META_WEBHOOK_VERIFY_TOKEN
    : get_option('meta_webhook_verify_token', '');

  if ($mode === 'subscribe' && $token === $verify_token) {
    return new WP_REST_Response(intval($challenge), 200);
  }

  return new WP_REST_Response(['error' => 'Forbidden'], 403);
}

// -------------------------------------------------------------------------
// WEBHOOK — receber mensagens e atualizações de status da Meta (POST)
// -------------------------------------------------------------------------

function mytheme_api_webhook_receive(WP_REST_Request $request): WP_REST_Response
{
  $body = $request->get_json_params();

  if (($body['object'] ?? '') !== 'whatsapp_business_account') {
    return new WP_REST_Response(['status' => 'ignored'], 200);
  }

  foreach ($body['entry'] ?? [] as $entry) {
    foreach ($entry['changes'] ?? [] as $change) {
      if (($change['field'] ?? '') !== 'messages') continue;

      $value = $change['value'] ?? [];

      // --- mensagens recebidas ---
      foreach ($value['messages'] ?? [] as $msg) {
        if (($msg['type'] ?? '') !== 'text') continue;

        $from    = $msg['from'] ?? '';
        $wamid   = $msg['id']   ?? '';
        $texto   = $msg['text']['body'] ?? '';
        $ts      = $msg['timestamp'] ?? '';
        $contact = $value['contacts'][0]['profile']['name'] ?? $from;

        if (empty($from) || empty($texto)) continue;

        // Tenta vincular ao lead pelo telefone
        $lead_id = Mensagem_Handler::find_lead_by_phone($from);
        if (!$lead_id) continue;

        Mensagem_Handler::create([
          'lead_id'  => $lead_id,
          'conteudo' => $texto,
          'direcao'  => 'recebida',
          'status'   => 'recebida',
          'wamid'    => $wamid,
          'metadata' => [
            'from'         => $from,
            'timestamp'    => $ts,
            'contact_name' => $contact,
          ],
        ]);
      }

      // --- atualizações de status (entregue, lido) ---
      foreach ($value['statuses'] ?? [] as $s) {
        $wamid  = $s['id']     ?? '';
        $status = $s['status'] ?? '';
        if ($wamid && in_array($status, ['delivered', 'read', 'failed'], true)) {
          $map = ['delivered' => 'entregue', 'read' => 'lida', 'failed' => 'erro'];
          Mensagem_Handler::update_status($wamid, $map[$status]);
        }
      }
    }
  }

  return new WP_REST_Response(['status' => 'ok'], 200);
}
