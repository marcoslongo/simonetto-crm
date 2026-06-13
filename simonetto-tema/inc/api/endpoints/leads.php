<?php
/**
 * Endpoints REST de Leads
 * 
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

/**
 * Verifica se o usuário está autenticado (qualquer role)
 */
function mytheme_api_is_authenticated()
{
  if (!is_user_logged_in()) {
    return new WP_Error(
      'unauthorized',
      'Você precisa estar autenticado.',
      ['status' => 401]
    );
  }

  return true;
}

add_action('rest_api_init', function () {

  // POST /api/v1/leads — criar lead
  // GET  /api/v1/leads — listar leads
  register_rest_route('api/v1', '/leads', array(
    array(
      'methods' => 'POST',
      'callback' => 'mytheme_api_create_lead',
      'permission_callback' => '__return_true',
    ),
    array(
      'methods' => 'GET',
      'callback' => 'mytheme_api_list_leads',
      'permission_callback' => 'mytheme_api_is_administrator',
    ),
  ));

  // GET    /api/v1/leads/{id} — buscar lead
  // DELETE /api/v1/leads/{id} — excluir lead
  // PATCH  /api/v1/leads/{id} — atualizar loja ou status do lead (somente administrador)
  register_rest_route('api/v1', '/leads/(?P<id>\d+)', array(
    array(
      'methods' => 'GET',
      'callback' => 'mytheme_api_get_lead',
      'permission_callback' => 'mytheme_api_is_administrator',
    ),
    array(
      'methods' => 'DELETE',
      'callback' => 'mytheme_api_delete_lead',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ),
    array(
      'methods' => 'PATCH',
      'callback' => 'mytheme_api_update_lead',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ),
  ));

  // POST /api/v1/lead-contato — registrar contato com lead
  register_rest_route('api/v1', '/lead-contato', array(
    'methods' => 'POST',
    'callback' => 'mytheme_api_register_contact',
    'permission_callback' => '__return_true',
  ));

  // GET /api/v1/leads/{id}/actions — histórico do lead
  register_rest_route('api/v1', '/leads/(?P<id>\d+)/actions', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_get_lead_actions',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ));

  // GET /api/v1/leads-vnr-stats — estatísticas agregadas de venda não realizada
  register_rest_route('api/v1', '/leads-vnr-stats', [
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_leads_vnr_stats',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ]);

  // GET  /api/v1/leads/{id}/venda-nao-realizada — buscar motivos
  // POST /api/v1/leads/{id}/venda-nao-realizada — salvar/atualizar motivos
  register_rest_route('api/v1', '/leads/(?P<id>\d+)/venda-nao-realizada', array(
    array(
      'methods'             => 'GET',
      'callback'            => 'mytheme_api_get_venda_nao_realizada',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ),
    array(
      'methods'             => 'POST',
      'callback'            => 'mytheme_api_save_venda_nao_realizada',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ),
  ));

  // GET  /api/v1/leads/{id}/venda-realizada — buscar dados da venda
  // POST /api/v1/leads/{id}/venda-realizada — salvar/atualizar dados da venda
  // PATCH /api/v1/leads/{id}/venda-realizada — atualizar dados parcialmente
  register_rest_route('api/v1', '/leads/(?P<id>\d+)/venda-realizada', [
    [
      'methods'             => 'GET',
      'callback'            => 'mytheme_api_get_venda_realizada',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
    [
      'methods'             => 'POST,PATCH',
      'callback'            => 'mytheme_api_save_venda_realizada',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
  ]);

  // GET /api/v1/leads-por-estado — stats geográficas com filtro opcional por estado
  register_rest_route('api/v1', '/leads-por-estado', [
    'methods' => 'GET',
    'callback' => 'mytheme_api_leads_por_estado',
    'permission_callback' => 'mytheme_api_is_administrator',
  ]);

  // POST /api/v1/lead-tracking — registrar/atualizar tracking de um lead
  register_rest_route('api/v1', '/lead-tracking', [
    'methods' => 'POST',
    'callback' => 'mytheme_api_save_lead_tracking',
    'permission_callback' => 'mytheme_api_is_administrator',
  ]);

  // GET /api/v1/leads/{id}/tracking — consultar tracking de um lead (admin)
  register_rest_route('api/v1', '/leads/(?P<id>\d+)/tracking', [
    'methods' => 'GET',
    'callback' => 'mytheme_api_get_lead_tracking',
    'permission_callback' => 'mytheme_api_is_administrator',
  ]);

  // GET /api/v1/leads-por-origem — distribuição de leads por utm_source/utm_medium
  register_rest_route('api/v1', '/leads-por-origem', [
    'methods' => 'GET',
    'callback' => 'mytheme_api_leads_por_origem',
    'permission_callback' => 'mytheme_api_is_administrator',
  ]);

  // GET /api/v1/leads/stats — estatísticas agrupadas por data
  register_rest_route('api/v1', '/leads/stats', [
    'methods' => 'GET',
    'callback' => 'mytheme_api_leads_stats',
    'permission_callback' => '__return_true',
  ]);

  // GET /api/v1/leads-classificacao
  register_rest_route('api/v1', '/leads-classificacao', [
    'methods' => 'GET',
    'callback' => 'mytheme_api_leads_classificacao',
    'permission_callback' => 'mytheme_api_is_administrator',
  ]);

  // GET /api/v1/leads-status-total
  register_rest_route('api/v1', '/leads-status-total', [
    'methods' => 'GET',
    'callback' => 'mytheme_api_leads_status_total',
    'permission_callback' => 'mytheme_api_is_administrator',
  ]);

  // GET /api/v1/leads-score-distribuicao — histograma de scores (10 faixas de 10 pontos)
  register_rest_route('api/v1', '/leads-score-distribuicao', [
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_leads_score_distribuicao',
    'permission_callback' => 'mytheme_api_is_administrator',
  ]);

  // GET /api/v1/leads-investimento-classificacao — frio/morno/quente por faixa de investimento
  register_rest_route('api/v1', '/leads-investimento-classificacao', [
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_leads_investimento_classificacao',
    'permission_callback' => 'mytheme_api_is_administrator',
  ]);

  // GET /api/v1/leads-campanhas-utm — top campanhas UTM por volume de leads
  register_rest_route('api/v1', '/leads-campanhas-utm', [
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_leads_campanhas_utm',
    'permission_callback' => 'mytheme_api_is_administrator',
  ]);

  // GET /api/v1/leads-landing-pages — top landing pages ou referrers
  register_rest_route('api/v1', '/leads-landing-pages', [
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_leads_landing_pages',
    'permission_callback' => 'mytheme_api_is_administrator',
  ]);

  // GET /api/v1/leads-tracking-device — Mobile / Desktop / Tablet (user_agent)
  register_rest_route('api/v1', '/leads-tracking-device', [
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_leads_tracking_device',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ]);

  // GET /api/v1/leads-tracking-horario — volume de leads por hora do dia (0–23)
  register_rest_route('api/v1', '/leads-tracking-horario', [
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_leads_tracking_horario',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ]);

  // GET /api/v1/leads-tracking-utm-content — top utm_content por volume
  register_rest_route('api/v1', '/leads-tracking-utm-content', [
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_leads_tracking_utm_content',
    'permission_callback' => 'mytheme_api_is_administrator',
  ]);

  // GET /api/v1/leads-tracking-medium — distribuição por utm_medium
  register_rest_route('api/v1', '/leads-tracking-medium', [
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_leads_tracking_medium',
    'permission_callback' => 'mytheme_api_is_administrator',
  ]);

  // GET /api/v1/influenciadores — métricas por utm_source
  register_rest_route('api/v1', '/influenciadores', [
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_influenciadores',
    'permission_callback' => 'mytheme_api_is_administrator',
  ]);

});




/**
 * Retorna true se o usuário logado é master (administrador + is_master ACF).
 * Não lança erro — use para verificação booleana dentro de callbacks.
 */
function crm_current_user_is_master(): bool
{
  if (!is_user_logged_in()) return false;
  if (!current_user_can('administrator')) return false;
  return (bool) get_field('is_master', 'user_' . get_current_user_id());
}

/**
 * Permission callback: apenas masters (administrador + is_master = true)
 */
function mytheme_api_is_master()
{
  if (!is_user_logged_in()) {
    return new WP_Error('unauthorized', 'Você precisa estar autenticado.', ['status' => 401]);
  }

  if (crm_current_user_is_master()) {
    return true;
  }

  return new WP_Error(
    'forbidden',
    'Acesso negado. Apenas masters podem realizar esta ação.',
    ['status' => 403]
  );
}

/**
 * Verifica se o usuário é administrador OU gerente (is_gerente = true via ACF)
 */
function mytheme_api_is_gerente()
{
  if (!is_user_logged_in()) {
    return new WP_Error(
      'unauthorized',
      'Você precisa estar autenticado.',
      ['status' => 401]
    );
  }

  $user_id = get_current_user_id();

  if (current_user_can('administrator')) {
    return true;
  }

  $is_gerente = (bool) get_field('is_gerente', 'user_' . $user_id);
  if ($is_gerente) {
    return true;
  }

  return new WP_Error(
    'forbidden',
    'Acesso negado. Apenas administradores e gerentes podem realizar esta ação.',
    ['status' => 403]
  );
}

/**
 * Verifica se o usuário autenticado é administrador WordPress
 */
function mytheme_api_is_administrator()
{
  if (!is_user_logged_in()) {
    return new WP_Error(
      'unauthorized',
      'Você precisa estar autenticado.',
      ['status' => 401]
    );
  }

  if (!current_user_can('administrator')) {
    return new WP_Error(
      'forbidden',
      'Acesso negado. Apenas administradores podem realizar esta ação.',
      ['status' => 403]
    );
  }

  return true;
}

/**
 * POST /api/v1/leads
 */
function mytheme_api_create_lead($request)
{
  $params = json_decode($request->get_body(), true);

  if (empty($params)) {
    return new WP_REST_Response([
      'success' => false,
      'mensagem' => 'JSON inválido ou vazio',
    ], 400);
  }

  $result = Lead_Handler::create($params);

  if (is_wp_error($result)) {
    return new WP_REST_Response([
      'success' => false,
      'mensagem' => $result->get_error_message(),
    ], $result->get_error_data()['status']);
  }

  return new WP_REST_Response([
    'success' => true,
    'lead_id' => $result['lead_id'],
    'mensagem' => 'Lead registrado com sucesso!',
    'email_enviado' => $result['email_enviado'],
  ], 201);
}

/**
 * GET /api/v1/leads
 */
function mytheme_api_list_leads($request)
{
  $origem_param = $request->get_param('origem');

  // Administradores sem is_master não podem ver leads de origem 'proprio'
  $is_master = crm_current_user_is_master();
  if (!$is_master) {
    // Se tentou filtrar por 'proprio', retorna vazio diretamente
    if ($origem_param === 'proprio') {
      return new WP_REST_Response([
        'success'     => true,
        'leads'       => [],
        'total'       => 0,
        'page'        => 1,
        'per_page'    => intval($request->get_param('per_page') ?: 20),
        'total_pages' => 0,
      ], 200);
    }
    // Se não filtrou por nenhuma origem, forçamos exclusão de 'proprio'
    if (empty($origem_param)) {
      $origem_param = null; // mantém sem filtro de origem, mas exclui 'proprio' via flag
    }
  }

  $args = [
    'page'            => $request->get_param('page') ?: 1,
    'per_page'        => $request->get_param('per_page') ?: 20,
    'email'           => $request->get_param('email'),
    'loja_id'         => $request->get_param('loja_id'),
    'search'          => $request->get_param('search'),
    'from'            => $request->get_param('from'),
    'to'              => $request->get_param('to'),
    'status'          => $request->get_param('status'),
    'origem'          => $is_master ? $request->get_param('origem') : $origem_param,
    'exclude_proprio' => !$is_master,
  ];

  $result = Lead_Handler::list($args);

  return new WP_REST_Response([
    'success' => true,
    'leads' => $result['leads'],
    'total' => $result['total'],
    'page' => $result['page'],
    'per_page' => $result['per_page'],
    'total_pages' => $result['total_pages'],
  ], 200);
}

/**
 * GET /api/v1/leads/{id}
 */
function mytheme_api_get_lead($request)
{
  $id   = intval($request->get_param('id'));
  $lead = Lead_Handler::get_by_id($id);

  if (!$lead) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'Lead não encontrado.',
    ], 404);
  }

  // Administradores sem is_master não podem acessar leads de origem 'proprio'
  if (!crm_current_user_is_master() && ($lead['origem'] ?? '') === 'proprio') {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'Acesso negado.',
    ], 403);
  }

  return new WP_REST_Response([
    'success' => true,
    'lead'    => $lead,
  ], 200);
}

/**
 * DELETE /api/v1/leads/{id}
 */
function mytheme_api_delete_lead($request)
{
  $id = intval($request->get_param('id'));
  $result = Lead_Handler::delete($id);

  if (is_wp_error($result)) {
    return new WP_REST_Response([
      'success' => false,
      'mensagem' => $result->get_error_message(),
    ], $result->get_error_data()['status']);
  }

  return new WP_REST_Response([
    'success' => true,
    'mensagem' => 'Lead excluído com sucesso.',
  ], 200);
}

/**
 * PATCH /api/v1/leads/{id}
 *
 * Aceita no body:
 *   { "status": "em_negociacao" }          — atualiza status (Kanban)
 *   { "loja_id": 123 }                     — atualiza loja vinculada
 *   { "status": "...", "loja_id": 123 }    — ambos simultaneamente
 */
function mytheme_api_update_lead($request)
{
  $id = intval($request->get_param('id'));
  $params = json_decode($request->get_body(), true);

  if (empty($params)) {
    return new WP_REST_Response([
      'success' => false,
      'mensagem' => 'JSON inválido ou vazio.',
    ], 400);
  }

  // Atualiza status se vier no body
  if (isset($params['status'])) {
    $result = Lead_Handler::update_status($id, $params['status']);

    if (is_wp_error($result)) {
      return new WP_REST_Response([
        'success' => false,
        'mensagem' => $result->get_error_message(),
      ], $result->get_error_data()['status']);
    }

    // Se só veio status, retorna já
    if (!isset($params['loja_id'])) {
      return new WP_REST_Response([
        'success' => true,
        'mensagem' => 'Status atualizado com sucesso.',
        'lead' => $result,
      ], 200);
    }
  }

  // Atualiza loja se vier no body
  if (isset($params['loja_id'])) {
    $result = Lead_Handler::update_loja($id, $params);

    if (is_wp_error($result)) {
      return new WP_REST_Response([
        'success' => false,
        'mensagem' => $result->get_error_message(),
      ], $result->get_error_data()['status']);
    }

    return new WP_REST_Response([
      'success' => true,
      'mensagem' => 'Lead atualizado com sucesso.',
      'lead' => $result,
    ], 200);
  }

  // Atualiza responsável se vier no body
  if (array_key_exists('responsavel_id', $params)) {
    $result = Lead_Handler::update_responsavel($id, $params['responsavel_id']);

    if (is_wp_error($result)) {
      return new WP_REST_Response([
        'success'  => false,
        'mensagem' => $result->get_error_message(),
      ], $result->get_error_data()['status']);
    }

    return new WP_REST_Response([
      'success'  => true,
      'mensagem' => 'Responsável atualizado com sucesso.',
      'lead'     => $result,
    ], 200);
  }

  // Atualiza dados básicos do lead (apenas gerentes e admins)
  if (isset($params['dados'])) {
    if (!mytheme_api_is_gerente()) {
      return new WP_REST_Response([
        'success'  => false,
        'mensagem' => 'Apenas gerentes e administradores podem editar dados do lead.',
      ], 403);
    }

    $result = Lead_Handler::update_dados($id, $params['dados']);

    if (is_wp_error($result)) {
      return new WP_REST_Response([
        'success'  => false,
        'mensagem' => $result->get_error_message(),
      ], $result->get_error_data()['status']);
    }

    return new WP_REST_Response([
      'success'  => true,
      'mensagem' => 'Dados do lead atualizados com sucesso.',
      'lead'     => $result,
    ], 200);
  }

  return new WP_REST_Response([
    'success' => false,
    'mensagem' => 'Nenhum campo válido para atualizar. Use "status", "loja_id", "responsavel_id" ou "dados".',
  ], 400);
}

/**
 * POST /api/v1/lead-contato
 */
function mytheme_api_register_contact($request)
{
  $params = json_decode($request->get_body(), true);

  $result = Lead_Handler::register_contact($params);

  if (is_wp_error($result)) {
    return new WP_REST_Response([
      'success' => false,
      'mensagem' => $result->get_error_message(),
    ], $result->get_error_data()['status']);
  }

  return new WP_REST_Response([
    'success' => true,
    'mensagem' => 'Contato registrado com sucesso.',
  ], 201);
}

/**
 * GET /api/v1/leads/{id}/actions
 */
function mytheme_api_get_lead_actions($request)
{
  global $wpdb;

  $lead_id = intval($request->get_param('id'));
  $table   = $wpdb->prefix . 'leads_actions';

  $actions = $wpdb->get_results(
    $wpdb->prepare(
      "SELECT a.*, u.display_name AS usuario_nome
       FROM {$table} a
       LEFT JOIN {$wpdb->users} u ON u.ID = a.usuario_id
       WHERE a.lead_id = %d
       ORDER BY a.criado_em DESC",
      $lead_id
    ),
    ARRAY_A
  );

  return new WP_REST_Response([
    'success' => true,
    'actions' => $actions,
  ], 200);
}

/**
 * GET /api/v1/leads-por-estado
 */
function mytheme_api_leads_por_estado(WP_REST_Request $request)
{
  global $wpdb;

  $table_leads = $wpdb->prefix . 'leads';

  $estado = sanitize_text_field($request->get_param('estado') ?? '');
  $from = sanitize_text_field($request->get_param('from') ?? '');
  $to = sanitize_text_field($request->get_param('to') ?? '');

  $where_clauses = ["l.estado IS NOT NULL", "l.estado != ''"];
  $prepare_values = [];

  if ($estado) {
    $where_clauses[] = "l.estado = %s";
    $prepare_values[] = strtoupper($estado);
  }

  if ($from) {
    $where_clauses[] = "l.data_criacao >= %s";
    $prepare_values[] = $from . ' 00:00:00';
  }

  if ($to) {
    $where_clauses[] = "l.data_criacao <= %s";
    $prepare_values[] = $to . ' 23:59:59';
  }

  $where_sql = 'WHERE ' . implode(' AND ', $where_clauses);

  $query = "
    SELECT
      l.estado,
      COUNT(l.id)                        AS total,
      GROUP_CONCAT(DISTINCT l.loja_id)   AS loja_ids
    FROM {$table_leads} l
    {$where_sql}
    GROUP BY l.estado
    ORDER BY total DESC
  ";

  $rows = empty($prepare_values)
    ? $wpdb->get_results($query, ARRAY_A)
    : $wpdb->get_results($wpdb->prepare($query, ...$prepare_values), ARRAY_A);

  if ($wpdb->last_error) {
    return new WP_REST_Response([
      'success' => false,
      'mensagem' => 'Erro ao consultar banco de dados: ' . $wpdb->last_error,
    ], 500);
  }

  $data = [];

  foreach ($rows as $row) {
    $lojas = [];
    $loja_ids = array_filter(explode(',', $row['loja_ids'] ?? ''));

    foreach ($loja_ids as $loja_id) {
      $loja_id = intval($loja_id);
      if (!$loja_id)
        continue;

      $loja = get_post($loja_id);
      if (!$loja || $loja->post_type !== 'lojas')
        continue;

      $loja_where = $where_sql . " AND l.loja_id = %d";
      $loja_values = array_merge($prepare_values, [$loja_id]);

      $loja_total = $wpdb->get_var(
        $wpdb->prepare(
          "SELECT COUNT(l.id) FROM {$table_leads} l {$loja_where}",
          ...$loja_values
        )
      );

      $lojas[] = [
        'id' => $loja_id,
        'nome' => $loja->post_title,
        'leads' => (int) $loja_total,
      ];
    }

    usort($lojas, fn($a, $b) => $b['leads'] - $a['leads']);

    $data[] = [
      'estado' => $row['estado'],
      'total' => (int) $row['total'],
      'lojas' => $lojas,
    ];
  }

  return new WP_REST_Response([
    'success' => true,
    'total' => count($data),
    'data' => $data,
  ], 200);
}

/**
 * POST /api/v1/lead-tracking
 *
 * Body JSON esperado:
 * {
 *   "lead_id":      123,
 *   "utm_source":   "google",
 *   "utm_medium":   "cpc",
 *   "utm_campaign": "black-friday",
 *   "utm_content":  "banner-topo",
 *   "utm_term":     "franquia",
 *   "referrer":     "https://google.com",
 *   "landing_page": "https://seusite.com/franquia",
 *   "user_agent":   "Mozilla/5.0 ..."  // opcional, capturado automaticamente se omitido
 * }
 */
function mytheme_api_save_lead_tracking(WP_REST_Request $request)
{
  $params = json_decode($request->get_body(), true);

  if (empty($params) || empty($params['lead_id'])) {
    return new WP_REST_Response([
      'success' => false,
      'mensagem' => 'JSON inválido ou lead_id não informado.',
    ], 400);
  }

  $lead_id = intval($params['lead_id']);
  unset($params['lead_id']);

  $result = Lead_Tracking_Handler::save($lead_id, $params, $request);

  if (is_wp_error($result)) {
    return new WP_REST_Response([
      'success' => false,
      'mensagem' => $result->get_error_message(),
    ], $result->get_error_data()['status']);
  }

  return new WP_REST_Response([
    'success' => true,
    'mensagem' => 'Tracking registrado com sucesso.',
    'tracking' => $result,
  ], 201);
}

/**
 * GET /api/v1/leads/{id}/tracking
 */
function mytheme_api_get_lead_tracking(WP_REST_Request $request)
{
  $lead_id = intval($request->get_param('id'));
  $tracking = Lead_Tracking_Handler::get_by_lead_id($lead_id);

  if (!$tracking) {
    return new WP_REST_Response([
      'success' => false,
      'mensagem' => 'Nenhum tracking encontrado para este lead.',
    ], 404);
  }

  return new WP_REST_Response([
    'success' => true,
    'tracking' => $tracking,
  ], 200);
}

/**
 * GET /api/v1/leads-por-origem
 *
 * Query params opcionais:
 *   from  — yyyy-MM-dd
 *   to    — yyyy-MM-dd
 */
function mytheme_api_leads_por_origem(WP_REST_Request $request)
{
  global $wpdb;

  $table_leads = $wpdb->prefix . 'leads';
  $table_tracking = $wpdb->prefix . 'lead_tracking';

  $from = sanitize_text_field($request->get_param('from') ?? '');
  $to = sanitize_text_field($request->get_param('to') ?? '');

  $where_clauses = [];
  $prepare_values = [];

  // Administradores sem is_master não veem leads de origem 'proprio'
  if (current_user_can('administrator') && !crm_current_user_is_master()) {
    $where_clauses[] = "l.origem != 'proprio'";
  }

  if ($from) {
    $where_clauses[] = "l.data_criacao >= %s";
    $prepare_values[] = $from . ' 00:00:00';
  }

  if ($to) {
    $where_clauses[] = "l.data_criacao <= %s";
    $prepare_values[] = $to . ' 23:59:59';
  }

  $where_sql = !empty($where_clauses)
    ? 'WHERE ' . implode(' AND ', $where_clauses)
    : '';

  $query = "
    SELECT
      COALESCE(t.utm_source, '(direto)')  AS utm_source,
      COALESCE(t.utm_medium, '')          AS utm_medium,
      COUNT(l.id)                         AS total,
      ROUND(COUNT(l.id) * 100.0 /
        SUM(COUNT(l.id)) OVER(), 1)       AS pct
    FROM {$table_leads} l
    LEFT JOIN {$table_tracking} t ON t.lead_id = l.id
    {$where_sql}
    GROUP BY t.utm_source, t.utm_medium
    ORDER BY total DESC
  ";

  $rows = empty($prepare_values)
    ? $wpdb->get_results($query, ARRAY_A)
    : $wpdb->get_results($wpdb->prepare($query, ...$prepare_values), ARRAY_A);

  if ($wpdb->last_error) {
    return new WP_REST_Response([
      'success' => false,
      'mensagem' => 'Erro ao consultar banco de dados: ' . $wpdb->last_error,
    ], 500);
  }

  $data = array_map(function ($row) {
    return [
      'utm_source' => $row['utm_source'],
      'utm_medium' => $row['utm_medium'],
      'total' => (int) $row['total'],
      'pct' => (float) $row['pct'],
    ];
  }, $rows);

  return new WP_REST_Response([
    'success' => true,
    'total' => count($data),
    'data' => $data,
  ], 200);
}

/**
 * GET /api/v1/leads/stats
 * Query params: from (yyyy-MM-dd), to (yyyy-MM-dd), loja_id (opcional)
 */
function mytheme_api_leads_stats(WP_REST_Request $request)
{
  global $wpdb;

  $from = sanitize_text_field($request->get_param('from') ?? '');
  $to = sanitize_text_field($request->get_param('to') ?? '');
  $loja_id = intval($request->get_param('loja_id'));
  $origem = sanitize_text_field($request->get_param('origem') ?? '');
  $allowed_origem = ['industria', 'proprio'];
  if (!in_array($origem, $allowed_origem, true)) {
    $origem = '';
  }

  if (!$from || !$to) {
    return new WP_REST_Response([
      'success' => false,
      'mensagem' => 'Parâmetros from e to são obrigatórios.',
    ], 400);
  }

  $table = $wpdb->prefix . 'leads';

  $where_clauses = ["data_criacao >= %s", "data_criacao <= %s"];
  $prepare_values = [$from . ' 00:00:00', $to . ' 23:59:59'];

  if ($loja_id) {
    $where_clauses[] = "loja_id = %d";
    $prepare_values[] = $loja_id;
  }

  if ($origem) {
    $where_clauses[] = "origem = %s";
    $prepare_values[] = $origem;
  }

  $where_sql = 'WHERE ' . implode(' AND ', $where_clauses);

  $rows = $wpdb->get_results($wpdb->prepare(
    "SELECT DATE(data_criacao) AS data, COUNT(*) AS total
     FROM {$table}
     {$where_sql}
     GROUP BY DATE(data_criacao)
     ORDER BY data ASC",
    ...$prepare_values
  ), ARRAY_A);

  if ($wpdb->last_error) {
    return new WP_REST_Response([
      'success' => false,
      'mensagem' => 'Erro ao consultar banco: ' . $wpdb->last_error,
    ], 500);
  }

  return new WP_REST_Response([
    'success' => true,
    'data' => $rows,
  ], 200);
}

/**
 * GET /api/v1/leads-classificacao
 *
 * Retorna totalizadores por classificação:
 * frio, morno, quente
 *
 * Query params opcionais:
 *  - loja_id
 *  - from (yyyy-MM-dd)
 *  - to   (yyyy-MM-dd)
 */
function mytheme_api_leads_classificacao(WP_REST_Request $request)
{
  global $wpdb;

  $table = $wpdb->prefix . 'leads';

  $loja_id = intval($request->get_param('loja_id'));
  $from = sanitize_text_field($request->get_param('from') ?? '');
  $to = sanitize_text_field($request->get_param('to') ?? '');

  $where_clauses = [];
  $prepare_values = [];

  if ($loja_id) {
    $where_clauses[] = "loja_id = %d";
    $prepare_values[] = $loja_id;
  }

  if ($from) {
    $where_clauses[] = "data_criacao >= %s";
    $prepare_values[] = $from . ' 00:00:00';
  }

  if ($to) {
    $where_clauses[] = "data_criacao <= %s";
    $prepare_values[] = $to . ' 23:59:59';
  }

  $where_sql = !empty($where_clauses)
    ? 'WHERE ' . implode(' AND ', $where_clauses)
    : '';

  $query = "
    SELECT 
      classificacao,
      COUNT(*) as total
    FROM {$table}
    {$where_sql}
    GROUP BY classificacao
  ";

  $rows = empty($prepare_values)
    ? $wpdb->get_results($query, ARRAY_A)
    : $wpdb->get_results($wpdb->prepare($query, ...$prepare_values), ARRAY_A);

  if ($wpdb->last_error) {
    return new WP_REST_Response([
      'success' => false,
      'mensagem' => 'Erro ao consultar banco: ' . $wpdb->last_error,
    ], 500);
  }

  // Normaliza saída (garante que sempre tenha todos)
  $data = [
    'frio' => 0,
    'morno' => 0,
    'quente' => 0,
  ];

  foreach ($rows as $row) {
    $data[$row['classificacao']] = (int) $row['total'];
  }

  return new WP_REST_Response([
    'success' => true,
    'data' => $data,
    'total' => array_sum($data),
  ], 200);
}


/**
 * GET /api/v1/leads-status-total
 * Retorna o total de leads agrupados por status para o Kanban
 */
function mytheme_api_leads_status_total(WP_REST_Request $request)
{
  global $wpdb;

  $table = $wpdb->prefix . 'leads';

  // Filtros opcionais (seguindo sua lógica de outros endpoints)
  $loja_id = intval($request->get_param('loja_id'));
  $from = sanitize_text_field($request->get_param('from') ?? '');
  $to = sanitize_text_field($request->get_param('to') ?? '');
  $origem_param = $request->get_param('origem');
  if ($origem_param && !in_array($origem_param, ['industria', 'proprio'], true)) {
    $origem_param = null;
  }

  $is_admin_non_master = current_user_can('administrator') && !crm_current_user_is_master();

  // Admin não-master solicitando dados de leads próprios: retorna zeros
  if ($is_admin_non_master && $origem_param === 'proprio') {
    return new WP_REST_Response([
      'success' => true,
      'data' => ['nao_atendido' => 0, 'em_negociacao' => 0, 'venda_realizada' => 0, 'venda_nao_realizada' => 0],
      'total_geral' => 0,
    ], 200);
  }

  $where_clauses = [];
  $prepare_values = [];

  if ($loja_id) {
    $where_clauses[] = "loja_id = %d";
    $prepare_values[] = $loja_id;
  }

  if ($from) {
    $where_clauses[] = "data_criacao >= %s";
    $prepare_values[] = $from . ' 00:00:00';
  }

  if ($to) {
    $where_clauses[] = "data_criacao <= %s";
    $prepare_values[] = $to . ' 23:59:59';
  }

  if ($origem_param) {
    $where_clauses[] = "origem = %s";
    $prepare_values[] = $origem_param;
  } elseif ($is_admin_non_master) {
    $where_clauses[] = "origem != 'proprio'";
  }

  $where_sql = !empty($where_clauses)
    ? 'WHERE ' . implode(' AND ', $where_clauses)
    : '';

  $query = "
        SELECT 
            status, 
            COUNT(*) as total 
        FROM {$table}
        {$where_sql}
        GROUP BY status
    ";

  $rows = empty($prepare_values)
    ? $wpdb->get_results($query, ARRAY_A)
    : $wpdb->get_results($wpdb->prepare($query, ...$prepare_values), ARRAY_A);

  if ($wpdb->last_error) {
    return new WP_REST_Response([
      'success' => false,
      'mensagem' => 'Erro ao consultar banco: ' . $wpdb->last_error,
    ], 500);
  }

  // Inicializa com as colunas da loja (fixas + customizadas), garantindo zeros
  $data = [];
  if ($loja_id) {
    $colunas = Kanban_Column_Handler::get_columns($loja_id);
    foreach ($colunas as $col) {
      $data[$col['slug']] = 0;
    }
  } else {
    $data = [
      'nao_atendido'        => 0,
      'em_negociacao'       => 0,
      'venda_realizada'     => 0,
      'venda_nao_realizada' => 0,
    ];
  }

  // Preenche com os valores reais do banco
  foreach ($rows as $row) {
    $data[$row['status']] = (int) $row['total'];
  }

  return new WP_REST_Response([
    'success' => true,
    'data' => $data,
    'total_geral' => array_sum($data),
  ], 200);
}

/**
 * GET /api/v1/leads-score-distribuicao
 *
 * Histograma de leads por faixa de score (10 buckets de 10 pontos cada).
 * Query params opcionais: from (yyyy-MM-dd), to (yyyy-MM-dd)
 */
function mytheme_api_leads_score_distribuicao(WP_REST_Request $request)
{
  global $wpdb;

  $table = $wpdb->prefix . 'leads';

  $from = sanitize_text_field($request->get_param('from') ?? '');
  $to   = sanitize_text_field($request->get_param('to')   ?? '');

  $where_clauses  = [];
  $prepare_values = [];

  if ($from) {
    $where_clauses[]  = "data_criacao >= %s";
    $prepare_values[] = $from . ' 00:00:00';
  }
  if ($to) {
    $where_clauses[]  = "data_criacao <= %s";
    $prepare_values[] = $to . ' 23:59:59';
  }

  $where_sql = !empty($where_clauses) ? 'WHERE ' . implode(' AND ', $where_clauses) : '';

  // LEAST garante que score=100 cai no bucket 9 (90+) em vez de criar bucket 10
  $query = "
    SELECT
      LEAST(FLOOR(COALESCE(score, 0) / 10), 9) AS bucket,
      COUNT(*) AS total
    FROM {$table}
    {$where_sql}
    GROUP BY bucket
    ORDER BY bucket ASC
  ";

  $rows = empty($prepare_values)
    ? $wpdb->get_results($query, ARRAY_A)
    : $wpdb->get_results($wpdb->prepare($query, ...$prepare_values), ARRAY_A);

  if ($wpdb->last_error) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $wpdb->last_error], 500);
  }

  $result_map = [];
  foreach ($rows as $row) {
    $result_map[(int) $row['bucket']] = (int) $row['total'];
  }

  $data = [];
  for ($i = 0; $i <= 9; $i++) {
    $label = ($i * 10) . '-' . ($i * 10 + 9);
    if ($i === 9) $label = '90+';

    if ($i <= 1)      $class = 'frio';
    elseif ($i <= 5)  $class = 'morno';
    else              $class = 'quente';

    $data[] = [
      'faixa'         => $label,
      'total'         => $result_map[$i] ?? 0,
      'classificacao' => $class,
    ];
  }

  return new WP_REST_Response(['success' => true, 'data' => $data], 200);
}

/**
 * GET /api/v1/leads-investimento-classificacao
 *
 * Retorna, para cada faixa de investimento, o total de leads
 * separado por classificação (frio / morno / quente).
 * Query params opcionais: from, to
 */
function mytheme_api_leads_investimento_classificacao(WP_REST_Request $request)
{
  global $wpdb;

  $table = $wpdb->prefix . 'leads';

  $from = sanitize_text_field($request->get_param('from') ?? '');
  $to   = sanitize_text_field($request->get_param('to')   ?? '');

  $where_clauses  = [];
  $prepare_values = [];

  if ($from) {
    $where_clauses[]  = "data_criacao >= %s";
    $prepare_values[] = $from . ' 00:00:00';
  }
  if ($to) {
    $where_clauses[]  = "data_criacao <= %s";
    $prepare_values[] = $to . ' 23:59:59';
  }

  $where_sql = !empty($where_clauses) ? 'WHERE ' . implode(' AND ', $where_clauses) : '';

  $query = "
    SELECT
      COALESCE(NULLIF(TRIM(expectativa_investimento), ''), 'Não informado') AS faixa,
      COALESCE(classificacao, 'frio')                                       AS classificacao,
      COUNT(*)                                                               AS total
    FROM {$table}
    {$where_sql}
    GROUP BY faixa, classificacao
  ";

  $rows = empty($prepare_values)
    ? $wpdb->get_results($query, ARRAY_A)
    : $wpdb->get_results($wpdb->prepare($query, ...$prepare_values), ARRAY_A);

  if ($wpdb->last_error) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $wpdb->last_error], 500);
  }

  $pivot = [];
  foreach ($rows as $row) {
    $faixa = $row['faixa'];
    $class = $row['classificacao'];
    if (!isset($pivot[$faixa])) {
      $pivot[$faixa] = ['faixa' => $faixa, 'frio' => 0, 'morno' => 0, 'quente' => 0];
    }
    if (array_key_exists($class, $pivot[$faixa])) {
      $pivot[$faixa][$class] = (int) $row['total'];
    }
  }

  $data = array_values($pivot);

  $order = ['35-50k', '50-100k', '100-150k', '150-200k', 'acima-250k', 'Não informado'];
  usort($data, function ($a, $b) use ($order) {
    $ia = array_search($a['faixa'], $order);
    $ib = array_search($b['faixa'], $order);
    $ia = ($ia !== false) ? $ia : 999;
    $ib = ($ib !== false) ? $ib : 999;
    return $ia - $ib;
  });

  return new WP_REST_Response(['success' => true, 'data' => $data], 200);
}

