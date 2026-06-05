<?php
/**
 * Endpoints REST da Agenda Compartilhada da Loja
 *
 * Salas de Reunião:
 *   GET    /api/v1/lojas/{id}/salas-reuniao
 *   POST   /api/v1/lojas/{id}/salas-reuniao
 *   PATCH  /api/v1/salas-reuniao/{id}
 *   DELETE /api/v1/salas-reuniao/{id}
 *
 * Agenda Compartilhada:
 *   GET    /api/v1/lojas/{id}/agenda-compartilhada?year=&month=
 *   POST   /api/v1/lojas/{id}/agenda-compartilhada
 *   PATCH  /api/v1/agenda-compartilhada/{id}
 *   DELETE /api/v1/agenda-compartilhada/{id}
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

add_action('rest_api_init', function () {

  // ── Salas de Reunião ──────────────────────────────────────────────────────

  register_rest_route('api/v1', '/lojas/(?P<id>\d+)/salas-reuniao', [
    [
      'methods'             => 'GET',
      'callback'            => 'mytheme_api_list_salas_reuniao',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
    [
      'methods'             => 'POST',
      'callback'            => 'mytheme_api_create_sala_reuniao',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
  ]);

  register_rest_route('api/v1', '/salas-reuniao/(?P<id>\d+)', [
    [
      'methods'             => 'PATCH',
      'callback'            => 'mytheme_api_update_sala_reuniao',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
    [
      'methods'             => 'DELETE',
      'callback'            => 'mytheme_api_delete_sala_reuniao',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
  ]);

  // ── Agenda Compartilhada ──────────────────────────────────────────────────

  register_rest_route('api/v1', '/lojas/(?P<id>\d+)/agenda-compartilhada', [
    [
      'methods'             => 'GET',
      'callback'            => 'mytheme_api_list_agenda_compartilhada',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
    [
      'methods'             => 'POST',
      'callback'            => 'mytheme_api_create_evento_compartilhado',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
  ]);

  register_rest_route('api/v1', '/agenda-compartilhada/(?P<id>\d+)', [
    [
      'methods'             => 'PATCH',
      'callback'            => 'mytheme_api_update_evento_compartilhado',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
    [
      'methods'             => 'DELETE',
      'callback'            => 'mytheme_api_delete_evento_compartilhado',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
  ]);
});

// ── Callbacks: Salas de Reunião ───────────────────────────────────────────────

function mytheme_api_list_salas_reuniao(WP_REST_Request $request): WP_REST_Response
{
  $loja_id = (int) $request['id'];
  if (!mytheme_user_can_access_loja($loja_id)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Sem permissão.'], 403);
  }
  $salas = Agenda_Compartilhada_Handler::list_salas($loja_id);
  return new WP_REST_Response(['success' => true, 'salas' => $salas], 200);
}

function mytheme_api_create_sala_reuniao(WP_REST_Request $request): WP_REST_Response
{
  $loja_id = (int) $request['id'];
  if (!mytheme_user_can_access_loja($loja_id)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Sem permissão.'], 403);
  }
  $result = Agenda_Compartilhada_Handler::create_sala($loja_id, $request->get_json_params() ?? []);
  if (is_wp_error($result)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $result->get_error_message()], (int) ($result->get_error_data()['status'] ?? 400));
  }
  return new WP_REST_Response(['success' => true, 'sala' => $result], 201);
}

function mytheme_api_update_sala_reuniao(WP_REST_Request $request): WP_REST_Response
{
  $id = (int) $request['id'];
  // Determina loja via body ou parâmetro
  $body    = $request->get_json_params() ?? [];
  $loja_id = (int) ($body['loja_id'] ?? 0);
  if (!$loja_id || !mytheme_user_can_access_loja($loja_id)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Sem permissão.'], 403);
  }
  $result = Agenda_Compartilhada_Handler::update_sala($id, $loja_id, $body);
  if (is_wp_error($result)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $result->get_error_message()], (int) ($result->get_error_data()['status'] ?? 400));
  }
  return new WP_REST_Response(['success' => true, 'sala' => $result], 200);
}

function mytheme_api_delete_sala_reuniao(WP_REST_Request $request): WP_REST_Response
{
  $id      = (int) $request['id'];
  $body    = $request->get_json_params() ?? [];
  $loja_id = (int) ($body['loja_id'] ?? $request->get_param('loja_id') ?? 0);
  if (!$loja_id || !mytheme_user_can_access_loja($loja_id)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Sem permissão.'], 403);
  }
  $result = Agenda_Compartilhada_Handler::delete_sala($id, $loja_id);
  if (is_wp_error($result)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $result->get_error_message()], (int) ($result->get_error_data()['status'] ?? 400));
  }
  return new WP_REST_Response(['success' => true], 200);
}

// ── Callbacks: Agenda Compartilhada ──────────────────────────────────────────

function mytheme_api_list_agenda_compartilhada(WP_REST_Request $request): WP_REST_Response
{
  $loja_id = (int) $request['id'];
  if (!mytheme_user_can_access_loja($loja_id)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Sem permissão.'], 403);
  }
  $year  = (int) ($request->get_param('year')  ?: date('Y'));
  $month = (int) ($request->get_param('month') ?: date('n'));
  $eventos = Agenda_Compartilhada_Handler::list_eventos($loja_id, $year, $month);
  return new WP_REST_Response(['success' => true, 'eventos' => $eventos], 200);
}

function mytheme_api_create_evento_compartilhado(WP_REST_Request $request): WP_REST_Response
{
  $loja_id = (int) $request['id'];
  if (!mytheme_user_can_access_loja($loja_id)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Sem permissão.'], 403);
  }
  $user         = wp_get_current_user();
  $usuario_nome = $user->display_name;
  $result = Agenda_Compartilhada_Handler::create_evento($loja_id, $user->ID, $usuario_nome, $request->get_json_params() ?? []);
  if (is_wp_error($result)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $result->get_error_message()], (int) ($result->get_error_data()['status'] ?? 400));
  }
  return new WP_REST_Response(['success' => true, 'evento' => $result], 201);
}

function mytheme_api_update_evento_compartilhado(WP_REST_Request $request): WP_REST_Response
{
  $id       = (int) $request['id'];
  $body     = $request->get_json_params() ?? [];
  $loja_id  = (int) ($body['loja_id'] ?? 0);
  $user     = wp_get_current_user();
  $is_admin = in_array('administrator', (array) $user->roles, true);

  if (!$loja_id || !mytheme_user_can_access_loja($loja_id)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Sem permissão.'], 403);
  }
  $result = Agenda_Compartilhada_Handler::update_evento($id, $loja_id, $user->ID, $is_admin, $body);
  if (is_wp_error($result)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $result->get_error_message()], (int) ($result->get_error_data()['status'] ?? 400));
  }
  return new WP_REST_Response(['success' => true, 'evento' => $result], 200);
}

function mytheme_api_delete_evento_compartilhado(WP_REST_Request $request): WP_REST_Response
{
  $id      = (int) $request['id'];
  $body    = $request->get_json_params() ?? [];
  $loja_id = (int) ($body['loja_id'] ?? $request->get_param('loja_id') ?? 0);
  $user     = wp_get_current_user();
  $is_admin = in_array('administrator', (array) $user->roles, true);

  if (!$loja_id || !mytheme_user_can_access_loja($loja_id)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Sem permissão.'], 403);
  }
  $result = Agenda_Compartilhada_Handler::delete_evento($id, $loja_id, $user->ID, $is_admin);
  if (is_wp_error($result)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $result->get_error_message()], (int) ($result->get_error_data()['status'] ?? 400));
  }
  return new WP_REST_Response(['success' => true], 200);
}
