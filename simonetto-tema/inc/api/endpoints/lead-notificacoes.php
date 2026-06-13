<?php
/**
 * Endpoints REST de Notificações de Atribuição de Lead
 *
 * GET  /api/v1/notificacoes/lead-atribuicao             — listar não lidas do usuário atual
 * POST /api/v1/notificacoes/lead-atribuicao/lidas        — marcar todas como lidas
 * PATCH /api/v1/notificacoes/lead-atribuicao/{id}/lida   — marcar uma como lida
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

add_action('rest_api_init', function () {

  register_rest_route('api/v1', '/notificacoes/lead-atribuicao', [
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_list_notificacoes_atribuicao',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ]);

  register_rest_route('api/v1', '/notificacoes/lead-atribuicao/lidas', [
    'methods'             => 'POST',
    'callback'            => 'mytheme_api_marcar_todas_notificacoes_lidas',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ]);

  register_rest_route('api/v1', '/notificacoes/lead-atribuicao/(?P<id>\d+)/lida', [
    'methods'             => 'PATCH',
    'callback'            => 'mytheme_api_marcar_notificacao_lida',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ]);
});

function mytheme_api_list_notificacoes_atribuicao(WP_REST_Request $request): WP_REST_Response
{
  $usuario_id    = (int) get_current_user_id();
  $notificacoes  = Lead_Notificacoes_Handler::list_unread($usuario_id);
  return new WP_REST_Response(['success' => true, 'notificacoes' => $notificacoes, 'total' => count($notificacoes)], 200);
}

function mytheme_api_marcar_todas_notificacoes_lidas(WP_REST_Request $request): WP_REST_Response
{
  $usuario_id = (int) get_current_user_id();
  Lead_Notificacoes_Handler::marcar_todas_lidas($usuario_id);
  return new WP_REST_Response(['success' => true], 200);
}

function mytheme_api_marcar_notificacao_lida(WP_REST_Request $request): WP_REST_Response
{
  $id         = (int) $request['id'];
  $usuario_id = (int) get_current_user_id();
  Lead_Notificacoes_Handler::marcar_lida($id, $usuario_id);
  return new WP_REST_Response(['success' => true], 200);
}