/**
 * GET /api/v1/leads-campanhas-utm
 *
 * Top N campanhas UTM por volume de leads (join com lead_tracking).
 * Query params opcionais: from, to, limit (padrão 10, máx 20)
 */
function mytheme_api_leads_campanhas_utm(WP_REST_Request $request)
{
  global $wpdb;

  $table_leads    = $wpdb->prefix . 'leads';
  $table_tracking = $wpdb->prefix . 'lead_tracking';

  $from  = sanitize_text_field($request->get_param('from')  ?? '');
  $to    = sanitize_text_field($request->get_param('to')    ?? '');
  $limit = max(1, min(20, intval($request->get_param('limit') ?? 10)));

  $where_clauses  = [];
  $prepare_values = [];

  if ($from) {
    $where_clauses[]  = "l.data_criacao >= %s";
    $prepare_values[] = $from . ' 00:00:00';
  }
  if ($to) {
    $where_clauses[]  = "l.data_criacao <= %s";
    $prepare_values[] = $to . ' 23:59:59';
  }

  $where_sql      = !empty($where_clauses) ? 'WHERE ' . implode(' AND ', $where_clauses) : '';
  $prepare_values[] = $limit;

  $query = "
    SELECT
      COALESCE(NULLIF(t.utm_campaign, ''), '(sem campanha)') AS utm_campaign,
      COUNT(l.id)                                             AS total,
      ROUND(COUNT(l.id) * 100.0 / SUM(COUNT(l.id)) OVER(), 1) AS pct
    FROM {$table_leads} l
    LEFT JOIN {$table_tracking} t ON t.lead_id = l.id
    {$where_sql}
    GROUP BY t.utm_campaign
    ORDER BY total DESC
    LIMIT %d
  ";

  $rows = $wpdb->get_results(
    $wpdb->prepare($query, ...$prepare_values),
    ARRAY_A
  );

  if ($wpdb->last_error) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $wpdb->last_error], 500);
  }

  $data = array_map(function ($row) {
    return [
      'utm_campaign' => $row['utm_campaign'],
      'total'        => (int)   $row['total'],
      'pct'          => (float) $row['pct'],
    ];
  }, $rows);

  return new WP_REST_Response(['success' => true, 'total' => count($data), 'data' => $data], 200);
}

