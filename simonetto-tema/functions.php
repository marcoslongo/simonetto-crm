<?php
/**
 * Theme Functions
 * 
 * @package MyTheme
 */

// ===============================
// Definir constantes do tema
// ===============================
define('THEME_VERSION', '1.0.0');
define('THEME_DIR', get_template_directory());
define('THEME_URI', get_template_directory_uri());


define('JWT_AUTH_SECRET_KEY', 'ilTF}j-R_K5lu3*.3x_U0j5w*v?Zu+H5YQa-0+LFIyvA#fiuN=w&5m)&<?)<-Vnn');

add_action('rest_api_init', function () {
  register_rest_route('crm/v1', '/login', [
    'methods'  => 'POST',
    'callback' => 'crm_login_user',
    'permission_callback' => '__return_true',
  ]);
});

add_filter('jwt_auth_token_before_dispatch', 'add_loja_role_userid_to_jwt', 10, 2);

function add_loja_role_userid_to_jwt($data, $user) {
    $user_id = $user->ID;

    $raw      = get_field('loja_id', 'user_' . $user_id);
    $loja_ids = is_array($raw)
        ? array_values(array_filter(array_map('intval', $raw)))
        : ($raw ? [intval($raw)] : []);

    $roles      = $user->roles;
    $is_gerente = (bool) get_field('is_gerente', 'user_' . $user_id);
    $is_master  = (bool) get_field('is_master',  'user_' . $user_id);
    $avatar_url = get_user_meta($user_id, '_crm_avatar_url', true) ?: null;

    $perfil_acesso = crm_get_perfil_acesso($user_id);

    $data['user_id'] = $user_id;
    $data['role']    = $roles;
    $data['acf']     = [
        'loja_ids'      => $loja_ids,
        'is_gerente'    => $is_gerente,
        'is_master'     => $is_master,
        'avatar_url'    => $avatar_url,
        'perfil_acesso' => $perfil_acesso,
    ];

    return $data;
}

/**
 * Retorna as configurações do perfil de acesso do usuário (ou null se não configurado).
 */
function crm_get_perfil_acesso(int $user_id): ?array {
    $perfil_id = get_field('perfil_acesso_id', 'user_' . $user_id);
    if (!$perfil_id) return null;

    $post = get_post(intval($perfil_id));
    if (!$post || $post->post_type !== 'perfil_acesso') return null;

    return [
        'id'                      => (int) $post->ID,
        'nome'                    => $post->post_title,
        'ver_leads_nao_atribuidos'=> (bool) get_field('ver_leads_nao_atribuidos', $post->ID),
        'pode_atribuir_leads'     => (bool) get_field('pode_atribuir_leads',      $post->ID),
        'nivel_atribuicao'        => get_field('nivel_atribuicao', $post->ID) ?: 'atendente',
        'acesso_multiplas_lojas'  => (bool) get_field('acesso_multiplas_lojas',   $post->ID),
    ];
}



// Níveis que têm acesso de supervisor (veem múltiplas lojas, atribuem para gerentes)
define('CRM_NIVEIS_SUPERVISOR', ['master', 'supervisor', 'industria']);
// Níveis que têm acesso de gerente ou superior
define('CRM_NIVEIS_GERENTE', ['master', 'supervisor', 'industria', 'gerente']);

/**
 * Retorna o responsavel_id a ser usado como filtro em queries de stats.
 * Retorna 0 quando o usuário pode ver todos os leads da loja.
 */
function crm_stats_responsavel_filter(): int {
  if (current_user_can('administrator')) return 0;
  $uid    = get_current_user_id();
  $perfil = crm_get_perfil_acesso($uid);
  if ($perfil) {
    return !$perfil['ver_leads_nao_atribuidos'] ? $uid : 0;
  }
  // fallback legado: atendente com ocultar ativo
  $is_gerente = (bool) get_field('is_gerente', 'user_' . $uid);
  $ocultar    = (bool) get_field('ocultar_leads_nao_atribuidos', 'user_' . $uid);
  return (!$is_gerente && $ocultar) ? $uid : 0;
}

