<?php
/**
 * Endpoints REST de Lojas
 * 
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

add_action('rest_api_init', function () {
  register_rest_route('api/v1', '/lojas', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_list_lojas',
    'permission_callback' => '__return_true',
  ));

  register_rest_route('api/v1', '/lojas-with-stats', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_list_lojas_with_stats',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ));

  // Detalhes da loja
  register_rest_route('api/v1', '/lojas/(?P<id>\d+)', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_get_loja',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ));

  // Stats completas da loja
  register_rest_route('api/v1', '/lojas/(?P<id>\d+)/stats', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_get_loja_stats',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ));

  // Leads dos últimos 30 dias
  register_rest_route('api/v1', '/lojas/(?P<id>\d+)/leads-30-days', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_get_loja_leads_30_days',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ));

  // Leads dos últimos 12 meses
  register_rest_route('api/v1', '/lojas/(?P<id>\d+)/leads-12-months', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_get_loja_leads_12_months',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ));

  // Leads da loja (kanban de atendimentos)
  register_rest_route('api/v1', '/lojas/(?P<id>\d+)/leads', array(
    'methods' => 'GET',
    'callback' => 'mytheme_api_get_loja_leads',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ));

  // Registrar contato com lead da loja
  register_rest_route('api/v1', '/lojas/(?P<id>\d+)/lead-contato', [
    'methods' => 'POST',
    'callback' => 'mytheme_api_loja_register_contact',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ]);

  // Status do funil da loja
  register_rest_route('api/v1', '/lojas/(?P<id>\d+)/status-funil', [
    'methods' => 'GET',
    'callback' => 'mytheme_api_get_loja_status_funil',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ]);

  // Classificação de temperatura da loja
  register_rest_route('api/v1', '/lojas/(?P<id>\d+)/classificacao', [
    'methods' => 'GET',
    'callback' => 'mytheme_api_get_loja_classificacao',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ]);

  // Métricas de atendimento da loja
  register_rest_route('api/v1', '/lojas/(?P<id>\d+)/service-stats', [
    'methods' => 'GET',
    'callback' => 'mytheme_api_get_loja_service_stats',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ]);

  // Usuários da loja
  register_rest_route('api/v1', '/lojas/(?P<id>\d+)/usuarios', [
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_get_loja_usuarios',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ]);

  // GET/POST /api/v1/lojas/{id}/whatsapp-config — configuração Evolution API da loja
  register_rest_route('api/v1', '/lojas/(?P<id>\d+)/whatsapp-config', [
    [
      'methods'             => 'GET',
      'callback'            => 'mytheme_api_get_loja_whatsapp_config',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
    [
      'methods'             => 'POST',
      'callback'            => 'mytheme_api_save_loja_whatsapp_config',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
  ]);

  // GET/POST /api/v1/settings/whatsapp — URL global do servidor Evolution API (admin)
  register_rest_route('api/v1', '/settings/whatsapp', [
    [
      'methods'             => 'GET',
      'callback'            => 'mytheme_api_get_whatsapp_settings',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
    [
      'methods'             => 'POST',
      'callback'            => 'mytheme_api_save_whatsapp_settings',
      'permission_callback' => 'mytheme_api_is_administrator',
    ],
  ]);

  // GET /api/v1/admin/usuarios — listar todos os usuários com status WhatsApp (admin)
  register_rest_route('api/v1', '/admin/usuarios', [
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_admin_list_usuarios',
    'permission_callback' => 'mytheme_api_is_administrator',
  ]);

  // POST /api/v1/admin/usuarios/{id}/whatsapp-config — admin configura instância de um usuário
  register_rest_route('api/v1', '/admin/usuarios/(?P<id>\d+)/whatsapp-config', [
    'methods'             => 'POST',
    'callback'            => 'mytheme_api_admin_save_user_whatsapp_config',
    'permission_callback' => 'mytheme_api_is_administrator',
  ]);

  // GET /api/v1/lojas/{id}/saude-funil — saúde operacional da loja (SLA, score médio, follow-up)
  register_rest_route('api/v1', '/lojas/(?P<id>\d+)/saude-funil', [
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_get_saude_funil',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ]);

  // GET /api/v1/lojas/{id}/atendente-stats — métricas pessoais do atendente
  register_rest_route('api/v1', '/lojas/(?P<id>\d+)/atendente-stats', [
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_get_atendente_stats',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ]);

  // POST /api/v1/usuarios/me/avatar — upload de foto de perfil
  register_rest_route('api/v1', '/usuarios/me/avatar', [
    'methods'             => 'POST',
    'callback'            => 'mytheme_api_upload_user_avatar',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ]);

  // GET/POST/DELETE /api/v1/usuarios/me/whatsapp-config — configuração WhatsApp por usuário
  register_rest_route('api/v1', '/usuarios/me/whatsapp-config', [
    [
      'methods'             => 'GET',
      'callback'            => 'mytheme_api_get_user_whatsapp_config',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
    [
      'methods'             => 'POST',
      'callback'            => 'mytheme_api_save_user_whatsapp_config',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
    [
      'methods'             => 'DELETE',
      'callback'            => 'mytheme_api_delete_user_whatsapp_config',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
  ]);

  // GET/POST /api/v1/usuarios/me/whatsapp-auto-lead — criar lead automaticamente para novos contatos
  register_rest_route('api/v1', '/usuarios/me/whatsapp-auto-lead', [
    [
      'methods'             => 'GET',
      'callback'            => 'mytheme_api_get_user_whatsapp_auto_lead',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
    [
      'methods'             => 'POST',
      'callback'            => 'mytheme_api_save_user_whatsapp_auto_lead',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
  ]);

  // GET/POST /api/v1/lojas/{id}/leads-config — ocultar leads não atribuídos para usuários comuns
  register_rest_route('api/v1', '/lojas/(?P<id>\d+)/leads-config', [
    [
      'methods'             => 'GET',
      'callback'            => 'mytheme_api_get_loja_leads_config',
      'permission_callback' => 'mytheme_api_is_gerente',
    ],
    [
      'methods'             => 'POST',
      'callback'            => 'mytheme_api_save_loja_leads_config',
      'permission_callback' => 'mytheme_api_is_gerente',
    ],
  ]);
});

/**
 * GET /api/v1/lojas
 */