/**
 * GET /api/v1/leads-landing-pages
 *
 * Top N landing pages ou referrers por volume de leads.
 * Query params:
 *   from, to          — filtro de data
 *   tipo              — 'landing_page' (padrão) ou 'referrer'
 *   limit             — máximo de resultados (padrão 10, máx 20)
 */
function mytheme_api_leads_landing_pages(WP_REST_Request $request)
{
  global $wpdb;

  $table_leads    = $wpdb->prefix . 'leads';
  $table_tracking = $wpdb->prefix . 'lead_tracking';

  $from  = sanitize_text_field($request->get_param('from')  ?? '');
  $to    = sanitize_text_field($request->get_param('to')    ?? '');
  $limit = max(1, min(20, intval($request->get_param('limit') ?? 10)));
  $tipo  = sanitize_text_field($request->get_param('tipo')  ?? 'landing_page');

  // Restringe explicitamente a colunas válidas (evita injeção de coluna)
  $campo = ($tipo === 'referrer') ? 'referrer' : 'landing_page';

  $where_clauses  = [];
  $prepare_values = [];

  if ($from) {
    $where_clauses[]  = "l.data_criacao >= %s";
    $prepare_values[] = $from . ' 00:00:00';
  }
  if ($to) {
    $where_clauses[]  = "l.data_criacao <= %s";
    $prepare_values[] = $to . ' 23:59:59';
  }

  $where_sql        = !empty($where_clauses) ? 'WHERE ' . implode(' AND ', $where_clauses) : '';
  $prepare_values[] = $limit;

  // $campo só pode ser 'landing_page' ou 'referrer' — validado acima
  $query = "
    SELECT
      COALESCE(NULLIF(t.{$campo}, ''), '(direto)') AS pagina,
      COUNT(l.id)                                  AS total,
      ROUND(COUNT(l.id) * 100.0 / SUM(COUNT(l.id)) OVER(), 1) AS pct
    FROM {$table_leads} l
    LEFT JOIN {$table_tracking} t ON t.lead_id = l.id
    {$where_sql}
    GROUP BY t.{$campo}
    ORDER BY total DESC
    LIMIT %d
  ";

  $rows = $wpdb->get_results(
    $wpdb->prepare($query, ...$prepare_values),
    ARRAY_A
  );

  if ($wpdb->last_error) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $wpdb->last_error], 500);
  }

  $data = array_map(function ($row) {
    return [
      'pagina' => $row['pagina'],
      'total'  => (int)   $row['total'],
      'pct'    => (float) $row['pct'],
    ];
  }, $rows);

  return new WP_REST_Response(['success' => true, 'total' => count($data), 'data' => $data], 200);
}