function crm_login_user(WP_REST_Request $request) {
  $email    = $request->get_param('email');
  $password = $request->get_param('password');

  if (empty($email) || empty($password)) {
    return new WP_REST_Response([
      'error' => 'Email e senha obrigatórios'
    ], 400);
  }

  $user = wp_authenticate($email, $password);

  if (is_wp_error($user)) {
    return new WP_REST_Response([
      'error' => 'Credenciais inválidas'
    ], 401);
  }

  $raw      = get_field('loja_id', 'user_' . $user->ID);
  $loja_ids = is_array($raw)
    ? array_values(array_filter(array_map('intval', $raw)))
    : ($raw ? [intval($raw)] : []);

  $loja_nome     = get_user_meta($user->ID, 'loja_nome', true);
  $role          = $user->roles[0] ?? 'subscriber';
  $is_gerente    = (bool) get_field('is_gerente', 'user_' . $user->ID);
  $is_master     = (bool) get_field('is_master',  'user_' . $user->ID);
  $avatar_url    = get_user_meta($user->ID, '_crm_avatar_url', true) ?: null;
  $perfil_acesso = crm_get_perfil_acesso($user->ID);

  return new WP_REST_Response([
    'token' => wp_create_nonce('crm_auth_' . $user->ID),
    'user' => [
      'id'            => $user->ID,
      'email'         => $user->user_email,
      'name'          => $user->display_name,
      'role'          => $role === 'administrator' ? 'administrator' : 'loja',
      'loja_ids'      => $loja_ids,
      'loja_nome'     => $loja_nome ?: null,
      'is_gerente'    => $is_gerente,
      'is_master'     => $is_master,
      'avatar_url'    => $avatar_url,
      'perfil_acesso' => $perfil_acesso,
    ],
    'expires' => date('c', time() + WEEK_IN_SECONDS),
  ]);
}


// ===============================
// Redireciona homepage para wp-admin
// ===============================
add_action('template_redirect', function () {
    if ((is_front_page() || is_home()) && !is_admin() && !wp_doing_ajax()) {
        wp_redirect(admin_url());
        exit;
    }
});

// ===============================
// Setup do Tema
// ===============================
function mytheme_setup() {
    // Suporte para título dinâmico
    add_theme_support('title-tag');
    
    // Suporte para logos personalizadas
    add_theme_support('custom-logo');
    
    // Remover emojis do WordPress
    remove_action('wp_head', 'print_emoji_detection_script', 7);
    remove_action('wp_print_styles', 'print_emoji_styles');
}
add_action('after_setup_theme', 'mytheme_setup');

// ===============================
// Carregar scripts e styles
// ===============================
function mytheme_scripts() {
    // CSS
    wp_enqueue_style('mytheme-style', get_stylesheet_uri(), array(), THEME_VERSION);
    
    // JS
    wp_enqueue_script('mytheme-script', THEME_URI . '/assets/js/main.js', array(), THEME_VERSION, true);
}
add_action('wp_enqueue_scripts', 'mytheme_scripts');

// ===============================
// Carregar CPTs personalizados
// ===============================
function mytheme_load_custom_post_types() {
    $cpt_files = array(
        'lojas.php',
        'depoimentos.php',
        'celebridades.php',
        'portfolio.php',
        'perfil-acesso.php',
    );
    
    foreach ($cpt_files as $file) {
        $cpt_path = THEME_DIR . '/cpt/' . $file;
        if (file_exists($cpt_path)) {
            require_once $cpt_path;
        }
    }
}
add_action('init', 'mytheme_load_custom_post_types', 0);

// ===============================
// Carregar APIs personalizadas
// ===============================
// Carregar API
require_once get_template_directory() . '/inc/api/init.php';

// ===============================
// Migração: adicionar coluna origem à wp_leads
// ===============================
add_action('admin_init', function () {
  global $wpdb;

  $option_key = 'simonetto_leads_origem_migration_v1';
  if (get_option($option_key)) {
    return;
  }

  $table = $wpdb->prefix . 'leads';

  $col_exists = $wpdb->get_results($wpdb->prepare(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = 'origem'",
    DB_NAME, $table
  ));

  if (empty($col_exists)) {
    $wpdb->query(
      "ALTER TABLE `{$table}`
       ADD COLUMN `origem` ENUM('industria','proprio') NOT NULL DEFAULT 'industria'
       AFTER `loja_id`"
    );
  }

  update_option($option_key, true);
});