function mytheme_api_list_lojas($request)
{
  $lojas = Loja_Handler::list();

  return new WP_REST_Response([
    'success' => true,
    'lojas' => $lojas,
    'total' => count($lojas)
  ], 200);
}

/**
 * GET /api/v1/lojas-with-stats
 */
function mytheme_api_list_lojas_with_stats($request)
{
  $lojas = Loja_Handler::list_with_stats();

  return new WP_REST_Response([
    'success' => true,
    'lojas' => $lojas,
    'total' => count($lojas)
  ], 200);
}

/**
 * GET /api/v1/lojas/:id
 */
function mytheme_api_get_loja($request)
{
  $loja_id = (int) $request['id'];
  $loja = Loja_Handler::get_by_id($loja_id);

  if (!$loja) {
    return new WP_REST_Response([
      'success' => false,
      'message' => 'Loja não encontrada'
    ], 404);
  }

  return new WP_REST_Response([
    'success' => true,
    'loja' => $loja
  ], 200);
}

/**
 * GET /api/v1/lojas/:id/stats
 */
function mytheme_api_get_loja_stats($request)
{
  $loja_id = (int) $request['id'];

  // Verifica se a loja existe
  $loja = get_post($loja_id);
  if (!$loja || $loja->post_type !== 'lojas') {
    return new WP_REST_Response([
      'success' => false,
      'message' => 'Loja não encontrada'
    ], 404);
  }

  $stats = Loja_Handler::get_stats($loja_id);

  return new WP_REST_Response([
    'success' => true,
    'stats' => $stats
  ], 200);
}

/**
 * GET /api/v1/lojas/:id/leads-30-days
 */
function mytheme_api_get_loja_leads_30_days($request)
{
  $loja_id = (int) $request['id'];

  // Verifica se a loja existe
  $loja = get_post($loja_id);
  if (!$loja || $loja->post_type !== 'lojas') {
    return new WP_REST_Response([
      'success' => false,
      'message' => 'Loja não encontrada'
    ], 404);
  }

  $data = Loja_Handler::get_leads_30_days($loja_id);

  return new WP_REST_Response([
    'success' => true,
    'data' => $data
  ], 200);
}

/**
 * GET /api/v1/lojas/:id/leads-12-months
 */
function mytheme_api_get_loja_leads_12_months($request)
{
  $loja_id = (int) $request['id'];

  // Verifica se a loja existe
  $loja = get_post($loja_id);
  if (!$loja || $loja->post_type !== 'lojas') {
    return new WP_REST_Response([
      'success' => false,
      'message' => 'Loja não encontrada'
    ], 404);
  }

  $data = Loja_Handler::get_leads_12_months($loja_id);

  return new WP_REST_Response([
    'success' => true,
    'data' => $data
  ], 200);
}

/**
 * GET /api/v1/lojas/:id/leads
 */