/**
 * GET /api/v1/leads-tracking-device
 *
 * Distribuição por tipo de dispositivo detectado via user_agent.
 * Retorna: Mobile | Desktop | Tablet | Desconhecido
 * Query params opcionais: from, to
 */
function mytheme_api_leads_tracking_device(WP_REST_Request $request)
{
  global $wpdb;

  $table_leads    = $wpdb->prefix . 'leads';
  $table_tracking = $wpdb->prefix . 'lead_tracking';

  $from    = sanitize_text_field($request->get_param('from')    ?? '');
  $to      = sanitize_text_field($request->get_param('to')      ?? '');
  $loja_id = intval($request->get_param('loja_id'));

  $where_clauses  = [];
  $prepare_values = [];

  if (current_user_can('administrator') && !crm_current_user_is_master()) {
    $where_clauses[] = "l.origem != 'proprio'";
  }

  if ($from)    { $where_clauses[] = "l.data_criacao >= %s"; $prepare_values[] = $from . ' 00:00:00'; }
  if ($to)      { $where_clauses[] = "l.data_criacao <= %s"; $prepare_values[] = $to   . ' 23:59:59'; }
  if ($loja_id) { $where_clauses[] = "l.loja_id = %d";       $prepare_values[] = $loja_id; }

  $where_sql = !empty($where_clauses) ? 'WHERE ' . implode(' AND ', $where_clauses) : '';

  $query = "
    SELECT
      CASE
        WHEN t.user_agent LIKE '%%iPad%%' OR t.user_agent LIKE '%%Tablet%%'
          THEN 'Tablet'
        WHEN t.user_agent LIKE '%%Mobile%%'
          OR t.user_agent LIKE '%%Android%%'
          OR t.user_agent LIKE '%%iPhone%%'
          OR t.user_agent LIKE '%%webOS%%'
          OR t.user_agent LIKE '%%BlackBerry%%'
          OR t.user_agent LIKE '%%Windows Phone%%'
          THEN 'Mobile'
        WHEN t.user_agent IS NULL OR t.user_agent = ''
          THEN 'Desconhecido'
        ELSE 'Desktop'
      END AS device_type,
      COUNT(l.id)                                               AS total,
      ROUND(COUNT(l.id) * 100.0 / SUM(COUNT(l.id)) OVER(), 1) AS pct
    FROM {$table_leads} l
    LEFT JOIN {$table_tracking} t ON t.lead_id = l.id
    {$where_sql}
    GROUP BY device_type
    ORDER BY total DESC
  ";

  $rows = empty($prepare_values)
    ? $wpdb->get_results($query, ARRAY_A)
    : $wpdb->get_results($wpdb->prepare($query, ...$prepare_values), ARRAY_A);

  if ($wpdb->last_error) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $wpdb->last_error], 500);
  }

  $data = array_map(function ($row) {
    return [
      'device_type' => $row['device_type'],
      'total'       => (int)   $row['total'],
      'pct'         => (float) $row['pct'],
    ];
  }, $rows);

  return new WP_REST_Response(['success' => true, 'data' => $data], 200);
}

