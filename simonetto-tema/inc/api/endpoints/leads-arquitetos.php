<?php
/**
 * Endpoint REST de Leads Arquitetos
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

add_action('rest_api_init', function () {

  // POST /api/v1/leads-arquitetos — criar lead de arquiteto
  // GET  /api/v1/leads-arquitetos — listar leads (aberto)
  register_rest_route('api/v1', '/leads-arquitetos', array(
    array(
      'methods'             => 'POST',
      'callback'            => 'mytheme_api_create_lead_arquiteto',
      'permission_callback' => '__return_true',
    ),
    array(
      'methods'             => 'GET',
      'callback'            => 'mytheme_api_list_leads_arquitetos',
      'permission_callback' => '__return_true',
    ),
  ));
});

/**
 * GET /api/v1/leads-arquitetos?page=1&per_page=100
 */
function mytheme_api_list_leads_arquitetos($request) {
  global $wpdb;

  $table    = $wpdb->prefix . 'leads_arquitetos';
  $page     = max(1, intval($request->get_param('page') ?: 1));
  $per_page = min(1000, max(1, intval($request->get_param('per_page') ?: 100)));
  $offset   = ($page - 1) * $per_page;

  $total = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$table}");
  $leads = $wpdb->get_results(
    $wpdb->prepare("SELECT * FROM {$table} ORDER BY data_criacao DESC LIMIT %d OFFSET %d", $per_page, $offset),
    ARRAY_A
  );

  return new WP_REST_Response(array(
    'success'     => true,
    'total'       => $total,
    'page'        => $page,
    'per_page'    => $per_page,
    'total_pages' => (int) ceil($total / $per_page),
    'leads'       => $leads ? $leads : array(),
  ), 200);
}

/**
 * POST /api/v1/leads-arquitetos
 */
function mytheme_api_create_lead_arquiteto($request)
{
  $params = json_decode($request->get_body(), true);

  if (empty($params)) {
    return new WP_REST_Response([
      'success' => false,
      'mensagem' => 'JSON inválido ou vazio',
    ], 400);
  }

  // Mescla campos de tracking no nível raiz para o handler
  if (!empty($params['tracking']) && is_array($params['tracking'])) {
    foreach ($params['tracking'] as $key => $value) {
      if (!isset($params[$key])) {
        $params[$key] = $value;
      }
    }
  }

  // Captura IP do request
  $ip = $request->get_header('x-forwarded-for');
  if ($ip) {
    $ip = explode(',', $ip)[0];
    $ip = trim($ip);
  } else {
    $ip = $request->get_header('x-real-ip');
  }
  if ($ip) {
    $params['ip_address'] = $ip;
  }

  // Captura user_agent do request se não vier no payload
  if (empty($params['user_agent'])) {
    $params['user_agent'] = $request->get_header('user-agent');
  }

  $result = Lead_Arquiteto_Handler::create($params);

  if (is_wp_error($result)) {
    return new WP_REST_Response([
      'success' => false,
      'mensagem' => $result->get_error_message(),
    ], $result->get_error_data()['status']);
  }

  return new WP_REST_Response([
    'success'  => true,
    'lead_id'  => $result['lead_id'],
    'mensagem' => 'Lead de arquiteto registrado com sucesso!',
  ], 201);
}
