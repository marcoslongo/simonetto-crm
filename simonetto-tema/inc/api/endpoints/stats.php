<?php
/**
 * Endpoints REST de Estatísticas
 * 
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

add_action('rest_api_init', function () {
  register_rest_route('api/v1', '/leads-stats-geral', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_stats_general',
    'permission_callback' => 'mytheme_api_is_administrator',
  ));

  register_rest_route('api/v1', '/leads-por-investimento', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_stats_by_investment',
    'permission_callback' => 'mytheme_api_is_administrator',
  ));

  register_rest_route('api/v1', '/leads-por-interesse', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_stats_by_interest',
    'permission_callback' => 'mytheme_api_is_administrator',
  ));

  register_rest_route('api/v1', '/leads-por-loja', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_stats_by_store',
    'permission_callback' => 'mytheme_api_is_administrator',
  ));

  register_rest_route('api/v1', '/leads-30dias', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_stats_30_days',
    'permission_callback' => 'mytheme_api_is_administrator',
  ));

  register_rest_route('api/v1', '/leads-geo-stats', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_stats_geo',
    'permission_callback' => 'mytheme_api_is_administrator',
  ));

  register_rest_route('api/v1', '/leads-stats-service', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_stats_service',
    'permission_callback' => 'mytheme_api_is_administrator',
  ));

  register_rest_route('api/v1', '/leads-tempo-por-loja', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_stats_time_by_store',
    'permission_callback' => 'mytheme_api_is_administrator',
  ));

  register_rest_route('api/v1', '/stats/conversao-por-loja', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_stats_conversao_por_loja',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ));

  register_rest_route('api/v1', '/stats/funil-por-atendente', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_stats_funil_por_atendente',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ));

  register_rest_route('api/v1', '/stats/tempo-por-etapa', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_stats_tempo_por_etapa',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ));

  // SLA agregado de toda a rede em uma única query (substitui N+1 requests)
  register_rest_route('api/v1', '/stats/sla-rede', array(
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_stats_sla_rede',
    'permission_callback' => 'mytheme_api_is_administrator',
  ));

  // Ranking de conversão: top/bottom pré-calculados com média (substitui ordenação no frontend)
  register_rest_route('api/v1', '/stats/conversao-ranking', array(
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_stats_conversao_ranking',
    'permission_callback' => 'mytheme_api_is_administrator',
  ));

  // Conversão agrupada por etiqueta
  register_rest_route('api/v1', '/stats/conversao-por-etiqueta', array(
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_stats_conversao_por_etiqueta',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ));

  // Monitor de capacidade: active_leads por loja em uma única query
  register_rest_route('api/v1', '/stats/capacidade-rede', array(
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_stats_capacidade_rede',
    'permission_callback' => 'mytheme_api_is_administrator',
  ));
});

function mytheme_api_stats_general($request)
{
  $is_admin_non_master = current_user_can('administrator') && !crm_current_user_is_master();
  $origem = $request->get_param('origem');
  $allowed = ['industria', 'proprio'];
  if ($origem && !in_array($origem, $allowed, true)) {
    $origem = null;
  }
  if ($is_admin_non_master && $origem === 'proprio') {
    return new WP_REST_Response(['success' => true, 'data' => ['total' => 0, 'today' => 0, 'ultimaCaptura' => null]], 200);
  }

  return new WP_REST_Response([
    'success' => true,
    'data' => Stats_Handler::get_general($origem, $is_admin_non_master)
  ], 200);
}

function mytheme_api_stats_by_investment($request)
{
  $exclude_proprio = current_user_can('administrator') && !crm_current_user_is_master();
  return new WP_REST_Response([
    'success' => true,
    'data' => Stats_Handler::by_investment($exclude_proprio)
  ], 200);
}

function mytheme_api_stats_by_interest($request)
{
  $exclude_proprio = current_user_can('administrator') && !crm_current_user_is_master();
  return new WP_REST_Response([
    'success' => true,
    'data' => Stats_Handler::by_interest($exclude_proprio)
  ], 200);
}

function mytheme_api_stats_by_store($request)
{
  $exclude_proprio = current_user_can('administrator') && !crm_current_user_is_master();
  return new WP_REST_Response([
    'success' => true,
    'data' => Stats_Handler::by_store($exclude_proprio)
  ], 200);
}

function mytheme_api_stats_30_days($request)
{
  $is_admin_non_master = current_user_can('administrator') && !crm_current_user_is_master();
  $origem = $request->get_param('origem');
  $allowed = ['industria', 'proprio'];
  if ($origem && !in_array($origem, $allowed, true)) {
    $origem = null;
  }
  if ($is_admin_non_master && $origem === 'proprio') {
    return new WP_REST_Response(['success' => true, 'data' => []], 200);
  }

  return new WP_REST_Response([
    'success' => true,
    'data' => Stats_Handler::last_30_days($origem, $is_admin_non_master)
  ], 200);
}

function mytheme_api_stats_geo($request)
{
  $exclude_proprio = current_user_can('administrator') && !crm_current_user_is_master();
  return new WP_REST_Response([
    'success' => true,
    'data' => Stats_Handler::geo_stats($exclude_proprio)
  ], 200);
}

function mytheme_api_stats_service($request)
{
  $exclude_proprio = current_user_can('administrator') && !crm_current_user_is_master();
  return new WP_REST_Response([
    'success' => true,
    'data' => Stats_Handler::service_stats($exclude_proprio)
  ], 200);
}

function mytheme_api_stats_time_by_store($request)
{
  $exclude_proprio = current_user_can('administrator') && !crm_current_user_is_master();
  $data = Stats_Handler::avg_time_by_store($exclude_proprio);

  return new WP_REST_Response([
    'success' => true,
    'total_lojas' => count($data),
    'data' => $data
  ], 200);
}

function mytheme_api_stats_conversao_por_loja($request)
{
  $exclude_proprio = current_user_can('administrator') && !crm_current_user_is_master();
  $loja_ids = [];
  $raw = $request->get_param('loja_ids');
  if ($raw) {
    $loja_ids = array_values(array_filter(array_map('intval', explode(',', $raw))));
  }
  $from = sanitize_text_field($request->get_param('from') ?? '');
  $to   = sanitize_text_field($request->get_param('to')   ?? '');
  $data = Stats_Handler::conversao_por_loja($loja_ids, $from, $to, $exclude_proprio);
  return new WP_REST_Response(['success' => true, 'total' => count($data), 'data' => $data], 200);
}

function mytheme_api_stats_funil_por_atendente($request)
{
  $exclude_proprio = current_user_can('administrator') && !crm_current_user_is_master();
  $loja_ids = [];
  $raw = $request->get_param('loja_ids');
  if ($raw) {
    $loja_ids = array_values(array_filter(array_map('intval', explode(',', $raw))));
  }
  $from = sanitize_text_field($request->get_param('from') ?? '');
  $to   = sanitize_text_field($request->get_param('to')   ?? '');
  $data = Stats_Handler::funil_por_atendente($loja_ids, $from, $to, $exclude_proprio);
  return new WP_REST_Response(['success' => true, 'total' => count($data), 'data' => $data], 200);
}

function mytheme_api_stats_tempo_por_etapa($request)
{
  $exclude_proprio = current_user_can('administrator') && !crm_current_user_is_master();
  $loja_ids = [];
  $raw = $request->get_param('loja_ids');
  if ($raw) {
    $loja_ids = array_values(array_filter(array_map('intval', explode(',', $raw))));
  }
  $from = sanitize_text_field($request->get_param('from') ?? '');
  $to   = sanitize_text_field($request->get_param('to')   ?? '');
  $data = Stats_Handler::tempo_por_etapa($loja_ids, $from, $to, $exclude_proprio);
  return new WP_REST_Response(['success' => true, 'data' => $data], 200);
}

/**
 * GET /api/v1/stats/sla-rede
 * SLA agregado de toda a rede em uma única query SQL.
 */
