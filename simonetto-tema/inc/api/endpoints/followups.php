<?php
/**
 * Endpoints REST de Follow-ups de Lead
 *
 * GET    /api/v1/leads/{id}/followups       — listar follow-ups do lead
 * POST   /api/v1/leads/{id}/followups       — criar follow-up
 * PATCH  /api/v1/followups/{id}/done        — marcar como concluído
 * DELETE /api/v1/followups/{id}             — excluir follow-up
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

add_action('rest_api_init', function () {

  register_rest_route('api/v1', '/leads/(?P<id>\d+)/followups', [
    [
      'methods'             => 'GET',
      'callback'            => 'mytheme_api_list_followups',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
    [
      'methods'             => 'POST',
      'callback'            => 'mytheme_api_create_followup',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
  ]);

  register_rest_route('api/v1', '/followups/(?P<id>\d+)/done', [
    [
      'methods'             => 'PATCH',
      'callback'            => 'mytheme_api_done_followup',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
  ]);

  register_rest_route('api/v1', '/followups/(?P<id>\d+)', [
    [
      'methods'             => 'DELETE',
      'callback'            => 'mytheme_api_delete_followup',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
  ]);
});

function mytheme_api_list_followups(WP_REST_Request $request): WP_REST_Response
{
  $lead_id   = (int) $request['id'];
  $followups = Followup_Handler::list_by_lead($lead_id);
  return new WP_REST_Response(['success' => true, 'followups' => $followups], 200);
}

function mytheme_api_create_followup(WP_REST_Request $request): WP_REST_Response
{
  $lead_id = (int) $request['id'];
  $params  = json_decode($request->get_body(), true) ?? [];

  $result = Followup_Handler::create(array_merge($params, ['lead_id' => $lead_id]));

  if (is_wp_error($result)) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => $result->get_error_message(),
    ], $result->get_error_data()['status'] ?? 400);
  }

  return new WP_REST_Response(['success' => true, 'followup' => $result], 201);
}

function mytheme_api_done_followup(WP_REST_Request $request): WP_REST_Response
{
  $id     = (int) $request['id'];
  $result = Followup_Handler::mark_done($id);

  if (is_wp_error($result)) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => $result->get_error_message(),
    ], $result->get_error_data()['status'] ?? 400);
  }

  return new WP_REST_Response(['success' => true, 'followup' => $result], 200);
}

function mytheme_api_delete_followup(WP_REST_Request $request): WP_REST_Response
{
  $id     = (int) $request['id'];
  $result = Followup_Handler::delete($id);

  if (is_wp_error($result)) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => $result->get_error_message(),
    ], $result->get_error_data()['status'] ?? 400);
  }

  return new WP_REST_Response(['success' => true], 200);
}
