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