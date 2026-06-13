<?php
/**
 * Endpoints REST - Colunas do Kanban
 *
 * GET    /api/v1/kanban-columns          — lista colunas de uma loja (autenticado)
 * POST   /api/v1/kanban-columns          — cria coluna customizada (gerente)
 * DELETE /api/v1/kanban-columns/{id}     — exclui coluna customizada (gerente)
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

add_action('rest_api_init', function () {

  register_rest_route('api/v1', '/kanban-columns', [
    [
      'methods'             => 'GET',
      'callback'            => 'mytheme_api_kanban_columns_list',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
    [
      'methods'             => 'POST',
      'callback'            => 'mytheme_api_kanban_columns_create',
      'permission_callback' => 'mytheme_api_is_gerente',
    ],
  ]);

  register_rest_route('api/v1', '/kanban-columns/(?P<id>\d+)', [
    [
      'methods'             => 'DELETE',
      'callback'            => 'mytheme_api_kanban_columns_delete',
      'permission_callback' => 'mytheme_api_is_gerente',
    ],
  ]);

  // PATCH /api/v1/kanban-columns/{id}/move — mover coluna para esquerda ou direita
  register_rest_route('api/v1', '/kanban-columns/(?P<id>\d+)/move', [
    [
      'methods'             => 'PATCH',
      'callback'            => 'mytheme_api_kanban_columns_move',
      'permission_callback' => 'mytheme_api_is_gerente',
    ],
  ]);
});

/**
 * GET /api/v1/kanban-columns?loja_id={id}
 */
function mytheme_api_kanban_columns_list(WP_REST_Request $request): WP_REST_Response
{
  $loja_id = intval($request->get_param('loja_id'));

  if (!$loja_id) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'Parâmetro loja_id é obrigatório.',
    ], 400);
  }

  $columns = Kanban_Column_Handler::get_columns($loja_id);

  return new WP_REST_Response([
    'success' => true,
    'data'    => $columns,
  ], 200);
}

/**
 * POST /api/v1/kanban-columns
 * Body: { "loja_id": 1, "label": "Aguardando Projeto", "cor": "purple", "after_id": 3 }
 */
function mytheme_api_kanban_columns_create(WP_REST_Request $request): WP_REST_Response
{
  $params   = json_decode($request->get_body(), true) ?: [];
  $loja_id  = intval($params['loja_id'] ?? 0);
  $label    = sanitize_text_field($params['label'] ?? '');
  $cor      = sanitize_text_field($params['cor'] ?? 'gray');
  $after_id = isset($params['after_id']) ? intval($params['after_id']) : null;

  if (!$loja_id) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'loja_id é obrigatório.',
    ], 400);
  }

  $result = Kanban_Column_Handler::create_custom($loja_id, $label, $cor, $after_id);

  if (is_wp_error($result)) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => $result->get_error_message(),
    ], $result->get_error_data()['status'] ?? 500);
  }

  return new WP_REST_Response([
    'success' => true,
    'data'    => $result,
  ], 201);
}

/**
 * DELETE /api/v1/kanban-columns/{id}?loja_id={loja_id}
 */
function mytheme_api_kanban_columns_delete(WP_REST_Request $request): WP_REST_Response
{
  $id      = intval($request->get_param('id'));
  $loja_id = intval($request->get_param('loja_id'));

  if (!$loja_id) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'loja_id é obrigatório.',
    ], 400);
  }

  $result = Kanban_Column_Handler::delete_custom($id, $loja_id);

  if (is_wp_error($result)) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => $result->get_error_message(),
    ], $result->get_error_data()['status'] ?? 500);
  }

  return new WP_REST_Response([
    'success'  => true,
    'mensagem' => 'Coluna excluída com sucesso.',
  ], 200);
}

/**
 * PATCH /api/v1/kanban-columns/{id}/move
 * Body: { "loja_id": 1, "direction": "left" | "right" }
 */
function mytheme_api_kanban_columns_move(WP_REST_Request $request): WP_REST_Response
{
  $id      = intval($request->get_param('id'));
  $params  = json_decode($request->get_body(), true) ?: [];
  $loja_id = intval($params['loja_id'] ?? 0);
  $direction = sanitize_text_field($params['direction'] ?? '');

  if (!$loja_id || !in_array($direction, ['left', 'right'], true)) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'loja_id e direction (left|right) são obrigatórios.',
    ], 400);
  }

  $result = Kanban_Column_Handler::move_column($id, $loja_id, $direction);

  if (is_wp_error($result)) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => $result->get_error_message(),
    ], $result->get_error_data()['status'] ?? 500);
  }

  $columns = Kanban_Column_Handler::get_columns($loja_id);

  return new WP_REST_Response([
    'success' => true,
    'data'    => $columns,
  ], 200);
}