function mytheme_api_get_loja_leads($request)
{
  $loja_id = (int) $request['id'];

  $loja = get_post($loja_id);
  if (!$loja || $loja->post_type !== 'lojas') {
    return new WP_REST_Response([
      'success' => false,
      'message' => 'Loja não encontrada'
    ], 404);
  }

  // Se a loja tem ocultar_leads_nao_atribuidos ativo e o usuário não é gerente/admin,
  // força o filtro de responsável para o próprio usuário.
  $responsavel_id = intval($request->get_param('responsavel_id') ?? 0);
  $ocultar        = (bool) get_post_meta($loja_id, '_ocultar_leads_nao_atribuidos', true);

  if ($ocultar && !current_user_can('administrator')) {
    $current_user_id = get_current_user_id();
    $is_gerente      = (bool) get_field('is_gerente', 'user_' . $current_user_id);
    if (!$is_gerente) {
      $responsavel_id = $current_user_id;
    }
  }

  $result = Lead_Handler::list([
    'page'            => $request->get_param('page') ?: 1,
    'per_page'        => $request->get_param('per_page') ?: 100,
    'search'          => $request->get_param('search'),
    'from'            => $request->get_param('from'),
    'to'              => $request->get_param('to'),
    'status'          => $request->get_param('status') ?? '',
    'responsavel_id'  => $responsavel_id,
    'loja_id'         => $loja_id,
    // Administradores sem is_master não veem leads de origem 'proprio'
    'exclude_proprio' => current_user_can('administrator') && !crm_current_user_is_master(),
  ]);

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
 * POST /api/v1/lojas/:id/lead-contato
 */
function mytheme_api_loja_register_contact(WP_REST_Request $request)
{
  $loja_id = (int) $request['id'];
  $params  = json_decode($request->get_body(), true);

  if (empty($params['lead_id'])) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'lead_id não informado.',
    ], 400);
  }

  // Garante que o lead pertence a esta loja
  global $wpdb;
  $lead_loja_id = (int) $wpdb->get_var($wpdb->prepare(
    "SELECT loja_id FROM {$wpdb->prefix}leads WHERE id = %d",
    intval($params['lead_id'])
  ));

  if ($lead_loja_id !== $loja_id) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'Lead não pertence a esta loja.',
    ], 403);
  }

  $result = Lead_Handler::register_contact($params);

  if (is_wp_error($result)) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => $result->get_error_message(),
    ], $result->get_error_data()['status']);
  }

  return new WP_REST_Response([
    'success'  => true,
    'mensagem' => 'Contato registrado com sucesso.',
  ], 201);
}

/**
 * GET /api/v1/lojas/:id/status-funil
 * Retorna contagem de leads por status para a loja específica
 */
function mytheme_api_get_loja_status_funil($request)
{
  global $wpdb;

  $loja_id = (int) $request['id'];
  $table   = $wpdb->prefix . 'leads';

  $rows = $wpdb->get_results(
    $wpdb->prepare(
      "SELECT status, COUNT(*) as total FROM {$table} WHERE loja_id = %d GROUP BY status",
      $loja_id
    ),
    ARRAY_A
  );

  if ($wpdb->last_error) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $wpdb->last_error], 500);
  }

  $data = [
    'nao_atendido'     => 0,
    'em_negociacao'    => 0,
    'venda_realizada'  => 0,
    'venda_nao_realizada' => 0,
  ];

  foreach ($rows as $row) {
    $data[$row['status']] = (int) $row['total'];
  }

  return new WP_REST_Response([
    'success' => true,
    'data'    => $data,
    'total'   => array_sum($data),
  ], 200);
}

/**
 * GET /api/v1/lojas/:id/classificacao
 * Retorna contagem de leads por classificação (frio/morno/quente) para a loja específica
 */
function mytheme_api_get_loja_classificacao($request)
{
  global $wpdb;

  $loja_id = (int) $request['id'];
  $table   = $wpdb->prefix . 'leads';

  $rows = $wpdb->get_results(
    $wpdb->prepare(
      "SELECT classificacao, COUNT(*) as total FROM {$table} WHERE loja_id = %d GROUP BY classificacao",
      $loja_id
    ),
    ARRAY_A
  );

  if ($wpdb->last_error) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $wpdb->last_error], 500);
  }

  $data = ['frio' => 0, 'morno' => 0, 'quente' => 0];

  foreach ($rows as $row) {
    if (array_key_exists($row['classificacao'], $data)) {
      $data[$row['classificacao']] = (int) $row['total'];
    }
  }

  return new WP_REST_Response([
    'success' => true,
    'data'    => $data,
    'total'   => array_sum($data),
  ], 200);
}

/**
 * GET /api/v1/lojas/:id/service-stats
 * Retorna métricas de atendimento (taxa de contato, tempo médio) para a loja específica
 */
function mytheme_api_get_loja_service_stats($request)
{
  $loja_id = (int) $request['id'];

  $loja = get_post($loja_id);
  if (!$loja || $loja->post_type !== 'lojas') {
    return new WP_REST_Response([
      'success' => false,
      'mensagem' => 'Loja não encontrada',
    ], 404);
  }

  $stats = Loja_Handler::get_service_stats($loja_id);

  return new WP_REST_Response([
    'success' => true,
    'data'    => $stats,
  ], 200);
}

/**
 * Verifica se o usuário atual tem acesso à loja informada.
 * Suporta loja_id armazenado como valor único ou array serializado (multi-loja).
 */
