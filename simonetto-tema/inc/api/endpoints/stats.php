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
});

function mytheme_api_stats_general($request)
{
  return new WP_REST_Response([
    'success' => true,
    'data' => Stats_Handler::get_general()
  ], 200);
}

function mytheme_api_stats_by_investment($request)
{
  return new WP_REST_Response([
    'success' => true,
    'data' => Stats_Handler::by_investment()
  ], 200);
}

function mytheme_api_stats_by_interest($request)
{
  return new WP_REST_Response([
    'success' => true,
    'data' => Stats_Handler::by_interest()
  ], 200);
}

function mytheme_api_stats_by_store($request)
{
  return new WP_REST_Response([
    'success' => true,
    'data' => Stats_Handler::by_store()
  ], 200);
}

function mytheme_api_stats_30_days($request)
{
  return new WP_REST_Response([
    'success' => true,
    'data' => Stats_Handler::last_30_days()
  ], 200);
}

function mytheme_api_stats_geo($request)
{
  return new WP_REST_Response([
    'success' => true,
    'data' => Stats_Handler::geo_stats()
  ], 200);
}

function mytheme_api_stats_service($request)
{
  return new WP_REST_Response([
    'success' => true,
    'data' => Stats_Handler::service_stats()
  ], 200);
}

function mytheme_api_stats_time_by_store($request)
{
  $data = Stats_Handler::avg_time_by_store();

  return new WP_REST_Response([
    'success' => true,
    'total_lojas' => count($data),
    'data' => $data
  ], 200);
}