/**
 * GET /api/v1/leads-tracking-horario
 *
 * Volume de leads por hora do dia (0–23).
 * Usa created_at do tracking; fallback para data_criacao do lead.
 * Query params opcionais: from, to
 */
function mytheme_api_leads_tracking_horario(WP_REST_Request $request)
{
  global $wpdb;

  $table_leads    = $wpdb->prefix . 'leads';
  $table_tracking = $wpdb->prefix . 'lead_tracking';

  $from    = sanitize_text_field($request->get_param('from')    ?? '');
  $to      = sanitize_text_field($request->get_param('to')      ?? '');
  $loja_id = intval($request->get_param('loja_id'));

  $where_clauses  = [];
  $prepare_values = [];

  if (current_user_can('administrator') && !crm_current_user_is_master()) {
    $where_clauses[] = "l.origem != 'proprio'";
  }

  if ($from)    { $where_clauses[] = "l.data_criacao >= %s"; $prepare_values[] = $from . ' 00:00:00'; }
  if ($to)      { $where_clauses[] = "l.data_criacao <= %s"; $prepare_values[] = $to   . ' 23:59:59'; }
  if ($loja_id) { $where_clauses[] = "l.loja_id = %d";       $prepare_values[] = $loja_id; }

  $where_sql = !empty($where_clauses) ? 'WHERE ' . implode(' AND ', $where_clauses) : '';

  $query = "
    SELECT
      HOUR(COALESCE(t.created_at, l.data_criacao)) AS hora,
      COUNT(l.id)                                   AS total
    FROM {$table_leads} l
    LEFT JOIN {$table_tracking} t ON t.lead_id = l.id
    {$where_sql}
    GROUP BY hora
    ORDER BY hora ASC
  ";

  $rows = empty($prepare_values)
    ? $wpdb->get_results($query, ARRAY_A)
    : $wpdb->get_results($wpdb->prepare($query, ...$prepare_values), ARRAY_A);

  if ($wpdb->last_error) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $wpdb->last_error], 500);
  }

  $map = [];
  foreach ($rows as $row) {
    $map[(int) $row['hora']] = (int) $row['total'];
  }

  $data = [];
  for ($h = 0; $h <= 23; $h++) {
    $data[] = [
      'hora'     => sprintf('%02dh', $h),
      'hora_int' => $h,
      'total'    => $map[$h] ?? 0,
    ];
  }

  return new WP_REST_Response(['success' => true, 'data' => $data], 200);
}