function mytheme_user_can_access_loja(int $loja_id): bool
{
  $current_user = wp_get_current_user();

  if (in_array('administrator', (array) $current_user->roles, true)) {
    return true;
  }

  $raw      = get_field('loja_id', 'user_' . $current_user->ID);
  $loja_ids = is_array($raw)
    ? array_map('intval', $raw)
    : ($raw ? [intval($raw)] : []);

  return in_array($loja_id, $loja_ids, true);
}

/**
 * GET /api/v1/lojas/:id/usuarios
 */
function mytheme_api_get_loja_usuarios(WP_REST_Request $request): WP_REST_Response
{
  $loja_id = (int) $request['id'];

  $loja = get_post($loja_id);
  if (!$loja || $loja->post_type !== 'lojas') {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Loja não encontrada.'], 404);
  }

  if (!mytheme_user_can_access_loja($loja_id)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Sem permissão.'], 403);
  }

  $usuarios = Loja_Handler::get_usuarios($loja_id);

  return new WP_REST_Response([
    'success'  => true,
    'usuarios' => $usuarios,
  ], 200);
}

// -------------------------------------------------------------------------
// Avatar de perfil
// -------------------------------------------------------------------------

/**
 * POST /api/v1/usuarios/me/avatar
 * Recebe multipart/form-data com campo "avatar" (jpg/png/webp/gif).
 * Salva o arquivo, cria attachment e persiste URL em user_meta.
 */
function mytheme_api_upload_user_avatar(WP_REST_Request $request): WP_REST_Response
{
  $user_id = get_current_user_id();

  $files = $request->get_file_params();
  if (empty($files['avatar'])) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Nenhum arquivo enviado.'], 400);
  }

  $file = $files['avatar'];

  // Valida tipo MIME
  $allowed_mimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  $finfo = finfo_open(FILEINFO_MIME_TYPE);
  $mime  = finfo_file($finfo, $file['tmp_name']);
  finfo_close($finfo);

  if (!in_array($mime, $allowed_mimes, true)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Formato inválido. Use JPG, PNG ou WEBP.'], 400);
  }

  // Valida tamanho (máx 5 MB)
  if ($file['size'] > 5 * 1024 * 1024) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Arquivo muito grande. Máximo 5 MB.'], 400);
  }

  require_once ABSPATH . 'wp-admin/includes/file.php';
  require_once ABSPATH . 'wp-admin/includes/media.php';
  require_once ABSPATH . 'wp-admin/includes/image.php';

  $overrides = [
    'test_form' => false,
    'mimes'     => [
      'jpg|jpeg' => 'image/jpeg',
      'png'      => 'image/png',
      'webp'     => 'image/webp',
      'gif'      => 'image/gif',
    ],
  ];

  $uploaded = wp_handle_upload($file, $overrides);

  if (isset($uploaded['error'])) {
    return new WP_REST_Response(['success' => false, 'mensagem' => $uploaded['error']], 500);
  }

  // Remove attachment anterior
  $old_id = (int) get_user_meta($user_id, '_crm_avatar_attachment_id', true);
  if ($old_id) {
    wp_delete_attachment($old_id, true);
  }

  // Cria attachment no media library
  $attachment_id = wp_insert_attachment([
    'post_mime_type' => $uploaded['type'],
    'post_title'     => 'avatar-user-' . $user_id,
    'post_status'    => 'inherit',
  ], $uploaded['file']);

  if (!is_wp_error($attachment_id)) {
    wp_update_attachment_metadata($attachment_id, wp_generate_attachment_metadata($attachment_id, $uploaded['file']));
    update_user_meta($user_id, '_crm_avatar_attachment_id', $attachment_id);
  }

  update_user_meta($user_id, '_crm_avatar_url', $uploaded['url']);

  return new WP_REST_Response([
    'success'    => true,
    'avatar_url' => $uploaded['url'],
  ], 200);
}

// -------------------------------------------------------------------------
// WhatsApp / Evolution API — configuração por loja
// -------------------------------------------------------------------------

/**
 * GET /api/v1/lojas/{id}/whatsapp-config
 */
function mytheme_api_get_loja_whatsapp_config(WP_REST_Request $request): WP_REST_Response
{
  $loja_id = (int) $request['id'];
  $loja    = get_post($loja_id);

  if (!$loja || $loja->post_type !== 'lojas') {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Loja não encontrada.'], 404);
  }

  // Autorização: admin ou própria loja
  if (!mytheme_user_can_access_loja($loja_id)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Sem permissão.'], 403);
  }

  $instance         = get_post_meta($loja_id, '_evolution_instance',        true);
  $api_key          = get_post_meta($loja_id, '_evolution_api_key',         true);
  $connection_state = get_post_meta($loja_id, '_whatsapp_connection_state', true);

  // Se instância configurada mas estado ainda não rastreado via webhook → assume conectado
  if (!$connection_state && !empty($instance)) {
    $connection_state = 'open';
  }

  return new WP_REST_Response([
    'success'          => true,
    'instance'         => $instance ?: null,
    'api_key'          => $api_key ? '••••' . substr($api_key, -4) : null,
    'configured'       => !empty($instance) && !empty($api_key),
    'connection_state' => $connection_state ?: 'unknown',
  ], 200);
}

