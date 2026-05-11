<?php
/**
 * Endpoints REST de Lojas
 * 
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

add_action('rest_api_init', function () {
  register_rest_route('api/v1', '/lojas', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_list_lojas',
    'permission_callback' => '__return_true',
  ));

  register_rest_route('api/v1', '/lojas-with-stats', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_list_lojas_with_stats',
    'permission_callback' => '__return_true',
  ));

  // Detalhes da loja
  register_rest_route('api/v1', '/lojas/(?P<id>\d+)', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_get_loja',
    'permission_callback' => '__return_true',
  ));

  // Stats completas da loja
  register_rest_route('api/v1', '/lojas/(?P<id>\d+)/stats', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_get_loja_stats',
    'permission_callback' => '__return_true',
  ));

  // Leads dos últimos 30 dias
  register_rest_route('api/v1', '/lojas/(?P<id>\d+)/leads-30-days', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_get_loja_leads_30_days',
    'permission_callback' => '__return_true',
  ));

  // Leads dos últimos 12 meses
  register_rest_route('api/v1', '/lojas/(?P<id>\d+)/leads-12-months', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_get_loja_leads_12_months',
    'permission_callback' => '__return_true',
  ));

  // Leads da loja (kanban de atendimentos)
  register_rest_route('api/v1', '/lojas/(?P<id>\d+)/leads', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_get_loja_leads',
    'permission_callback' => '__return_true',
  ));

  // Registrar contato com lead da loja
  register_rest_route('api/v1', '/lojas/(?P<id>\d+)/lead-contato', [
    'methods' => 'POST',
    'callback' => 'mytheme_api_loja_register_contact',
    'permission_callback' => '__return_true',
  ]);
});

/**
 * GET /api/v1/lojas
 */
function mytheme_api_list_lojas($request)
{
  $lojas = Loja_Handler::list();

  return new WP_REST_Response([
    'success' => true,
    'lojas' => $lojas,
    'total' => count($lojas)
  ], 200);
}

/**
 * GET /api/v1/lojas-with-stats
 */
function mytheme_api_list_lojas_with_stats($request)
{
  $lojas = Loja_Handler::list_with_stats();

  return new WP_REST_Response([
    'success' => true,
    'lojas' => $lojas,
    'total' => count($lojas)
  ], 200);
}

/**
 * GET /api/v1/lojas/:id
 */
function mytheme_api_get_loja($request)
{
  $loja_id = (int) $request['id'];
  $loja = Loja_Handler::get_by_id($loja_id);

  if (!$loja) {
    return new WP_REST_Response([
      'success' => false,
      'message' => 'Loja não encontrada'
    ], 404);
  }

  return new WP_REST_Response([
    'success' => true,
    'loja' => $loja
  ], 200);
}

/**
 * GET /api/v1/lojas/:id/stats
 */
function mytheme_api_get_loja_stats($request)
{
  $loja_id = (int) $request['id'];

  // Verifica se a loja existe
  $loja = get_post($loja_id);
  if (!$loja || $loja->post_type !== 'lojas') {
    return new WP_REST_Response([
      'success' => false,
      'message' => 'Loja não encontrada'
    ], 404);
  }

  $stats = Loja_Handler::get_stats($loja_id);

  return new WP_REST_Response([
    'success' => true,
    'stats' => $stats
  ], 200);
}

/**
 * GET /api/v1/lojas/:id/leads-30-days
 */
function mytheme_api_get_loja_leads_30_days($request)
{
  $loja_id = (int) $request['id'];

  // Verifica se a loja existe
  $loja = get_post($loja_id);
  if (!$loja || $loja->post_type !== 'lojas') {
    return new WP_REST_Response([
      'success' => false,
      'message' => 'Loja não encontrada'
    ], 404);
  }

  $data = Loja_Handler::get_leads_30_days($loja_id);

  return new WP_REST_Response([
    'success' => true,
    'data' => $data
  ], 200);
}

/**
 * GET /api/v1/lojas/:id/leads-12-months
 */
function mytheme_api_get_loja_leads_12_months($request)
{
  $loja_id = (int) $request['id'];

  // Verifica se a loja existe
  $loja = get_post($loja_id);
  if (!$loja || $loja->post_type !== 'lojas') {
    return new WP_REST_Response([
      'success' => false,
      'message' => 'Loja não encontrada'
    ], 404);
  }

  $data = Loja_Handler::get_leads_12_months($loja_id);

  return new WP_REST_Response([
    'success' => true,
    'data' => $data
  ], 200);
}

/**
 * GET /api/v1/lojas/:id/leads
 */
function mytheme_api_get_loja_leads($request)
{
  $loja_id = (int) $request['id'];

  $loja = get_post($loja_id);
  if (!$loja || $loja->post_type !== 'lojas') {
    return new WP_REST_Response([
      'success' => false,
      'message' => 'Loja não encontrada'
    ], 404);
  }

  $result = Lead_Handler::list([
    'page' => $request->get_param('page') ?: 1,
    'per_page' => $request->get_param('per_page') ?: 100,
    'search' => $request->get_param('search'),
    'from' => $request->get_param('from'),
    'to' => $request->get_param('to'),
    'loja_id' => $loja_id,
  ]);

  return new WP_REST_Response([
    'success' => true,
    'leads' => $result['leads'],
    'total' => $result['total'],
    'page' => $result['page'],
    'per_page' => $result['per_page'],
    'total_pages' => $result['total_pages'],
  ], 200);
}

/**
 * POST /api/v1/lojas/:id/lead-contato
 */
function mytheme_api_loja_register_contact(WP_REST_Request $request)
{
  $loja_id = (int) $request['id'];
  $params  = json_decode($request->get_body(), true);

  if (empty($params['lead_id'])) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'lead_id não informado.',
    ], 400);
  }

  // Garante que o lead pertence a esta loja
  global $wpdb;
  $lead_loja_id = (int) $wpdb->get_var($wpdb->prepare(
    "SELECT loja_id FROM {$wpdb->prefix}leads WHERE id = %d",
    intval($params['lead_id'])
  ));

  if ($lead_loja_id !== $loja_id) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'Lead não pertence a esta loja.',
    ], 403);
  }

  $result = Lead_Handler::register_contact($params);

  if (is_wp_error($result)) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => $result->get_error_message(),
    ], $result->get_error_data()['status']);
  }

  return new WP_REST_Response([
    'success'  => true,
    'mensagem' => 'Contato registrado com sucesso.',
  ], 201);
}