/**
 * GET /api/v1/leads-tracking-utm-content
 *
 * Top utm_content por volume de leads.
 * Query params opcionais: from, to, limit (padrão 10, máx 20)
 */
function mytheme_api_leads_tracking_utm_content(WP_REST_Request $request)
{
  global $wpdb;

  $table_leads    = $wpdb->prefix . 'leads';
  $table_tracking = $wpdb->prefix . 'lead_tracking';

  $from  = sanitize_text_field($request->get_param('from')  ?? '');
  $to    = sanitize_text_field($request->get_param('to')    ?? '');
  $limit = max(1, min(20, intval($request->get_param('limit') ?? 10)));

  $where_clauses  = [];
  $prepare_values = [];

  if (current_user_can('administrator') && !crm_current_user_is_master()) {
    $where_clauses[] = "l.origem != 'proprio'";
  }

  if ($from) { $where_clauses[] = "l.data_criacao >= %s"; $prepare_values[] = $from . ' 00:00:00'; }
  if ($to)   { $where_clauses[] = "l.data_criacao <= %s"; $prepare_values[] = $to   . ' 23:59:59'; }

  $where_sql        = !empty($where_clauses) ? 'WHERE ' . implode(' AND ', $where_clauses) : '';
  $prepare_values[] = $limit;

  $query = "
    SELECT
      COALESCE(NULLIF(t.utm_content, ''), '(sem conteúdo)')    AS utm_content,
      COUNT(l.id)                                               AS total,
      ROUND(COUNT(l.id) * 100.0 / SUM(COUNT(l.id)) OVER(), 1) AS pct
    FROM {$table_leads} l
    LEFT JOIN {$table_tracking} t ON t.lead_id = l.id
    {$where_sql}
    GROUP BY t.utm_content
    ORDER BY total DESC
    LIMIT %d
  ";

  $rows = $wpdb->get_results(
    $wpdb->prepare($query, ...$prepare_values),
    ARRAY_A
  );

  if ($wpdb->last_error) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $wpdb->last_error], 500);
  }

  $data = array_map(function ($row) {
    return [
      'utm_content' => $row['utm_content'],
      'total'       => (int)   $row['total'],
      'pct'         => (float) $row['pct'],
    ];
  }, $rows);

  return new WP_REST_Response(['success' => true, 'total' => count($data), 'data' => $data], 200);
}