/**
 * POST /api/v1/lojas/{id}/whatsapp-config
 */
function mytheme_api_save_loja_whatsapp_config(WP_REST_Request $request): WP_REST_Response
{
  $loja_id = (int) $request['id'];
  $loja    = get_post($loja_id);

  if (!$loja || $loja->post_type !== 'lojas') {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Loja não encontrada.'], 404);
  }

  // Autorização: admin ou própria loja
  if (!mytheme_user_can_access_loja($loja_id)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Sem permissão.'], 403);
  }

  $body     = $request->get_json_params();
  $instance = sanitize_text_field($body['instance'] ?? '');
  $api_key  = sanitize_text_field($body['api_key']  ?? '');

  if (empty($instance)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Nome da instância é obrigatório.'], 400);
  }

  update_post_meta($loja_id, '_evolution_instance', $instance);

  // Só atualiza a chave se vier uma nova (não o valor mascarado)
  if (!empty($api_key) && !str_starts_with($api_key, '••••')) {
    update_post_meta($loja_id, '_evolution_api_key', $api_key);
  }

  return new WP_REST_Response(['success' => true, 'mensagem' => 'Configuração WhatsApp salva.'], 200);
}

// -------------------------------------------------------------------------
// WhatsApp — configurações globais (URL do servidor Evolution)
// -------------------------------------------------------------------------

/**
 * GET /api/v1/settings/whatsapp
 */
function mytheme_api_get_whatsapp_settings(WP_REST_Request $request): WP_REST_Response
{
  $url     = get_option('evolution_api_url', '');
  $api_key = get_option('evolution_api_key', '');

  return new WP_REST_Response([
    'success'           => true,
    'evolution_api_url' => $url ?: null,
    'evolution_api_key' => $api_key ?: null,
  ], 200);
}

/**
 * POST /api/v1/settings/whatsapp (admin only)
 */
function mytheme_api_save_whatsapp_settings(WP_REST_Request $request): WP_REST_Response
{
  $body = $request->get_json_params();

  if (isset($body['evolution_api_url'])) {
    update_option('evolution_api_url', esc_url_raw(trim($body['evolution_api_url'])));
  }

  if (!empty($body['evolution_api_key'])) {
    update_option('evolution_api_key', sanitize_text_field(trim($body['evolution_api_key'])));
  }

  return new WP_REST_Response(['success' => true, 'mensagem' => 'Configurações salvas.'], 200);
}

// -------------------------------------------------------------------------
// Admin — gerenciamento de usuários e WhatsApp
// -------------------------------------------------------------------------

/**
 * GET /api/v1/admin/usuarios
 */
function mytheme_api_admin_list_usuarios(WP_REST_Request $request): WP_REST_Response
{
  $users = get_users(['orderby' => 'display_name', 'order' => 'ASC']);

  $resultado = [];
  foreach ($users as $user) {
    $instance         = get_user_meta($user->ID, '_evolution_instance',        true);
    $connection_state = get_user_meta($user->ID, '_whatsapp_connection_state', true);

    if (!$connection_state && !empty($instance)) {
      $connection_state = 'open';
    }

    // Lojas vinculadas ao usuário
    $loja_ids_raw = get_user_meta($user->ID, 'loja_ids', true);
    $loja_ids     = [];
    if (is_array($loja_ids_raw)) {
      $loja_ids = array_map('intval', $loja_ids_raw);
    } elseif ($loja_ids_raw) {
      $loja_ids = [intval($loja_ids_raw)];
    }

    $resultado[] = [
      'id'               => (int) $user->ID,
      'nome'             => $user->display_name,
      'email'            => $user->user_email,
      'role'             => $user->roles[0] ?? 'subscriber',
      'loja_ids'         => $loja_ids,
      'instance'         => $instance ?: null,
      'connection_state' => $connection_state ?: ($instance ? 'open' : 'not_configured'),
    ];
  }

  return new WP_REST_Response(['success' => true, 'usuarios' => $resultado], 200);
}

/**
 * POST /api/v1/admin/usuarios/{id}/whatsapp-config
 */
function mytheme_api_admin_save_user_whatsapp_config(WP_REST_Request $request): WP_REST_Response
{
  $target_user_id = (int) $request['id'];

  if (!get_user_by('id', $target_user_id)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Usuário não encontrado.'], 404);
  }

  $body     = $request->get_json_params();
  $instance = sanitize_text_field($body['instance'] ?? '');
  $api_key  = sanitize_text_field($body['api_key']  ?? '');

  if (!empty($instance)) {
    update_user_meta($target_user_id, '_evolution_instance', $instance);
  }
  if (!empty($api_key)) {
    update_user_meta($target_user_id, '_evolution_api_key', $api_key);
  }

  return new WP_REST_Response(['success' => true, 'mensagem' => 'Configuração salva.'], 200);
}

