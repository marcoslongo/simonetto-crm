<?php
/**
 * Endpoints REST de Comissões
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

add_action('rest_api_init', function () {

  // GET  /api/v1/comissoes/config?loja_id=
  // POST /api/v1/comissoes/config
  register_rest_route('api/v1', '/comissoes/config', [
    [
      'methods'             => 'GET',
      'callback'            => 'mytheme_api_get_comissao_config',
      'permission_callback' => 'mytheme_api_is_gerente',
    ],
    [
      'methods'             => 'POST',
      'callback'            => 'mytheme_api_save_comissao_config',
      'permission_callback' => 'mytheme_api_is_gerente',
    ],
  ]);

  // GET /api/v1/comissoes/preview?loja_id=&periodo_inicio=&periodo_fim=
  register_rest_route('api/v1', '/comissoes/preview', [
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_comissao_preview',
    'permission_callback' => 'mytheme_api_is_gerente',
  ]);

  // POST /api/v1/comissoes/fechar
  register_rest_route('api/v1', '/comissoes/fechar', [
    'methods'             => 'POST',
    'callback'            => 'mytheme_api_comissao_fechar',
    'permission_callback' => 'mytheme_api_is_gerente',
  ]);

  // GET /api/v1/comissoes/fechamentos?loja_id=&status=
  register_rest_route('api/v1', '/comissoes/fechamentos', [
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_comissao_list_fechamentos',
    'permission_callback' => 'mytheme_api_is_gerente',
  ]);

  // PATCH /api/v1/comissoes/fechamentos/{id}/aprovar
  register_rest_route('api/v1', '/comissoes/fechamentos/(?P<id>\d+)/aprovar', [
    'methods'             => 'PATCH',
    'callback'            => 'mytheme_api_comissao_aprovar',
    'permission_callback' => 'mytheme_api_is_gerente',
  ]);

  // PATCH /api/v1/comissoes/fechamentos/{id}/pagar
  register_rest_route('api/v1', '/comissoes/fechamentos/(?P<id>\d+)/pagar', [
    'methods'             => 'PATCH',
    'callback'            => 'mytheme_api_comissao_pagar',
    'permission_callback' => 'mytheme_api_is_gerente',
  ]);
});

// ─── Callbacks ───────────────────────────────────────────────────────────────

function mytheme_api_get_comissao_config(WP_REST_Request $request): WP_REST_Response
{
  $loja_id = intval($request->get_param('loja_id'));
  if (!$loja_id) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'loja_id obrigatório.'], 400);
  }

  $config = Comissao_Handler::get_config($loja_id);
  return new WP_REST_Response(['success' => true, 'config' => $config], 200);
}

function mytheme_api_save_comissao_config(WP_REST_Request $request): WP_REST_Response
{
  $params  = $request->get_json_params();
  $loja_id = intval($params['loja_id'] ?? 0);

  if (!$loja_id) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'loja_id obrigatório.'], 400);
  }
  if (!isset($params['config']) || !is_array($params['config'])) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'config obrigatório.'], 400);
  }

  Comissao_Handler::save_config($loja_id, $params['config']);
  return new WP_REST_Response(['success' => true, 'mensagem' => 'Configuração de comissões salva.'], 200);
}

function mytheme_api_comissao_preview(WP_REST_Request $request): WP_REST_Response
{
  $loja_id        = intval($request->get_param('loja_id'));
  $periodo_inicio = sanitize_text_field($request->get_param('periodo_inicio') ?: date('Y-m-01'));
  $periodo_fim    = sanitize_text_field($request->get_param('periodo_fim')    ?: date('Y-m-t'));

  if (!$loja_id) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'loja_id obrigatório.'], 400);
  }

  $config = Comissao_Handler::get_config($loja_id);
  $itens  = Comissao_Handler::calcular_preview($loja_id, $periodo_inicio, $periodo_fim, [], $config);

  return new WP_REST_Response([
    'success'        => true,
    'config'         => $config,
    'itens'          => $itens,
    'periodo_inicio' => $periodo_inicio,
    'periodo_fim'    => $periodo_fim,
  ], 200);
}

function mytheme_api_comissao_fechar(WP_REST_Request $request): WP_REST_Response
{
  $params         = $request->get_json_params();
  $loja_id        = intval($params['loja_id'] ?? 0);
  $periodo_inicio = sanitize_text_field($params['periodo_inicio'] ?? '');
  $periodo_fim    = sanitize_text_field($params['periodo_fim']    ?? '');
  $itens          = (array) ($params['itens'] ?? []);

  if (!$loja_id || !$periodo_inicio || !$periodo_fim) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'loja_id, periodo_inicio e periodo_fim são obrigatórios.',
    ], 400);
  }

  if (empty($itens)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Nenhum item informado.'], 400);
  }

  $current_user = wp_get_current_user();
  $ids          = Comissao_Handler::fechar_periodo(
    $loja_id,
    $periodo_inicio,
    $periodo_fim,
    $itens,
    $current_user->ID
  );

  return new WP_REST_Response([
    'success'  => true,
    'mensagem' => count($ids) . ' fechamento(s) registrado(s) com sucesso.',
    'ids'      => $ids,
  ], 200);
}

function mytheme_api_comissao_list_fechamentos(WP_REST_Request $request): WP_REST_Response
{
  $args = [];

  if ($request->get_param('loja_id')) {
    $args['loja_id'] = intval($request->get_param('loja_id'));
  }
  if ($request->get_param('status')) {
    $args['status'] = sanitize_text_field($request->get_param('status'));
  }
  if ($request->get_param('usuario_id')) {
    $args['usuario_id'] = intval($request->get_param('usuario_id'));
  }

  $fechamentos = Comissao_Handler::list_fechamentos($args);
  return new WP_REST_Response(['success' => true, 'fechamentos' => $fechamentos], 200);
}

function mytheme_api_comissao_aprovar(WP_REST_Request $request): WP_REST_Response
{
  $id         = intval($request->get_url_params()['id']);
  $fechamento = Comissao_Handler::get_by_id($id);

  if (!$fechamento) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Fechamento não encontrado.'], 404);
  }
  if ($fechamento['status'] !== 'rascunho') {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'Apenas fechamentos em rascunho podem ser aprovados.',
    ], 422);
  }

  $current_user = wp_get_current_user();
  Comissao_Handler::update_status($id, 'aprovado', $current_user->ID);

  return new WP_REST_Response(['success' => true, 'mensagem' => 'Fechamento aprovado.'], 200);
}

function mytheme_api_comissao_pagar(WP_REST_Request $request): WP_REST_Response
{
  $id         = intval($request->get_url_params()['id']);
  $fechamento = Comissao_Handler::get_by_id($id);

  if (!$fechamento) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Fechamento não encontrado.'], 404);
  }
  if ($fechamento['status'] !== 'aprovado') {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'Apenas fechamentos aprovados podem ser marcados como pagos.',
    ], 422);
  }

  $current_user = wp_get_current_user();
  Comissao_Handler::update_status($id, 'pago', $current_user->ID);

  return new WP_REST_Response(['success' => true, 'mensagem' => 'Pagamento registrado.'], 200);
}