/**
 * GET /api/v1/leads-tracking-medium
 *
 * Distribuição por utm_medium (canal de marketing).
 * Query params opcionais: from, to
 */
function mytheme_api_leads_tracking_medium(WP_REST_Request $request)
{
  global $wpdb;

  $table_leads    = $wpdb->prefix . 'leads';
  $table_tracking = $wpdb->prefix . 'lead_tracking';

  $from = sanitize_text_field($request->get_param('from') ?? '');
  $to   = sanitize_text_field($request->get_param('to')   ?? '');

  $where_clauses  = [];
  $prepare_values = [];

  if (current_user_can('administrator') && !crm_current_user_is_master()) {
    $where_clauses[] = "l.origem != 'proprio'";
  }

  if ($from) { $where_clauses[] = "l.data_criacao >= %s"; $prepare_values[] = $from . ' 00:00:00'; }
  if ($to)   { $where_clauses[] = "l.data_criacao <= %s"; $prepare_values[] = $to   . ' 23:59:59'; }

  $where_sql = !empty($where_clauses) ? 'WHERE ' . implode(' AND ', $where_clauses) : '';

  $query = "
    SELECT
      COALESCE(NULLIF(t.utm_medium, ''), '(direto)')           AS utm_medium,
      COUNT(l.id)                                               AS total,
      ROUND(COUNT(l.id) * 100.0 / SUM(COUNT(l.id)) OVER(), 1) AS pct
    FROM {$table_leads} l
    LEFT JOIN {$table_tracking} t ON t.lead_id = l.id
    {$where_sql}
    GROUP BY t.utm_medium
    ORDER BY total DESC
  ";

  $rows = empty($prepare_values)
    ? $wpdb->get_results($query, ARRAY_A)
    : $wpdb->get_results($wpdb->prepare($query, ...$prepare_values), ARRAY_A);

  if ($wpdb->last_error) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $wpdb->last_error], 500);
  }

  $data = array_map(function ($row) {
    return [
      'utm_medium' => $row['utm_medium'],
      'total'      => (int)   $row['total'],
      'pct'        => (float) $row['pct'],
    ];
  }, $rows);

  return new WP_REST_Response(['success' => true, 'data' => $data], 200);
}

/**
 * GET /api/v1/influenciadores
 *
 * Agrega leads por utm_source (influenciadores).
 * Query params opcionais: from, to (yyyy-MM-dd)
 */
function mytheme_api_influenciadores(WP_REST_Request $request)
{
  global $wpdb;

  $table_leads    = $wpdb->prefix . 'leads';
  $table_tracking = $wpdb->prefix . 'lead_tracking';

  $from = sanitize_text_field($request->get_param('from') ?? '');
  $to   = sanitize_text_field($request->get_param('to')   ?? '');

  $where_clauses  = ["t.utm_source IS NOT NULL", "t.utm_source != ''"];
  $prepare_values = [];

  if (current_user_can('administrator') && !crm_current_user_is_master()) {
    $where_clauses[] = "l.origem != 'proprio'";
  }

  if ($from) { $where_clauses[] = "l.data_criacao >= %s"; $prepare_values[] = $from . ' 00:00:00'; }
  if ($to)   { $where_clauses[] = "l.data_criacao <= %s"; $prepare_values[] = $to   . ' 23:59:59'; }

  $where_sql = 'WHERE ' . implode(' AND ', $where_clauses);

  $query = "
    SELECT
      t.utm_source,
      COUNT(l.id)                                                                  AS total,
      SUM(CASE WHEN l.status = 'venda_realizada'     THEN 1 ELSE 0 END)           AS vendas,
      SUM(CASE WHEN l.status = 'venda_nao_realizada' THEN 1 ELSE 0 END)           AS perdidos,
      SUM(CASE WHEN l.status = 'em_negociacao'       THEN 1 ELSE 0 END)           AS em_negociacao,
      SUM(CASE WHEN l.status = 'nao_atendido'        THEN 1 ELSE 0 END)           AS nao_atendido,
      ROUND(
        SUM(CASE WHEN l.status = 'venda_realizada' THEN 1 ELSE 0 END) * 100.0 / COUNT(l.id), 1
      )                                                                            AS conversao_pct,
      MIN(l.data_criacao)                                                          AS primeiro_lead,
      MAX(l.data_criacao)                                                          AS ultimo_lead
    FROM {$table_leads} l
    INNER JOIN {$table_tracking} t ON t.lead_id = l.id
    {$where_sql}
    GROUP BY t.utm_source
    ORDER BY total DESC
  ";

  $rows = empty($prepare_values)
    ? $wpdb->get_results($query, ARRAY_A)
    : $wpdb->get_results($wpdb->prepare($query, ...$prepare_values), ARRAY_A);

  if ($wpdb->last_error) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $wpdb->last_error], 500);
  }

  $data = array_map(function ($row) {
    return [
      'utm_source'    => $row['utm_source'],
      'total'         => (int)   $row['total'],
      'vendas'        => (int)   $row['vendas'],
      'perdidos'      => (int)   $row['perdidos'],
      'em_negociacao' => (int)   $row['em_negociacao'],
      'nao_atendido'  => (int)   $row['nao_atendido'],
      'conversao_pct' => (float) $row['conversao_pct'],
      'primeiro_lead' => $row['primeiro_lead'],
      'ultimo_lead'   => $row['ultimo_lead'],
    ];
  }, $rows);

  return new WP_REST_Response(['success' => true, 'data' => $data], 200);
}

/**
 * GET /api/v1/leads-vnr-stats
 *
 * Agrega totais de cada motivo de venda não realizada.
 *
 * Query params opcionais:
 *   loja_id  — filtra por loja (aceita múltiplos separados por vírgula)
 *   from     — yyyy-MM-dd
 *   to       — yyyy-MM-dd
 *
 * Resposta:
 * {
 *   success: true,
 *   total: 42,
 *   motivos: [
 *     { key: "motivo_preco", label: "Preço acima do orçamento", total: 18, pct: 42.8 },
 *     ...
 *   ]
 * }
 */
function mytheme_api_leads_vnr_stats(WP_REST_Request $request)
{
  global $wpdb;

  $table_vnr   = $wpdb->prefix . 'lead_venda_nao_realizada';
  $table_leads = $wpdb->prefix . 'leads';

  // Filtros
  $loja_id_raw = sanitize_text_field($request->get_param('loja_id') ?? '');
  $from        = sanitize_text_field($request->get_param('from')    ?? '');
  $to          = sanitize_text_field($request->get_param('to')      ?? '');

  $loja_ids = array_filter(
    array_map('intval', explode(',', $loja_id_raw)),
    fn($v) => $v > 0
  );

  $where_clauses  = [];
  $prepare_values = [];

  if (!empty($loja_ids)) {
    $placeholders   = implode(',', array_fill(0, count($loja_ids), '%d'));
    $where_clauses[] = "l.loja_id IN ({$placeholders})";
    $prepare_values  = array_merge($prepare_values, $loja_ids);
  }

  if ($from) {
    $where_clauses[]  = "l.data_criacao >= %s";
    $prepare_values[] = $from . ' 00:00:00';
  }

  if ($to) {
    $where_clauses[]  = "l.data_criacao <= %s";
    $prepare_values[] = $to . ' 23:59:59';
  }

  if (current_user_can('administrator') && !crm_current_user_is_master()) {
    $where_clauses[] = "l.origem != 'proprio'";
  }

  $where_sql = !empty($where_clauses)
    ? 'WHERE ' . implode(' AND ', $where_clauses)
    : '';

  $motivo_cols = [
    'motivo_preco'              => 'Preço acima do orçamento',
    'motivo_concorrencia'       => 'Perdeu para a concorrência',
    'motivo_prazo_entrega'      => 'Prazo de entrega muito longo',
    'motivo_pagamento'          => 'Condições de pagamento inadequadas',
    'motivo_financiamento'      => 'Cliente não conseguiu financiamento',
    'motivo_obra_pendente'      => 'Obra / imóvel não finalizado',
    'motivo_indecisao'          => 'Cliente indeciso / adiou a decisão',
    'motivo_produto_inadequado' => 'Produto não atendeu a necessidade',
    'motivo_contato_perdido'    => 'Contato perdido / cliente sumiu',
    'motivo_atendimento'        => 'Problema no atendimento',
    'motivo_outro'              => 'Outro motivo',
  ];

  $sum_cols = implode(', ', array_map(
    fn($col) => "SUM(vnr.{$col}) AS {$col}",
    array_keys($motivo_cols)
  ));

  $query = "
    SELECT COUNT(vnr.id) AS total, {$sum_cols}
    FROM {$table_vnr} vnr
    INNER JOIN {$table_leads} l ON l.id = vnr.lead_id
    {$where_sql}
  ";

  $row = empty($prepare_values)
    ? $wpdb->get_row($query, ARRAY_A)
    : $wpdb->get_row($wpdb->prepare($query, ...$prepare_values), ARRAY_A);

  if ($wpdb->last_error) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'Erro ao consultar banco: ' . $wpdb->last_error,
    ], 500);
  }

  $total = (int) ($row['total'] ?? 0);

  $motivos = [];
  foreach ($motivo_cols as $key => $label) {
    $count     = (int) ($row[$key] ?? 0);
    $motivos[] = [
      'key'   => $key,
      'label' => $label,
      'total' => $count,
      'pct'   => $total > 0 ? round($count / $total * 100, 1) : 0,
    ];
  }

  usort($motivos, fn($a, $b) => $b['total'] - $a['total']);

  return new WP_REST_Response([
    'success' => true,
    'total'   => $total,
    'motivos' => $motivos,
  ], 200);
}