// -------------------------------------------------------------------------
// WhatsApp por usuário — configuração individual
// -------------------------------------------------------------------------

/**
 * GET /api/v1/usuarios/me/whatsapp-config
 */
function mytheme_api_get_user_whatsapp_config(WP_REST_Request $request): WP_REST_Response
{
  $user_id          = get_current_user_id();
  $instance         = get_user_meta($user_id, '_evolution_instance',        true);
  $api_key          = get_user_meta($user_id, '_evolution_api_key',         true);
  $connection_state = get_user_meta($user_id, '_whatsapp_connection_state', true);

  if (!$connection_state && !empty($instance)) {
    $connection_state = 'open';
  }

  return new WP_REST_Response([
    'success'          => true,
    'instance'         => $instance ?: null,
    'api_key'          => $api_key  ?: null, // chave da instância — usada server-side para QR e envio
    'configured'       => !empty($instance) && !empty($api_key),
    'connection_state' => $connection_state ?: 'unknown',
  ], 200);
}

/**
 * POST /api/v1/usuarios/me/whatsapp-config
 */
function mytheme_api_save_user_whatsapp_config(WP_REST_Request $request): WP_REST_Response
{
  $user_id  = get_current_user_id();
  $body     = $request->get_json_params();
  $instance = sanitize_text_field($body['instance'] ?? '');
  $api_key  = sanitize_text_field($body['api_key']  ?? '');

  if (empty($instance)) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Nome da instância é obrigatório.'], 400);
  }

  update_user_meta($user_id, '_evolution_instance', $instance);

  if (!empty($api_key)) {
    update_user_meta($user_id, '_evolution_api_key', $api_key);
  }

  return new WP_REST_Response(['success' => true, 'mensagem' => 'Configuração WhatsApp salva.'], 200);
}

/**
 * DELETE /api/v1/usuarios/me/whatsapp-config
 */
function mytheme_api_delete_user_whatsapp_config(WP_REST_Request $request): WP_REST_Response
{
  $user_id = get_current_user_id();
  delete_user_meta($user_id, '_evolution_instance');
  delete_user_meta($user_id, '_evolution_api_key');
  delete_user_meta($user_id, '_whatsapp_connection_state');
  return new WP_REST_Response(['success' => true, 'mensagem' => 'WhatsApp desvinculado com sucesso.'], 200);
}

/**
 * GET /api/v1/lojas/:id/atendente-stats?responsavel_id=
 * Retorna métricas pessoais de um atendente em uma loja específica.
 */