// ===============================
// Migração: adicionar coluna motivo_desqualificado à wp_lead_venda_nao_realizada
// ===============================
add_action('admin_init', function () {
  global $wpdb;

  $option_key = 'simonetto_vnr_desqualificado_migration_v1';
  if (get_option($option_key)) {
    return;
  }

  $table = $wpdb->prefix . 'lead_venda_nao_realizada';

  $col_exists = $wpdb->get_results($wpdb->prepare(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = 'motivo_desqualificado'",
    DB_NAME, $table
  ));

  if (empty($col_exists)) {
    $wpdb->query(
      "ALTER TABLE `{$table}`
       ADD COLUMN `motivo_desqualificado` TINYINT(1) NOT NULL DEFAULT 0
       AFTER `motivo_atendimento`"
    );
  }

  update_option($option_key, true);
});

// ===============================
// Remover o post type padrão "post"
// ===============================
function mytheme_remove_default_post_type() {
    // Remove o menu "Posts" do admin
    remove_menu_page('edit.php');
}
add_action('admin_menu', 'mytheme_remove_default_post_type');

// Desregistrar completamente o tipo de post "post"
function mytheme_disable_default_post_type() {
    global $wp_post_types;
    if (isset($wp_post_types['post'])) {
        unset($wp_post_types['post']);
    }
}
add_action('init', 'mytheme_disable_default_post_type', 11);

// Remover categorias e tags padrão
function mytheme_unregister_default_taxonomies() {
    unregister_taxonomy('category');
    unregister_taxonomy('post_tag');
}
add_action('init', 'mytheme_unregister_default_taxonomies');

// ===============================
// Desativar o editor para alguns CPTs
// ===============================
function mytheme_remove_editor_for_cpts() {
    if (isset($_GET['post'])) {
        $post_id = $_GET['post'];
    } else if (isset($_POST['post_ID'])) {
        $post_id = $_POST['post_ID'];
    }
    
    if (!isset($post_id)) return;
    
    $post_type = get_post_type($post_id);
    
    $cpts_sem_editor = array('lojas', 'depoimentos', 'celebridades');
    
    if (in_array($post_type, $cpts_sem_editor)) {
        remove_post_type_support($post_type, 'editor');
    }
}
add_action('init', 'mytheme_remove_editor_for_cpts');

// ===============================
// Otimizações e limpeza do WordPress
// ===============================
function mytheme_cleanup_head() {
    remove_action('wp_head', 'rsd_link');
    remove_action('wp_head', 'wlwmanifest_link');
    remove_action('wp_head', 'wp_generator');
    remove_action('wp_head', 'start_post_rel_link');
    remove_action('wp_head', 'index_rel_link');
    remove_action('wp_head', 'adjacent_posts_rel_link');
}
add_action('init', 'mytheme_cleanup_head');

// ===============================
// Desativar comentários globalmente
// ===============================
function mytheme_disable_comments() {
    // Fechar comentários nas páginas
    add_filter('comments_open', '__return_false', 20, 2);
    add_filter('pings_open', '__return_false', 20, 2);
    
    // Ocultar comentários existentes
    add_filter('comments_array', '__return_empty_array', 10, 2);
    
    // Remover suporte a comentários nos post types
    $post_types = get_post_types();
    foreach ($post_types as $post_type) {
        if (post_type_supports($post_type, 'comments')) {
            remove_post_type_support($post_type, 'comments');
            remove_post_type_support($post_type, 'trackbacks');
        }
    }
}
add_action('init', 'mytheme_disable_comments');

// ===============================
// Remover menu de comentários do admin
// ===============================
function mytheme_remove_comments_menu() {
    remove_menu_page('edit-comments.php');
}
add_action('admin_menu', 'mytheme_remove_comments_menu');

// ===============================
// Redirecionar tentativa de acessar página de comentários
// ===============================
function mytheme_redirect_comments_page() {
    global $pagenow;
    if ($pagenow === 'edit-comments.php') {
        wp_redirect(admin_url());
        exit;
    }
}
add_action('admin_init', 'mytheme_redirect_comments_page');