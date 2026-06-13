<?php
/**
 * Endpoints REST de Renders Realistas
 *
 * GET    /api/v1/renders?loja_id={id}  — listar renders da loja
 * POST   /api/v1/renders               — salvar render gerado
 * DELETE /api/v1/renders/{id}          — excluir render
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

add_action('rest_api_init', function () {

  register_rest_route('api/v1', '/renders', [
    [
      'methods'             => 'GET',
      'callback'            => 'mytheme_api_list_renders',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
    [
      'methods'             => 'POST',
      'callback'            => 'mytheme_api_create_render',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
  ]);

  register_rest_route('api/v1', '/renders/(?P<id>\d+)', [
    [
      'methods'             => 'DELETE',
      'callback'            => 'mytheme_api_delete_render',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
  ]);
});

function mytheme_api_list_renders(WP_REST_Request $request): WP_REST_Response
{
  $loja_id = (int) ($request->get_param('loja_id') ?? 0);

  if (!$loja_id) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'loja_id é obrigatório.'], 400);
  }

  $renders = Render_Handler::list_by_loja($loja_id);
  return new WP_REST_Response(['success' => true, 'renders' => $renders], 200);
}

function mytheme_api_create_render(WP_REST_Request $request): WP_REST_Response
{
  $params = $request->get_json_params() ?? [];
  $result = Render_Handler::create($params);

  if (is_wp_error($result)) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => $result->get_error_message(),
    ], $result->get_error_data()['status'] ?? 400);
  }

  return new WP_REST_Response(['success' => true, 'render' => $result], 201);
}

function mytheme_api_delete_render(WP_REST_Request $request): WP_REST_Response
{
  $id     = (int) $request['id'];
  $result = Render_Handler::delete($id);

  if (is_wp_error($result)) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => $result->get_error_message(),
    ], $result->get_error_data()['status'] ?? 400);
  }

  return new WP_REST_Response(['success' => true], 200);
}
