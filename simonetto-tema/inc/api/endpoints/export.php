<?php
/**
 * Endpoint de Exportação de Leads
 *
 * Permite acesso externo à tabela de leads via API key estática.
 * A chave é armazenada na opção WordPress "noxus_export_api_key".
 *
 * Autenticação: header  Authorization: Bearer <api_key>
 *           ou  querystring  ?api_key=<api_key>
 *
 * GET  /api/v1/export/leads               — lista leads paginados
 * POST /api/v1/export/leads/generate-key  — gera/regenera a API key (somente admin)
 * GET  /api/v1/export/leads/key           — retorna a API key atual (somente admin)
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

// ─── Option key ────────────────────────────────────────────────────────────
define('NOXUS_EXPORT_API_KEY_OPTION', 'noxus_export_api_key');

// ─── Registro de rotas ─────────────────────────────────────────────────────
add_action('rest_api_init', function () {

  // GET /api/v1/export/leads — exportação pública via API key
  register_rest_route('api/v1', '/export/leads', [
    'methods'             => 'GET',
    'callback'            => 'mytheme_export_list_leads',
    'permission_callback' => '__return_true', // auth feita dentro do callback
  ]);

  // POST /api/v1/export/leads/generate-key — gera nova API key (admin)
  register_rest_route('api/v1', '/export/leads/generate-key', [
    'methods'             => 'POST',
    'callback'            => 'mytheme_export_generate_key',
    'permission_callback' => 'mytheme_api_is_administrator',
  ]);

  // GET /api/v1/export/leads/key — retorna a chave atual (admin)
  register_rest_route('api/v1', '/export/leads/key', [
    'methods'             => 'GET',
    'callback'            => 'mytheme_export_get_key',
    'permission_callback' => 'mytheme_api_is_administrator',
  ]);
});

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Valida a API key enviada na requisição.
 */
function mytheme_export_validate_key(WP_REST_Request $request): bool
{
  $stored = get_option(NOXUS_EXPORT_API_KEY_OPTION, '');
  if (empty($stored)) return false;

  // Aceita via header Authorization: Bearer <key>
  $auth = $request->get_header('authorization');
  if ($auth && preg_match('/^Bearer\s+(.+)$/i', trim($auth), $m)) {
    return hash_equals($stored, $m[1]);
  }

  // Aceita via query string ?api_key=<key>
  $qs_key = sanitize_text_field($request->get_param('api_key') ?? '');
  if ($qs_key) {
    return hash_equals($stored, $qs_key);
  }

  return false;
}

// ─── Callbacks ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/export/leads
 *
 * Parâmetros:
 *   page        int     (default 1)
 *   per_page    int     (default 100, max 1000)
 *   from        string  YYYY-MM-DD  — filtra por data_criacao >= from
 *   to          string  YYYY-MM-DD  — filtra por data_criacao <= to
 *   loja_id     int     — filtra por loja
 *   status      string  — filtra por status
 *   origem      string  industria|proprio
 */
function mytheme_export_list_leads(WP_REST_Request $request): WP_REST_Response
{
  if (!mytheme_export_validate_key($request)) {
    return new WP_REST_Response([
      'success' => false,
      'mensagem' => 'API key ausente ou inválida. Envie via header "Authorization: Bearer <key>" ou "?api_key=<key>".',
    ], 401);
  }

  global $wpdb;
  $table = $wpdb->prefix . 'leads';

  // Parâmetros
  $page     = max(1, (int) ($request->get_param('page')     ?? 1));
  $per_page = min(1000, max(1, (int) ($request->get_param('per_page') ?? 100)));
  $from     = sanitize_text_field($request->get_param('from')    ?? '');
  $to       = sanitize_text_field($request->get_param('to')      ?? '');
  $loja_id  = (int) ($request->get_param('loja_id')  ?? 0);
  $status   = sanitize_text_field($request->get_param('status')  ?? '');
  $origem   = sanitize_text_field($request->get_param('origem')  ?? '');

  $where   = 'WHERE 1=1';
  $values  = [];

  if ($from) {
    $where   .= ' AND data_criacao >= %s';
    $values[] = $from . ' 00:00:00';
  }
  if ($to) {
    $where   .= ' AND data_criacao <= %s';
    $values[] = $to . ' 23:59:59';
  }
  if ($loja_id) {
    $where   .= ' AND loja_id = %d';
    $values[] = $loja_id;
  }
  if ($status) {
    $where   .= ' AND status = %s';
    $values[] = $status;
  }
  if ($origem && in_array($origem, ['industria', 'proprio'], true)) {
    $where   .= ' AND origem = %s';
    $values[] = $origem;
  }

  $offset = ($page - 1) * $per_page;

  // Total
  $count_sql = "SELECT COUNT(*) FROM {$table} {$where}";
  $total     = (int) ($values ? $wpdb->get_var($wpdb->prepare($count_sql, ...$values)) : $wpdb->get_var($count_sql));

  // Dados
  $data_sql = "SELECT * FROM {$table} {$where} ORDER BY data_criacao DESC LIMIT %d OFFSET %d";
  $rows = $values
    ? $wpdb->get_results($wpdb->prepare($data_sql, ...$values, $per_page, $offset), ARRAY_A)
    : $wpdb->get_results($wpdb->prepare($data_sql, $per_page, $offset), ARRAY_A);

  return new WP_REST_Response([
    'success'      => true,
    'total'        => $total,
    'page'         => $page,
    'per_page'     => $per_page,
    'total_pages'  => $per_page > 0 ? (int) ceil($total / $per_page) : 1,
    'leads'        => $rows ?: [],
  ], 200);
}

/**
 * POST /api/v1/export/leads/generate-key
 * Gera uma nova API key aleatória e salva na opção WordPress.
 */
function mytheme_export_generate_key(WP_REST_Request $request): WP_REST_Response
{
  $key = bin2hex(random_bytes(32)); // 64 chars hex
  update_option(NOXUS_EXPORT_API_KEY_OPTION, $key);

  return new WP_REST_Response([
    'success' => true,
    'api_key' => $key,
    'mensagem' => 'API key gerada com sucesso. Guarde-a em local seguro — ela não será exibida novamente.',
  ], 200);
}

/**
 * GET /api/v1/export/leads/key
 * Retorna a API key atual (para o admin ver/copiar).
 */
function mytheme_export_get_key(WP_REST_Request $request): WP_REST_Response
{
  $key = get_option(NOXUS_EXPORT_API_KEY_OPTION, '');

  if (empty($key)) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'Nenhuma API key configurada. Use POST /export/leads/generate-key para gerar.',
    ], 404);
  }

  return new WP_REST_Response([
    'success' => true,
    'api_key' => $key,
  ], 200);
}
