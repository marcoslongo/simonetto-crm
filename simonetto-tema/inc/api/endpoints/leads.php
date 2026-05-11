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
  // DELETE /api/v1/leads/{id} — excluir lead (somente administrador)
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
      'permission_callback' => 'mytheme_api_is_administrator',
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

  // GET /api/v1/leads/{id}/actions — histórico do lead (admin)
  register_rest_route('api/v1', '/leads/(?P<id>\d+)/actions', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_get_lead_actions',
    'permission_callback' => '__return_true',
  ));

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
    'permission_callback' => 'mytheme_api_is_administrator',
  ]);

  // GET /api/v1/leads-tracking-horario — volume de leads por hora do dia (0–23)
  register_rest_route('api/v1', '/leads-tracking-horario', [
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_leads_tracking_horario',
    'permission_callback' => 'mytheme_api_is_administrator',
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
});




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
  $args = [
    'page' => $request->get_param('page') ?: 1,
    'per_page' => $request->get_param('per_page') ?: 20,
    'email' => $request->get_param('email'),
    'loja_id' => $request->get_param('loja_id'),
    'search' => $request->get_param('search'),
    'from' => $request->get_param('from'),
    'to' => $request->get_param('to'),
    'status' => $request->get_param('status'),
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
  $id = intval($request->get_param('id'));
  $lead = Lead_Handler::get_by_id($id);

  if (!$lead) {
    return new WP_REST_Response([
      'success' => false,
      'mensagem' => 'Lead não encontrado.',
    ], 404);
  }

  return new WP_REST_Response([
    'success' => true,
    'lead' => $lead,
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

  return new WP_REST_Response([
    'success' => false,
    'mensagem' => 'Nenhum campo válido para atualizar. Use "status" e/ou "loja_id".',
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
  $table = $wpdb->prefix . 'leads_actions';

  $actions = $wpdb->get_results(
    $wpdb->prepare(
      "SELECT *
       FROM {$table}
       WHERE lead_id = %d
       ORDER BY criado_em DESC",
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

  // Inicializa todos os status com zero para manter a consistência no front-end
  $data = [
    'nao_atendido' => 0,
    'em_negociacao' => 0,
    'venda_realizada' => 0,
    'venda_nao_realizada' => 0,
  ];

  // Preenche com os valores reais do banco
  foreach ($rows as $row) {
    if (array_key_exists($row['status'], $data)) {
      $data[$row['status']] = (int) $row['total'];
    }
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

  $from = sanitize_text_field($request->get_param('from') ?? '');
  $to   = sanitize_text_field($request->get_param('to')   ?? '');

  $where_clauses  = [];
  $prepare_values = [];

  if ($from) { $where_clauses[] = "l.data_criacao >= %s"; $prepare_values[] = $from . ' 00:00:00'; }
  if ($to)   { $where_clauses[] = "l.data_criacao <= %s"; $prepare_values[] = $to   . ' 23:59:59'; }

  $where_sql = !empty($where_clauses) ? 'WHERE ' . implode(' AND ', $where_clauses) : '';

  $query = "
    SELECT
      CASE
        WHEN t.user_agent LIKE '%iPad%' OR t.user_agent LIKE '%Tablet%'
          THEN 'Tablet'
        WHEN t.user_agent LIKE '%Mobile%'
          OR t.user_agent LIKE '%Android%'
          OR t.user_agent LIKE '%iPhone%'
          OR t.user_agent LIKE '%webOS%'
          OR t.user_agent LIKE '%BlackBerry%'
          OR t.user_agent LIKE '%Windows Phone%'
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

  $from = sanitize_text_field($request->get_param('from') ?? '');
  $to   = sanitize_text_field($request->get_param('to')   ?? '');

  $where_clauses  = [];
  $prepare_values = [];

  if ($from) { $where_clauses[] = "l.data_criacao >= %s"; $prepare_values[] = $from . ' 00:00:00'; }
  if ($to)   { $where_clauses[] = "l.data_criacao <= %s"; $prepare_values[] = $to   . ' 23:59:59'; }

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