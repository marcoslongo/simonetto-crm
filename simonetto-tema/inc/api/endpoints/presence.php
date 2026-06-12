<?php
/**
 * Endpoints de presença online (heartbeat)
 *
 * Qualquer usuário autenticado envia um POST a cada 60 s para registrar
 * sua atividade. Apenas masters podem consultar a lista de usuários online.
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

if (!defined('CRM_PRESENCE_META'))    define('CRM_PRESENCE_META',    '_crm_last_active');
if (!defined('CRM_ONLINE_THRESHOLD')) define('CRM_ONLINE_THRESHOLD', 180);

add_action('rest_api_init', function () {

  // POST /api/v1/presence — heartbeat do usuário atual
  register_rest_route('api/v1', '/presence', [
    'methods'             => 'POST',
    'callback'            => 'crm_presence_heartbeat',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ]);

  // GET /api/v1/presence — lista usuários online (master only)
  register_rest_route('api/v1', '/presence', [
    'methods'             => 'GET',
    'callback'            => 'crm_presence_list_online',
    'permission_callback' => 'mytheme_api_is_master',
  ]);
});

/**
 * Atualiza o timestamp de última atividade do usuário atual.
 */
function crm_presence_heartbeat(): WP_REST_Response
{
  update_user_meta(get_current_user_id(), CRM_PRESENCE_META, time());
  return new WP_REST_Response(['ok' => true], 200);
}

/**
 * Retorna todos os usuários que fizeram heartbeat nos últimos 3 minutos.
 */
function crm_presence_list_online(): WP_REST_Response
{
  $cutoff = time() - CRM_ONLINE_THRESHOLD;

  // Busca todos os usuários com _crm_last_active >= cutoff
  $users = get_users([
    'meta_key'     => CRM_PRESENCE_META,
    'meta_value'   => $cutoff,
    'meta_compare' => '>=',
    'meta_type'    => 'NUMERIC',
    'orderby'      => 'meta_value',
    'order'        => 'DESC',
    'fields'       => 'all',
  ]);

  $online = [];
  foreach ($users as $user) {
    $last_active = (int) get_user_meta($user->ID, CRM_PRESENCE_META, true);
    $is_admin    = in_array('administrator', (array) $user->roles, true);
    $is_master   = $is_admin && (bool) get_field('is_master', 'user_' . $user->ID);

    // Determina role legível
    $role = 'loja';
    if ($is_admin) {
      $role = $is_master ? 'master' : 'admin';
    } elseif (get_field('is_gerente', 'user_' . $user->ID)) {
      $role = 'gerente';
    }

    $online[] = [
      'id'          => $user->ID,
      'nome'        => $user->display_name,
      'email'       => $user->user_email,
      'avatar'      => get_user_meta($user->ID, '_crm_avatar_url', true) ?: get_avatar_url($user->ID, ['size' => 48]),
      'role'        => $role,
      'loja_nome'   => get_field('loja_nome', 'user_' . $user->ID) ?: null,
      'last_active' => $last_active,
    ];
  }

  return new WP_REST_Response([
    'online' => $online,
    'total'  => count($online),
  ], 200);
}