function mytheme_api_stats_sla_rede(WP_REST_Request $request): WP_REST_Response
{
  $exclude_proprio = current_user_can('administrator') && !crm_current_user_is_master();
  $data = Stats_Handler::sla_rede($exclude_proprio);
  return new WP_REST_Response(['success' => true, 'data' => $data], 200);
}

/**
 * GET /api/v1/stats/conversao-ranking
 * Ranking de conversão pré-calculado com top/bottom e média.
 * Parâmetros: from, to, top_n (padrão 5)
 */
function mytheme_api_stats_conversao_ranking(WP_REST_Request $request): WP_REST_Response
{
  $exclude_proprio = current_user_can('administrator') && !crm_current_user_is_master();
  $from  = sanitize_text_field($request->get_param('from')  ?? '');
  $to    = sanitize_text_field($request->get_param('to')    ?? '');
  $top_n = max(1, (int) ($request->get_param('top_n') ?? 5));
  $data  = Stats_Handler::conversao_ranking($from, $to, $top_n, $exclude_proprio);
  return new WP_REST_Response(['success' => true, 'data' => $data], 200);
}

/**
 * GET /api/v1/stats/capacidade-rede
 * Active leads por loja em uma única query, com média e classificação.
 */
function mytheme_api_stats_capacidade_rede(WP_REST_Request $request): WP_REST_Response
{
  $exclude_proprio = current_user_can('administrator') && !crm_current_user_is_master();
  $data = Stats_Handler::capacidade_rede($exclude_proprio);
  return new WP_REST_Response(['success' => true, 'data' => $data], 200);
}

/**
 * GET /api/v1/stats/conversao-por-etiqueta
 * Taxa de conversão agrupada por etiqueta do lead.
 * Parâmetros: loja_ids, from, to
 */
function mytheme_api_stats_conversao_por_etiqueta(WP_REST_Request $request): WP_REST_Response
{
  $exclude_proprio = current_user_can('administrator') && !crm_current_user_is_master();
  $loja_ids = [];
  $raw = $request->get_param('loja_ids');
  if ($raw) {
    $loja_ids = array_values(array_filter(array_map('intval', explode(',', $raw))));
  }
  $from = sanitize_text_field($request->get_param('from') ?? '');
  $to   = sanitize_text_field($request->get_param('to')   ?? '');
  $data = Stats_Handler::conversao_por_etiqueta($loja_ids, $from, $to, $exclude_proprio);
  return new WP_REST_Response(['success' => true, 'total' => count($data), 'data' => $data], 200);
}