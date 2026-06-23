<?php
/**
 * Endpoints REST — Pós-Venda
 *
 * GET    /api/v1/pos-vendas                       — lista (autenticado)
 * POST   /api/v1/pos-vendas                       — cria registro (autenticado)
 * GET    /api/v1/pos-vendas/{id}                  — detalhe (autenticado)
 * PATCH  /api/v1/pos-vendas/{id}                  — atualiza etapa/responsável (autenticado)
 *
 * GET    /api/v1/pos-vendas/{id}/historico        — lista histórico (autenticado)
 * POST   /api/v1/pos-vendas/{id}/historico        — adiciona comentário (autenticado)
 *
 * GET    /api/v1/pos-vendas/{id}/notas            — lista notas (autenticado)
 * POST   /api/v1/pos-vendas/{id}/notas            — adiciona nota (autenticado)
 * DELETE /api/v1/pos-venda-notas/{id}             — exclui nota (autenticado)
 *
 * GET    /api/v1/pos-vendas/{id}/assistencias     — lista assistências (autenticado)
 * POST   /api/v1/pos-vendas/{id}/assistencias     — cria assistência (autenticado)
 * PATCH  /api/v1/pos-venda-assistencias/{id}      — atualiza assistência (autenticado)
 *
 * GET    /api/v1/pos-venda-colunas                — lista colunas (autenticado)
 * POST   /api/v1/pos-venda-colunas                — cria coluna custom (gerente)
 * PATCH  /api/v1/pos-venda-colunas/{id}/move      — move coluna (gerente)
 * DELETE /api/v1/pos-venda-colunas/{id}           — exclui coluna custom (gerente)
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

// ── registro de rotas ─────────────────────────────────────────────────────────

add_action('rest_api_init', function () {

  // ── pos-vendas (lista + criação) ────────────────────────────────────────
  register_rest_route('api/v1', '/pos-vendas', [
    ['methods' => 'GET',  'callback' => 'mytheme_pos_venda_list',   'permission_callback' => 'mytheme_api_is_authenticated'],
    ['methods' => 'POST', 'callback' => 'mytheme_pos_venda_create', 'permission_callback' => 'mytheme_api_is_authenticated'],
  ]);

  // ── pos-vendas (detalhe + edição) ───────────────────────────────────────
  register_rest_route('api/v1', '/pos-vendas/(?P<id>\d+)', [
    ['methods' => 'GET',   'callback' => 'mytheme_pos_venda_get',    'permission_callback' => 'mytheme_api_is_authenticated'],
    ['methods' => 'PATCH', 'callback' => 'mytheme_pos_venda_update', 'permission_callback' => 'mytheme_api_is_authenticated'],
  ]);

  // ── histórico ────────────────────────────────────────────────────────────
  register_rest_route('api/v1', '/pos-vendas/(?P<id>\d+)/historico', [
    ['methods' => 'GET',  'callback' => 'mytheme_pos_venda_historico_list', 'permission_callback' => 'mytheme_api_is_authenticated'],
    ['methods' => 'POST', 'callback' => 'mytheme_pos_venda_historico_add',  'permission_callback' => 'mytheme_api_is_authenticated'],
  ]);

  // ── notas ────────────────────────────────────────────────────────────────
  register_rest_route('api/v1', '/pos-vendas/(?P<id>\d+)/notas', [
    ['methods' => 'GET',  'callback' => 'mytheme_pos_venda_notas_list', 'permission_callback' => 'mytheme_api_is_authenticated'],
    ['methods' => 'POST', 'callback' => 'mytheme_pos_venda_notas_add',  'permission_callback' => 'mytheme_api_is_authenticated'],
  ]);
  register_rest_route('api/v1', '/pos-venda-notas/(?P<id>\d+)', [
    ['methods' => 'DELETE', 'callback' => 'mytheme_pos_venda_nota_delete', 'permission_callback' => 'mytheme_api_is_authenticated'],
  ]);

  // ── assistências ─────────────────────────────────────────────────────────
  register_rest_route('api/v1', '/pos-vendas/(?P<id>\d+)/assistencias', [
    ['methods' => 'GET',  'callback' => 'mytheme_pos_venda_asst_list',   'permission_callback' => 'mytheme_api_is_authenticated'],
    ['methods' => 'POST', 'callback' => 'mytheme_pos_venda_asst_create', 'permission_callback' => 'mytheme_api_is_authenticated'],
  ]);
  register_rest_route('api/v1', '/pos-venda-assistencias/(?P<id>\d+)', [
    ['methods' => 'PATCH', 'callback' => 'mytheme_pos_venda_asst_update', 'permission_callback' => 'mytheme_api_is_authenticated'],
  ]);

  // ── colunas ──────────────────────────────────────────────────────────────
  register_rest_route('api/v1', '/pos-venda-colunas', [
    ['methods' => 'GET',  'callback' => 'mytheme_pos_venda_col_list',   'permission_callback' => 'mytheme_api_is_authenticated'],
    ['methods' => 'POST', 'callback' => 'mytheme_pos_venda_col_create', 'permission_callback' => 'mytheme_api_is_gerente'],
  ]);
  register_rest_route('api/v1', '/pos-venda-colunas/(?P<id>\d+)/move', [
    ['methods' => 'PATCH', 'callback' => 'mytheme_pos_venda_col_move', 'permission_callback' => 'mytheme_api_is_gerente'],
  ]);
  register_rest_route('api/v1', '/pos-venda-colunas/(?P<id>\d+)', [
    ['methods' => 'DELETE', 'callback' => 'mytheme_pos_venda_col_delete', 'permission_callback' => 'mytheme_api_is_gerente'],
  ]);
});

// ── helpers internos ──────────────────────────────────────────────────────────

function mytheme_pv_current_user(): array
{
  $user    = wp_get_current_user();
  $user_id = (int) $user->ID;
  $is_admin = in_array('administrator', (array) $user->roles, true);

  $perfil     = crm_get_perfil_acesso($user_id);
  $is_gerente = $is_admin
    || ($perfil && in_array($perfil['nivel_atribuicao'], CRM_NIVEIS_GERENTE, true))
    || (bool) get_user_meta($user_id, 'is_gerente', true);

  return [
    'id'         => $user_id,
    'nome'       => $user->display_name,
    'is_gerente' => $is_gerente,
  ];
}

function mytheme_pv_loja_ids_for_user(): array
{
  $user = wp_get_current_user();
  if (in_array('administrator', (array) $user->roles, true)) {
    global $wpdb;
    $ids = $wpdb->get_col("SELECT DISTINCT loja_id FROM {$wpdb->prefix}pos_vendas WHERE loja_id > 0");
    return array_map('intval', $ids ?: []);
  }
  $ids = get_user_meta($user->ID, 'loja_ids', true);
  if (is_array($ids)) return array_map('intval', $ids);
  $single = get_user_meta($user->ID, 'loja_id', true);
  return $single ? [(int) $single] : [];
}

// ── handlers: pos-vendas ─────────────────────────────────────────────────────

function mytheme_pos_venda_list(WP_REST_Request $req): WP_REST_Response
{
  $cu = mytheme_pv_current_user();

  $loja_ids_param = $req->get_param('loja_ids');
  if ($loja_ids_param) {
    $loja_ids = array_map('intval', explode(',', $loja_ids_param));
  } else {
    $loja_ids = mytheme_pv_loja_ids_for_user();
  }

  if (empty($loja_ids)) {
    return new WP_REST_Response(['success' => true, 'items' => [], 'total' => 0], 200);
  }

  $params = [];

  // Vendedores só veem os próprios projetos
  if (!$cu['is_gerente']) {
    $params['responsavel_id'] = $cu['id'];
  } elseif ($req->get_param('responsavel_id')) {
    $params['responsavel_id'] = intval($req->get_param('responsavel_id'));
  }

  if ($req->get_param('etapa'))  $params['etapa']  = sanitize_text_field($req->get_param('etapa'));
  if ($req->get_param('search')) $params['search'] = sanitize_text_field($req->get_param('search'));

  $result = Pos_Venda_Handler::get_many($loja_ids, $params);

  return new WP_REST_Response(['success' => true, ...$result], 200);
}

function mytheme_pos_venda_create(WP_REST_Request $req): WP_REST_Response
{
  $cu     = mytheme_pv_current_user();
  $body   = json_decode($req->get_body(), true) ?: [];
  $lead_id = intval($body['lead_id'] ?? 0);
  $loja_id = intval($body['loja_id'] ?? 0);

  if (!$lead_id || !$loja_id) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'lead_id e loja_id são obrigatórios.'], 400);
  }

  $result = Pos_Venda_Handler::create($lead_id, $loja_id, $cu['id'], $cu['nome']);

  if (is_wp_error($result)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $result->get_error_message()], $result->get_error_data()['status'] ?? 500);
  }

  return new WP_REST_Response(['success' => true, 'data' => $result], 201);
}

function mytheme_pos_venda_get(WP_REST_Request $req): WP_REST_Response
{
  $cu = mytheme_pv_current_user();
  $id = intval($req->get_param('id'));

  $pv = Pos_Venda_Handler::get_by_id($id);
  if (!$pv) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Não encontrado.'], 404);
  }

  // Vendedor só acessa os próprios
  if (!$cu['is_gerente'] && (int)($pv['responsavel_id'] ?? 0) !== $cu['id']) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Sem permissão.'], 403);
  }

  return new WP_REST_Response(['success' => true, 'data' => $pv], 200);
}

function mytheme_pos_venda_update(WP_REST_Request $req): WP_REST_Response
{
  $cu   = mytheme_pv_current_user();
  $id   = intval($req->get_param('id'));
  $body = json_decode($req->get_body(), true) ?: [];

  $pv = Pos_Venda_Handler::get_by_id($id);
  if (!$pv) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Não encontrado.'], 404);
  }

  if (!$cu['is_gerente'] && (int)($pv['responsavel_id'] ?? 0) !== $cu['id']) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Sem permissão.'], 403);
  }

  if (!empty($body['etapa'])) {
    $result = Pos_Venda_Handler::update_etapa(
      $id,
      sanitize_text_field($body['etapa']),
      $cu['id'],
      $cu['nome'],
      sanitize_text_field($body['comentario'] ?? '')
    );
    if (is_wp_error($result)) {
      return new WP_REST_Response(['success' => false, 'mensagem' => $result->get_error_message()], $result->get_error_data()['status'] ?? 500);
    }
  }

  if (!empty($body['responsavel_id']) && $cu['is_gerente']) {
    Pos_Venda_Handler::update_responsavel($id, intval($body['responsavel_id']), sanitize_text_field($body['responsavel_nome'] ?? ''));
  }

  $updated = Pos_Venda_Handler::get_by_id($id);
  return new WP_REST_Response(['success' => true, 'data' => $updated], 200);
}

// ── handlers: histórico ──────────────────────────────────────────────────────

function mytheme_pos_venda_historico_list(WP_REST_Request $req): WP_REST_Response
{
  $id = intval($req->get_param('id'));
  $historico = Pos_Venda_Handler::get_historico($id);
  return new WP_REST_Response(['success' => true, 'data' => $historico], 200);
}

function mytheme_pos_venda_historico_add(WP_REST_Request $req): WP_REST_Response
{
  $cu   = mytheme_pv_current_user();
  $id   = intval($req->get_param('id'));
  $body = json_decode($req->get_body(), true) ?: [];

  $comentario = sanitize_textarea_field($body['comentario'] ?? '');
  if (empty($comentario)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Comentário é obrigatório.'], 400);
  }

  $pv = Pos_Venda_Handler::get_by_id($id);
  if (!$pv) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Não encontrado.'], 404);
  }

  Pos_Venda_Handler::add_historico($id, null, $pv['etapa'], $cu['id'], $cu['nome'], $comentario);

  return new WP_REST_Response(['success' => true, 'mensagem' => 'Comentário adicionado.'], 201);
}

// ── handlers: notas ───────────────────────────────────────────────────────────

function mytheme_pos_venda_notas_list(WP_REST_Request $req): WP_REST_Response
{
  $id = intval($req->get_param('id'));
  return new WP_REST_Response(['success' => true, 'data' => Pos_Venda_Handler::get_notas($id)], 200);
}

function mytheme_pos_venda_notas_add(WP_REST_Request $req): WP_REST_Response
{
  $cu   = mytheme_pv_current_user();
  $id   = intval($req->get_param('id'));
  $body = json_decode($req->get_body(), true) ?: [];

  $result = Pos_Venda_Handler::add_nota($id, $body['conteudo'] ?? '', $cu['id'], $cu['nome']);

  if (is_wp_error($result)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $result->get_error_message()], $result->get_error_data()['status'] ?? 500);
  }

  return new WP_REST_Response(['success' => true, 'data' => $result], 201);
}

function mytheme_pos_venda_nota_delete(WP_REST_Request $req): WP_REST_Response
{
  $cu = mytheme_pv_current_user();
  $id = intval($req->get_param('id'));

  $result = Pos_Venda_Handler::delete_nota($id, $cu['id'], $cu['is_gerente']);

  if (is_wp_error($result)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $result->get_error_message()], $result->get_error_data()['status'] ?? 500);
  }

  return new WP_REST_Response(['success' => true, 'mensagem' => 'Anotação excluída.'], 200);
}

// ── handlers: assistências ────────────────────────────────────────────────────

function mytheme_pos_venda_asst_list(WP_REST_Request $req): WP_REST_Response
{
  $id = intval($req->get_param('id'));
  return new WP_REST_Response(['success' => true, 'data' => Pos_Venda_Handler::get_assistencias($id)], 200);
}

function mytheme_pos_venda_asst_create(WP_REST_Request $req): WP_REST_Response
{
  $cu   = mytheme_pv_current_user();
  $id   = intval($req->get_param('id'));
  $body = json_decode($req->get_body(), true) ?: [];

  $result = Pos_Venda_Handler::create_assistencia($id, $body, $cu['id'], $cu['nome']);

  if (is_wp_error($result)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $result->get_error_message()], $result->get_error_data()['status'] ?? 500);
  }

  return new WP_REST_Response(['success' => true, 'data' => $result], 201);
}

function mytheme_pos_venda_asst_update(WP_REST_Request $req): WP_REST_Response
{
  $cu   = mytheme_pv_current_user();
  $id   = intval($req->get_param('id'));
  $body = json_decode($req->get_body(), true) ?: [];

  $result = Pos_Venda_Handler::update_assistencia($id, $body, $cu['id']);

  if (is_wp_error($result)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $result->get_error_message()], $result->get_error_data()['status'] ?? 500);
  }

  return new WP_REST_Response(['success' => true, 'mensagem' => 'Assistência atualizada.'], 200);
}

// ── handlers: colunas ─────────────────────────────────────────────────────────

function mytheme_pos_venda_col_list(WP_REST_Request $req): WP_REST_Response
{
  $loja_id = intval($req->get_param('loja_id'));
  if (!$loja_id) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'loja_id é obrigatório.'], 400);
  }
  return new WP_REST_Response(['success' => true, 'data' => Pos_Venda_Handler::get_columns($loja_id)], 200);
}

function mytheme_pos_venda_col_create(WP_REST_Request $req): WP_REST_Response
{
  $body     = json_decode($req->get_body(), true) ?: [];
  $loja_id  = intval($body['loja_id'] ?? 0);
  $label    = sanitize_text_field($body['label'] ?? '');
  $cor      = sanitize_text_field($body['cor'] ?? 'gray');
  $after_id = isset($body['after_id']) ? intval($body['after_id']) : null;

  if (!$loja_id) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'loja_id é obrigatório.'], 400);
  }

  $result = Pos_Venda_Handler::create_column($loja_id, $label, $cor, $after_id);

  if (is_wp_error($result)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $result->get_error_message()], $result->get_error_data()['status'] ?? 500);
  }

  return new WP_REST_Response(['success' => true, 'data' => $result], 201);
}

function mytheme_pos_venda_col_move(WP_REST_Request $req): WP_REST_Response
{
  $id        = intval($req->get_param('id'));
  $body      = json_decode($req->get_body(), true) ?: [];
  $loja_id   = intval($body['loja_id'] ?? 0);
  $direction = sanitize_text_field($body['direction'] ?? '');

  if (!$loja_id || !in_array($direction, ['left', 'right'], true)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'loja_id e direction (left|right) são obrigatórios.'], 400);
  }

  $result = Pos_Venda_Handler::move_column($id, $loja_id, $direction);

  if (is_wp_error($result)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $result->get_error_message()], $result->get_error_data()['status'] ?? 500);
  }

  return new WP_REST_Response(['success' => true, 'data' => Pos_Venda_Handler::get_columns($loja_id)], 200);
}

function mytheme_pos_venda_col_delete(WP_REST_Request $req): WP_REST_Response
{
  $id      = intval($req->get_param('id'));
  $loja_id = intval($req->get_param('loja_id'));

  if (!$loja_id) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'loja_id é obrigatório.'], 400);
  }

  $result = Pos_Venda_Handler::delete_column($id, $loja_id);

  if (is_wp_error($result)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $result->get_error_message()], $result->get_error_data()['status'] ?? 500);
  }

  return new WP_REST_Response(['success' => true, 'mensagem' => 'Etapa excluída.'], 200);
}
