<?php
if (!defined('ABSPATH')) exit;

add_action('rest_api_init', function () {
  register_rest_route('api/v1', '/export/leads', array(
    'methods'             => 'GET',
    'callback'            => 'mytheme_export_leads',
    'permission_callback' => '__return_true',
  ));
});

function mytheme_export_leads(WP_REST_Request $request) {
  global $wpdb;

  $table    = $wpdb->prefix . 'leads';
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
