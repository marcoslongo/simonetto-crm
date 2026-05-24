<?php
/**
 * Endpoints REST de Notas Internas de Lead
 *
 * GET    /api/v1/leads/{id}/notas  — listar notas do lead
 * POST   /api/v1/leads/{id}/notas  — criar nota
 * DELETE /api/v1/notas/{id}        — excluir nota (somente o autor)
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

add_action('rest_api_init', function () {

  register_rest_route('api/v1', '/leads/(?P<id>\d+)/notas', [
    [
      'methods'             => 'GET',
      'callback'            => 'mytheme_api_list_notas',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
    [
      'methods'             => 'POST',
      'callback'            => 'mytheme_api_create_nota',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
  ]);

  register_rest_route('api/v1', '/notas/(?P<id>\d+)', [
    [
      'methods'             => 'DELETE',
      'callback'            => 'mytheme_api_delete_nota',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
  ]);
});

function mytheme_api_list_notas(WP_REST_Request $request): WP_REST_Response
{
  $lead_id = (int) $request['id'];
  $notas   = Nota_Handler::list_by_lead($lead_id);
  return new WP_REST_Response(['success' => true, 'notas' => $notas], 200);
}

function mytheme_api_create_nota(WP_REST_Request $request): WP_REST_Response
{
  $lead_id = (int) $request['id'];
  $params  = json_decode($request->get_body(), true) ?? [];

  $result = Nota_Handler::create(array_merge($params, ['lead_id' => $lead_id]));

  if (is_wp_error($result)) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => $result->get_error_message(),
    ], $result->get_error_data()['status'] ?? 400);
  }

  return new WP_REST_Response(['success' => true, 'nota' => $result], 201);
}

function mytheme_api_delete_nota(WP_REST_Request $request): WP_REST_Response
{
  $nota_id = (int) $request['id'];
  $result  = Nota_Handler::delete($nota_id);

  if (is_wp_error($result)) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => $result->get_error_message(),
    ], $result->get_error_data()['status'] ?? 400);
  }

  return new WP_REST_Response(['success' => true], 200);
}