/**
 * GET /api/v1/leads/{id}/venda-nao-realizada
 *
 * Retorna os motivos de não realização registrados para o lead.
 * Resposta: { success: true, data: { ...campos } | null }
 */
function mytheme_api_get_venda_nao_realizada(WP_REST_Request $request)
{
  global $wpdb;

  $lead_id = intval($request->get_param('id'));
  $table   = $wpdb->prefix . 'lead_venda_nao_realizada';

  $row = $wpdb->get_row(
    $wpdb->prepare("SELECT * FROM {$table} WHERE lead_id = %d", $lead_id),
    ARRAY_A
  );

  if ($wpdb->last_error) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'Erro ao consultar banco: ' . $wpdb->last_error,
    ], 500);
  }

  if (!$row) {
    return new WP_REST_Response(['success' => true, 'data' => null], 200);
  }

  // Tipagem correta dos campos
  $bool_fields = [
    'motivo_preco', 'motivo_concorrencia', 'motivo_prazo_entrega',
    'motivo_pagamento', 'motivo_financiamento', 'motivo_obra_pendente',
    'motivo_indecisao', 'motivo_produto_inadequado', 'motivo_contato_perdido',
    'motivo_atendimento', 'motivo_outro',
  ];

  foreach ($bool_fields as $field) {
    $row[$field] = (bool) $row[$field];
  }

  $row['id']           = (int) $row['id'];
  $row['lead_id']      = (int) $row['lead_id'];
  $row['atendente_id'] = $row['atendente_id'] ? (int) $row['atendente_id'] : null;

  return new WP_REST_Response(['success' => true, 'data' => $row], 200);
}

/**
 * POST /api/v1/leads/{id}/venda-nao-realizada
 *
 * Cria ou atualiza (upsert) os motivos de não realização do lead.
 *
 * Body JSON:
 * {
 *   "motivo_preco": true,
 *   "motivo_concorrencia": false,
 *   ...
 *   "observacao": "texto livre"
 * }
 */
function mytheme_api_save_venda_nao_realizada(WP_REST_Request $request)
{
  global $wpdb;

  $lead_id = intval($request->get_param('id'));
  $params  = json_decode($request->get_body(), true);

  if (empty($params)) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'JSON inválido ou vazio.',
    ], 400);
  }

  $table       = $wpdb->prefix . 'lead_venda_nao_realizada';
  $leads_table = $wpdb->prefix . 'leads';

  // Verifica se o lead existe
  $lead = $wpdb->get_row($wpdb->prepare("SELECT id FROM {$leads_table} WHERE id = %d", $lead_id));
  if (!$lead) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'Lead não encontrado.',
    ], 404);
  }

  // Atendente logado
  $user_id   = get_current_user_id();
  $user      = $user_id ? get_userdata($user_id) : null;
  $user_nome = $user ? $user->display_name : null;

  $motivo_fields = [
    'motivo_preco', 'motivo_concorrencia', 'motivo_prazo_entrega',
    'motivo_pagamento', 'motivo_financiamento', 'motivo_obra_pendente',
    'motivo_indecisao', 'motivo_produto_inadequado', 'motivo_contato_perdido',
    'motivo_atendimento', 'motivo_outro',
  ];

  $data = [
    'atendente_id'   => $user_id ?: null,
    'atendente_nome' => $user_nome,
    'observacao'     => !empty($params['observacao'])
      ? sanitize_textarea_field($params['observacao'])
      : null,
  ];

  foreach ($motivo_fields as $field) {
    $data[$field] = !empty($params[$field]) ? 1 : 0;
  }

  // Upsert: atualiza se já existe, insere se não
  $existing_id = $wpdb->get_var(
    $wpdb->prepare("SELECT id FROM {$table} WHERE lead_id = %d", $lead_id)
  );

  if ($existing_id) {
    $wpdb->update($table, $data, ['lead_id' => $lead_id]);
  } else {
    $data['lead_id'] = $lead_id;
    $wpdb->insert($table, $data);
  }

  if ($wpdb->last_error) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'Erro ao salvar: ' . $wpdb->last_error,
    ], 500);
  }

  return new WP_REST_Response([
    'success'  => true,
    'mensagem' => 'Motivos registrados com sucesso.',
  ], 200);
}

/**
 * GET /api/v1/leads/{id}/venda-realizada
 *
 * Retorna os dados da venda registrada para o lead.
 * Resposta: { success: true, data: { ...campos } | null }
 */
function mytheme_api_get_venda_realizada(WP_REST_Request $request): WP_REST_Response
{
  $lead_id = intval($request->get_param('id'));
  $data    = Lead_Venda_Realizada_Handler::get_by_lead($lead_id);

  return new WP_REST_Response(['success' => true, 'data' => $data], 200);
}

/**
 * POST|PATCH /api/v1/leads/{id}/venda-realizada
 *
 * Cria ou atualiza (upsert) os dados da venda realizada.
 *
 * Body JSON (todos opcionais):
 * {
 *   "valor": 15000.00,
 *   "data_venda": "2025-06-13",
 *   "forma_pagamento": "pix",
 *   "numero_pedido": "001234",
 *   "numero_nf": "000001",
 *   "serie_nf": "001",
 *   "chave_acesso_nf": "...",
 *   "link_nf": "https://...",
 *   "observacoes": "..."
 * }
 */
function mytheme_api_save_venda_realizada(WP_REST_Request $request): WP_REST_Response
{
  global $wpdb;

  $lead_id = intval($request->get_param('id'));
  $params  = $request->get_json_params();

  if ($params === null) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'JSON inválido ou vazio.',
    ], 400);
  }

  $leads_table = $wpdb->prefix . 'leads';
  $lead        = $wpdb->get_row($wpdb->prepare("SELECT id FROM {$leads_table} WHERE id = %d", $lead_id));
  if (!$lead) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Lead não encontrado.'], 404);
  }

  $user_id   = get_current_user_id();
  $user      = $user_id ? get_userdata($user_id) : null;
  $user_nome = $user ? $user->display_name : null;

  $ok = Lead_Venda_Realizada_Handler::upsert($lead_id, $params, $user_id, $user_nome);

  if (!$ok) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'Erro ao salvar dados da venda: ' . $wpdb->last_error,
    ], 500);
  }

  $saved = Lead_Venda_Realizada_Handler::get_by_lead($lead_id);

  return new WP_REST_Response([
    'success'  => true,
    'mensagem' => 'Dados da venda salvos com sucesso.',
    'data'     => $saved,
  ], 200);
}