function mytheme_api_get_atendente_stats(WP_REST_Request $request): WP_REST_Response
{
  global $wpdb;

  $loja_id        = intval($request['id']);
  $responsavel_id = intval($request->get_param('responsavel_id') ?? 0);

  if (!$loja_id || !$responsavel_id) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'loja_id e responsavel_id são obrigatórios.'], 400);
  }

  $table_leads     = $wpdb->prefix . 'leads';
  $table_followups = $wpdb->prefix . 'leads_followups';
  $now             = current_time('mysql');
  $today_start     = date('Y-m-d') . ' 00:00:00';
  $today_end       = date('Y-m-d') . ' 23:59:59';

  // Total atribuídos
  $total_atribuidos = (int) $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM {$table_leads} WHERE loja_id = %d AND responsavel_id = %d",
    $loja_id, $responsavel_id
  ));

  // Contagem por status
  $status_rows = $wpdb->get_results($wpdb->prepare(
    "SELECT status, COUNT(*) as total FROM {$table_leads}
     WHERE loja_id = %d AND responsavel_id = %d GROUP BY status",
    $loja_id, $responsavel_id
  ), ARRAY_A);

  $por_status = [];
  foreach ($status_rows as $row) {
    $por_status[$row['status']] = intval($row['total']);
  }

  $venda_realizada     = $por_status['venda_realizada']     ?? 0;
  $venda_nao_realizada = $por_status['venda_nao_realizada'] ?? 0;
  $ativos              = $total_atribuidos - $venda_realizada - $venda_nao_realizada;
  $taxa_conversao      = $total_atribuidos > 0 ? round($venda_realizada / $total_atribuidos * 100, 1) : 0.0;

  // Follow-ups atrasados
  $followups_atrasados = (int) $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM {$table_followups} f
     INNER JOIN {$table_leads} l ON l.id = f.lead_id
     WHERE l.loja_id = %d AND l.responsavel_id = %d AND f.concluido = 0 AND f.agendado_para < %s",
    $loja_id, $responsavel_id, $now
  ));

  // Follow-ups hoje
  $followups_hoje = (int) $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM {$table_followups} f
     INNER JOIN {$table_leads} l ON l.id = f.lead_id
     WHERE l.loja_id = %d AND l.responsavel_id = %d AND f.concluido = 0
       AND f.agendado_para BETWEEN %s AND %s",
    $loja_id, $responsavel_id, $today_start, $today_end
  ));

  // Leads quentes sem contato há mais de 24h
  $leads_quentes_sem_contato = (int) $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM {$table_leads}
     WHERE loja_id = %d AND responsavel_id = %d AND classificacao = 'quente'
       AND status NOT IN ('venda_realizada', 'venda_nao_realizada')
       AND data_atualizacao < DATE_SUB(NOW(), INTERVAL 24 HOUR)",
    $loja_id, $responsavel_id
  ));

  // SLA: nao_atendido há mais de 2h
  $sla_nao_atendido = (int) $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM {$table_leads}
     WHERE loja_id = %d AND responsavel_id = %d AND status = 'nao_atendido'
       AND data_criacao < DATE_SUB(NOW(), INTERVAL 2 HOUR)",
    $loja_id, $responsavel_id
  ));

  // SLA: em etapas ativas sem movimentação há mais de 3 dias
  $sla_negociacao = (int) $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM {$table_leads}
     WHERE loja_id = %d AND responsavel_id = %d
       AND status NOT IN ('nao_atendido', 'venda_realizada', 'venda_nao_realizada')
       AND data_atualizacao < DATE_SUB(NOW(), INTERVAL 3 DAY)",
    $loja_id, $responsavel_id
  ));

  // Leads recebidos hoje
  $leads_hoje = (int) $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM {$table_leads}
     WHERE loja_id = %d AND responsavel_id = %d AND data_criacao BETWEEN %s AND %s",
    $loja_id, $responsavel_id, $today_start, $today_end
  ));

  return new WP_REST_Response([
    'success' => true,
    'data'    => [
      'total_atribuidos'          => $total_atribuidos,
      'ativos'                    => max(0, $ativos),
      'por_status'                => $por_status,
      'venda_realizada'           => $venda_realizada,
      'venda_nao_realizada'       => $venda_nao_realizada,
      'taxa_conversao'            => $taxa_conversao,
      'followups_atrasados'       => $followups_atrasados,
      'followups_hoje'            => $followups_hoje,
      'leads_quentes_sem_contato' => $leads_quentes_sem_contato,
      'sla_nao_atendido'          => $sla_nao_atendido,
      'sla_negociacao'            => $sla_negociacao,
      'leads_hoje'                => $leads_hoje,
    ],
  ], 200);
}

/**
 * GET /api/v1/lojas/:id/saude-funil
 * Saúde operacional da loja: SLA breach rate, score médio, follow-up compliance.
 */
function mytheme_api_get_saude_funil(WP_REST_Request $request): WP_REST_Response
{
  global $wpdb;

  $loja_id         = intval($request['id']);
  $table_leads     = $wpdb->prefix . 'leads';
  $table_followups = $wpdb->prefix . 'leads_followups';

  if (!$loja_id) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'loja_id inválido.'], 400);
  }

  // Total de leads ativos
  $active_leads = (int) $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM {$table_leads}
     WHERE loja_id = %d AND status NOT IN ('venda_realizada', 'venda_nao_realizada')",
    $loja_id
  ));

  // SLA: nao_atendido há mais de 2h
  $sla_nao_atendido = (int) $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM {$table_leads}
     WHERE loja_id = %d AND status = 'nao_atendido'
       AND data_criacao < DATE_SUB(NOW(), INTERVAL 2 HOUR)",
    $loja_id
  ));

  // SLA: em etapas ativas sem movimentação há mais de 3 dias
  $sla_parados = (int) $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM {$table_leads}
     WHERE loja_id = %d
       AND status NOT IN ('nao_atendido', 'venda_realizada', 'venda_nao_realizada')
       AND data_atualizacao < DATE_SUB(NOW(), INTERVAL 3 DAY)",
    $loja_id
  ));

  $sla_breach      = $sla_nao_atendido + $sla_parados;
  $sla_breach_pct  = $active_leads > 0 ? round($sla_breach / $active_leads * 100, 1) : 0.0;

  // Score médio dos leads ativos
  $score_medio = (float) ($wpdb->get_var($wpdb->prepare(
    "SELECT ROUND(AVG(score), 1) FROM {$table_leads}
     WHERE loja_id = %d AND status NOT IN ('venda_realizada', 'venda_nao_realizada')
       AND score IS NOT NULL AND score > 0",
    $loja_id
  )) ?? 0);

  // Follow-up compliance: vencidos (passado) vs concluídos
  $followups_vencidos = (int) $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM {$table_followups} f
     INNER JOIN {$table_leads} l ON l.id = f.lead_id
     WHERE l.loja_id = %d AND f.agendado_para < NOW()",
    $loja_id
  ));

  $followups_concluidos = (int) $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM {$table_followups} f
     INNER JOIN {$table_leads} l ON l.id = f.lead_id
     WHERE l.loja_id = %d AND f.concluido = 1 AND f.agendado_para < NOW()",
    $loja_id
  ));

  $compliance_pct = $followups_vencidos > 0
    ? round($followups_concluidos / $followups_vencidos * 100, 1)
    : null;

  return new WP_REST_Response([
    'success' => true,
    'data'    => [
      'active_leads'          => $active_leads,
      'sla_breach_count'      => $sla_breach,
      'sla_nao_atendido'      => $sla_nao_atendido,
      'sla_parados'           => $sla_parados,
      'sla_breach_pct'        => $sla_breach_pct,
      'score_medio'           => $score_medio,
      'followup_total'        => $followups_vencidos,
      'followup_concluidos'   => $followups_concluidos,
      'followup_compliance'   => $compliance_pct,
    ],
  ], 200);
}

