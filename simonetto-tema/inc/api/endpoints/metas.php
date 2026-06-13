<?php
/**
 * Endpoints REST de Metas Comerciais
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

add_action('rest_api_init', function () {

  // GET  /api/v1/metas — listar metas (filtro por loja_id, usuario_id, status)
  // POST /api/v1/metas — criar meta
  register_rest_route('api/v1', '/metas', [
    [
      'methods'             => 'GET',
      'callback'            => 'mytheme_api_list_metas',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
    [
      'methods'             => 'POST',
      'callback'            => 'mytheme_api_create_meta',
      'permission_callback' => 'mytheme_api_is_gerente',
    ],
  ]);

  // GET    /api/v1/metas/dashboard — dashboard consolidado com resultados calculados
  register_rest_route('api/v1', '/metas/dashboard', [
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_metas_dashboard',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ]);

  // GET    /api/v1/metas/{id}
  // PATCH  /api/v1/metas/{id}
  // DELETE /api/v1/metas/{id}
  register_rest_route('api/v1', '/metas/(?P<id>\d+)', [
    [
      'methods'             => 'GET',
      'callback'            => 'mytheme_api_get_meta',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
    [
      'methods'             => 'PATCH',
      'callback'            => 'mytheme_api_update_meta',
      'permission_callback' => 'mytheme_api_is_gerente',
    ],
    [
      'methods'             => 'DELETE',
      'callback'            => 'mytheme_api_delete_meta',
      'permission_callback' => 'mytheme_api_is_gerente',
    ],
  ]);
});

// ─── Callbacks ────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/metas
 */
function mytheme_api_list_metas(WP_REST_Request $request): WP_REST_Response
{
  $args = [];

  if ($request->get_param('loja_id')) {
    $args['loja_id'] = intval($request->get_param('loja_id'));
  }
  if ($request->get_param('status')) {
    $args['status'] = sanitize_text_field($request->get_param('status'));
  }
  if ($request->get_param('tipo')) {
    $args['tipo'] = sanitize_text_field($request->get_param('tipo'));
  }

  // Vendedores veem as próprias metas e as de equipe (usuario_id IS NULL)
  $current_user = wp_get_current_user();
  $is_gerente   = mytheme_api_is_gerente();
  $is_admin     = in_array('administrator', $current_user->roles, true);

  if (!$is_gerente && !$is_admin && isset($args['loja_id'])) {
    $args['usuario_id']    = $current_user->ID;
    $args['include_equipe'] = true;
  }

  $metas = Meta_Comercial_Handler::list($args);

  $com_resultado = array_map(
    [Meta_Comercial_Handler::class, 'com_resultado'],
    $metas
  );

  return new WP_REST_Response(['success' => true, 'metas' => $com_resultado], 200);
}

/**
 * POST /api/v1/metas
 */
function mytheme_api_create_meta(WP_REST_Request $request): WP_REST_Response
{
  $params = $request->get_json_params();

  if (empty($params['nome']) || empty($params['loja_id']) || empty($params['tipo']) || empty($params['valor_meta']) || empty($params['data_inicio']) || empty($params['data_fim'])) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Campos obrigatórios: nome, loja_id, tipo, valor_meta, data_inicio, data_fim.'], 400);
  }

  $id = Meta_Comercial_Handler::create($params);

  if (!$id) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Erro ao criar meta.'], 500);
  }

  $meta = Meta_Comercial_Handler::get_by_id($id);

  return new WP_REST_Response(['success' => true, 'mensagem' => 'Meta criada com sucesso.', 'meta' => $meta], 201);
}

/**
 * GET /api/v1/metas/{id}
 */
function mytheme_api_get_meta(WP_REST_Request $request): WP_REST_Response
{
  $url_params = $request->get_url_params();
  $id         = intval($url_params['id']);
  $meta       = Meta_Comercial_Handler::get_by_id($id);

  if (!$meta) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Meta não encontrada.'], 404);
  }

  return new WP_REST_Response(['success' => true, 'meta' => Meta_Comercial_Handler::com_resultado($meta)], 200);
}

/**
 * PATCH /api/v1/metas/{id}
 */
