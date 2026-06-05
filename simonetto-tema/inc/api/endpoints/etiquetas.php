<?php
/**
 * Endpoints REST — Etiquetas
 *
 * GET    /api/v1/etiquetas                          — lista etiquetas de uma loja
 * POST   /api/v1/etiquetas                          — cria etiqueta (gerente)
 * PATCH  /api/v1/etiquetas/{id}                     — renomeia / recolore (gerente)
 * DELETE /api/v1/etiquetas/{id}?loja_id={id}        — exclui etiqueta (gerente)
 * POST   /api/v1/leads/{lead_id}/etiquetas          — atribui etiqueta ao lead
 * DELETE /api/v1/leads/{lead_id}/etiquetas/{eid}    — remove etiqueta do lead
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

add_action('rest_api_init', function () {

  register_rest_route('api/v1', '/etiquetas', [
    [
      'methods'             => 'GET',
      'callback'            => 'mytheme_api_etiquetas_list',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
    [
      'methods'             => 'POST',
      'callback'            => 'mytheme_api_etiquetas_create',
      'permission_callback' => 'mytheme_api_is_gerente',
    ],
  ]);

  register_rest_route('api/v1', '/etiquetas/(?P<id>\d+)', [
    [
      'methods'             => 'PATCH',
      'callback'            => 'mytheme_api_etiquetas_update',
      'permission_callback' => 'mytheme_api_is_gerente',
    ],
    [
      'methods'             => 'DELETE',
      'callback'            => 'mytheme_api_etiquetas_delete',
      'permission_callback' => 'mytheme_api_is_gerente',
    ],
  ]);

  register_rest_route('api/v1', '/leads/(?P<lead_id>\d+)/etiquetas', [
    [
      'methods'             => 'POST',
      'callback'            => 'mytheme_api_lead_etiqueta_assign',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
  ]);

  register_rest_route('api/v1', '/leads/(?P<lead_id>\d+)/etiquetas/(?P<etiqueta_id>\d+)', [
    [
      'methods'             => 'DELETE',
      'callback'            => 'mytheme_api_lead_etiqueta_remove',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
  ]);
});

/**
 * GET /api/v1/etiquetas?loja_id={id}
 */
function mytheme_api_etiquetas_list(WP_REST_Request $request): WP_REST_Response
{
  $loja_id = intval($request->get_param('loja_id'));

  if (!$loja_id) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'loja_id é obrigatório.'], 400);
  }

  return new WP_REST_Response([
    'success' => true,
    'data'    => Etiqueta_Handler::get_by_loja($loja_id),
  ], 200);
}

/**
 * POST /api/v1/etiquetas
 * Body: { "loja_id": 1, "nome": "Urgente", "cor": "red" }
 */
function mytheme_api_etiquetas_create(WP_REST_Request $request): WP_REST_Response
{
  $params  = json_decode($request->get_body(), true) ?: [];
  $loja_id = intval($params['loja_id'] ?? 0);
  $nome    = sanitize_text_field($params['nome'] ?? '');
  $cor     = sanitize_text_field($params['cor'] ?? 'gray');

  if (!$loja_id) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'loja_id é obrigatório.'], 400);
  }

  $result = Etiqueta_Handler::create($loja_id, $nome, $cor);

  if (is_wp_error($result)) {
    return new WP_REST_Response(
      ['success' => false, 'mensagem' => $result->get_error_message()],
      $result->get_error_data()['status'] ?? 500
    );
  }

  return new WP_REST_Response(['success' => true, 'data' => $result], 201);
}

/**
 * PATCH /api/v1/etiquetas/{id}
 * Body: { "loja_id": 1, "nome": "Urgente", "cor": "orange" }
 */
function mytheme_api_etiquetas_update(WP_REST_Request $request): WP_REST_Response
{
  $id      = intval($request->get_param('id'));
  $params  = json_decode($request->get_body(), true) ?: [];
  $loja_id = intval($params['loja_id'] ?? 0);
  $nome    = array_key_exists('nome', $params) ? sanitize_text_field($params['nome']) : null;
  $cor     = array_key_exists('cor', $params)  ? sanitize_text_field($params['cor'])  : null;

  if (!$loja_id) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'loja_id é obrigatório.'], 400);
  }

  $result = Etiqueta_Handler::update($id, $loja_id, $nome, $cor);

  if (is_wp_error($result)) {
    return new WP_REST_Response(
      ['success' => false, 'mensagem' => $result->get_error_message()],
      $result->get_error_data()['status'] ?? 500
    );
  }

  return new WP_REST_Response(['success' => true, 'data' => $result], 200);
}

/**
 * DELETE /api/v1/etiquetas/{id}?loja_id={id}
 */
function mytheme_api_etiquetas_delete(WP_REST_Request $request): WP_REST_Response
{
  $id      = intval($request->get_param('id'));
  $loja_id = intval($request->get_param('loja_id'));

  if (!$loja_id) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'loja_id é obrigatório.'], 400);
  }

  $result = Etiqueta_Handler::delete($id, $loja_id);

  if (is_wp_error($result)) {
    return new WP_REST_Response(
      ['success' => false, 'mensagem' => $result->get_error_message()],
      $result->get_error_data()['status'] ?? 500
    );
  }

  return new WP_REST_Response(['success' => true, 'mensagem' => 'Etiqueta excluída com sucesso.'], 200);
}

/**
 * POST /api/v1/leads/{lead_id}/etiquetas
 * Body: { "etiqueta_id": 5 }
 */
function mytheme_api_lead_etiqueta_assign(WP_REST_Request $request): WP_REST_Response
{
  global $wpdb;

  $lead_id     = intval($request->get_param('lead_id'));
  $params      = json_decode($request->get_body(), true) ?: [];
  $etiqueta_id = intval($params['etiqueta_id'] ?? 0);

  if (!$etiqueta_id) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'etiqueta_id é obrigatório.'], 400);
  }

  $lead = $wpdb->get_row($wpdb->prepare(
    "SELECT id, loja_id FROM {$wpdb->prefix}leads WHERE id = %d",
    $lead_id
  ));

  if (!$lead) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Lead não encontrado.'], 404);
  }

  $result = Etiqueta_Handler::assign($lead_id, $etiqueta_id, (int) $lead->loja_id);

  if (is_wp_error($result)) {
    return new WP_REST_Response(
      ['success' => false, 'mensagem' => $result->get_error_message()],
      $result->get_error_data()['status'] ?? 500
    );
  }

  return new WP_REST_Response(['success' => true], 200);
}

/**
 * DELETE /api/v1/leads/{lead_id}/etiquetas/{etiqueta_id}
 */
function mytheme_api_lead_etiqueta_remove(WP_REST_Request $request): WP_REST_Response
{
  $lead_id     = intval($request->get_param('lead_id'));
  $etiqueta_id = intval($request->get_param('etiqueta_id'));

  Etiqueta_Handler::remove_from_lead($lead_id, $etiqueta_id);

  return new WP_REST_Response(['success' => true], 200);
}