/**
 * GET /api/v1/usuarios/me/whatsapp-auto-lead
 */
function mytheme_api_get_user_whatsapp_auto_lead(WP_REST_Request $request): WP_REST_Response
{
  $user_id = get_current_user_id();
  $enabled = (bool) get_user_meta($user_id, '_whatsapp_auto_create_lead', true);
  return new WP_REST_Response(['success' => true, 'enabled' => $enabled], 200);
}

/**
 * POST /api/v1/usuarios/me/whatsapp-auto-lead
 */
function mytheme_api_save_user_whatsapp_auto_lead(WP_REST_Request $request): WP_REST_Response
{
  $user_id     = get_current_user_id();
  $body        = $request->get_json_params();
  $enabled     = !empty($body['enabled']);
  $was_enabled = (bool) get_user_meta($user_id, '_whatsapp_auto_create_lead', true);

  update_user_meta($user_id, '_whatsapp_auto_create_lead', $enabled ? '1' : '');

  // Só atualiza o timestamp de início quando a feature é ativada pela primeira vez ou reativada
  if ($enabled && !$was_enabled) {
    update_user_meta($user_id, '_whatsapp_auto_create_lead_since', time());
  }
  if (!$enabled) {
    delete_user_meta($user_id, '_whatsapp_auto_create_lead_since');
  }

  return new WP_REST_Response(['success' => true, 'enabled' => $enabled], 200);
}

/**
 * GET /api/v1/lojas/{id}/leads-config
 */
function mytheme_api_get_loja_leads_config(WP_REST_Request $request): WP_REST_Response
{
  $loja_id = (int) $request['id'];

  $loja = get_post($loja_id);
  if (!$loja || $loja->post_type !== 'lojas') {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Loja não encontrada.'], 404);
  }

  $ocultar        = (bool) get_post_meta($loja_id, '_ocultar_leads_nao_atribuidos', true);
  $auto_atribuir  = get_post_meta($loja_id, '_auto_atribuir_responsavel', true);
  // Default true: se nunca foi salvo, assume ativado
  $auto_atribuir  = $auto_atribuir === '' ? true : (bool) $auto_atribuir;

  return new WP_REST_Response([
    'success'                      => true,
    'ocultar_leads_nao_atribuidos' => $ocultar,
    'auto_atribuir_responsavel'    => $auto_atribuir,
  ], 200);
}

/**
 * POST /api/v1/lojas/{id}/leads-config
 * Body: { "ocultar_leads_nao_atribuidos": true|false, "auto_atribuir_responsavel": true|false }
 */
function mytheme_api_save_loja_leads_config(WP_REST_Request $request): WP_REST_Response
{
  $loja_id = (int) $request['id'];

  $loja = get_post($loja_id);
  if (!$loja || $loja->post_type !== 'lojas') {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Loja não encontrada.'], 404);
  }

  $body    = $request->get_json_params();
  $ocultar = !empty($body['ocultar_leads_nao_atribuidos']);

  update_post_meta($loja_id, '_ocultar_leads_nao_atribuidos', $ocultar ? '1' : '');

  if (isset($body['auto_atribuir_responsavel'])) {
    $auto_atribuir = (bool) $body['auto_atribuir_responsavel'];
    update_post_meta($loja_id, '_auto_atribuir_responsavel', $auto_atribuir ? '1' : '0');
  } else {
    $auto_atribuir_meta = get_post_meta($loja_id, '_auto_atribuir_responsavel', true);
    $auto_atribuir      = $auto_atribuir_meta === '' ? true : (bool) $auto_atribuir_meta;
  }

  return new WP_REST_Response([
    'success'                      => true,
    'ocultar_leads_nao_atribuidos' => $ocultar,
    'auto_atribuir_responsavel'    => $auto_atribuir,
  ], 200);
}