function mytheme_api_update_meta(WP_REST_Request $request): WP_REST_Response
{
  $url_params = $request->get_url_params();
  $id         = intval($url_params['id']);
  $params     = $request->get_json_params();

  $meta = Meta_Comercial_Handler::get_by_id($id);
  if (!$meta) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Meta não encontrada.'], 404);
  }

  $merged = array_merge($meta, $params);
  $ok     = Meta_Comercial_Handler::update($id, $merged);

  if (!$ok) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Erro ao atualizar meta.'], 500);
  }

  $updated = Meta_Comercial_Handler::get_by_id($id);

  return new WP_REST_Response(['success' => true, 'mensagem' => 'Meta atualizada.', 'meta' => $updated], 200);
}

/**
 * DELETE /api/v1/metas/{id}
 */
function mytheme_api_delete_meta(WP_REST_Request $request): WP_REST_Response
{
  $url_params = $request->get_url_params();
  $id         = intval($url_params['id']);

  if (!Meta_Comercial_Handler::get_by_id($id)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Meta não encontrada.'], 404);
  }

  Meta_Comercial_Handler::delete($id);

  return new WP_REST_Response(['success' => true, 'mensagem' => 'Meta excluída.'], 200);
}

/**
 * GET /api/v1/metas/dashboard
 *
 * Query params: loja_id (obrigatório), periodo (data_inicio/data_fim opcionais)
 */
function mytheme_api_metas_dashboard(WP_REST_Request $request): WP_REST_Response
{
  $loja_id = intval($request->get_param('loja_id'));
  if (!$loja_id) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'loja_id obrigatório.'], 400);
  }

  $current_user = wp_get_current_user();
  $is_gerente   = mytheme_api_is_gerente();
  $is_admin     = in_array('administrator', $current_user->roles, true);

  // Mês corrente como período padrão
  $data_inicio = $request->get_param('data_inicio') ?: date('Y-m-01');
  $data_fim    = $request->get_param('data_fim')    ?: date('Y-m-t');

  // Filtro de metas ativas que cobrem o período
  $args = ['loja_id' => $loja_id, 'status' => 'ativa'];
  if (!$is_gerente && !$is_admin) {
    $args['usuario_id']    = $current_user->ID;
    $args['include_equipe'] = true;
  }

  $metas = Meta_Comercial_Handler::list($args);
  $metas_com_resultado = array_map([Meta_Comercial_Handler::class, 'com_resultado'], $metas);

  // Totais agregados (apenas metas de faturamento para o summary)
  $total_meta      = 0;
  $total_realizado = 0;
  foreach ($metas_com_resultado as $m) {
    if ($m['tipo'] === 'faturamento') {
      $total_meta      += (float) $m['valor_meta'];
      $total_realizado += (float) ($m['valor_realizado'] ?? 0);
    }
  }
  $percentual_geral = $total_meta > 0 ? round(($total_realizado / $total_meta) * 100, 1) : 0;

  // Ranking de faturamento no período
  $ranking_raw = Meta_Comercial_Handler::ranking_faturamento($loja_id, $data_inicio, $data_fim);

  // Enriquecer ranking com meta individual de cada usuário (se houver)
  $metas_por_usuario = [];
  foreach ($metas_com_resultado as $m) {
    if ($m['tipo'] === 'faturamento' && $m['usuario_id'] !== null) {
      $uid = $m['usuario_id'];
      if (!isset($metas_por_usuario[$uid])) {
        $metas_por_usuario[$uid] = 0;
      }
      $metas_por_usuario[$uid] += (float) $m['valor_meta'];
    }
  }

  $ranking = array_map(function ($r) use ($metas_por_usuario) {
    $uid        = $r['usuario_id'];
    $valor_meta = $metas_por_usuario[$uid] ?? 0;
    return [
      'usuario_id'        => $uid,
      'usuario_nome'      => $r['usuario_nome'],
      'valor_realizado'   => $r['valor_realizado'],
      'valor_meta'        => $valor_meta,
      'percentual_atingido' => $valor_meta > 0 ? round(($r['valor_realizado'] / $valor_meta) * 100, 1) : null,
    ];
  }, $ranking_raw);

  // Config do módulo
  $config_raw = get_post_meta($loja_id, '_metas_comerciais_config', true);
  $config     = $config_raw ? (array) json_decode($config_raw, true) : ['ativo' => false];

  return new WP_REST_Response([
    'success'          => true,
    'config'           => $config,
    'metas'            => $metas_com_resultado,
    'total_meta'       => $total_meta,
    'total_realizado'  => $total_realizado,
    'percentual_geral' => $percentual_geral,
    'ranking'          => $ranking,
    'periodo'          => ['data_inicio' => $data_inicio, 'data_fim' => $data_fim],
  ], 200);
}
