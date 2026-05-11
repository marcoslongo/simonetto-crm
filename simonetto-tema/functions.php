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

    // Pega o campo ACF 'loja_id' do usuário
    $loja_id = get_field('loja_id', 'user_' . $user_id);

    // Pega os roles do usuário
    $roles = $user->roles; // Array de roles, ex: ['administrator']

    // Adiciona ao retorno do JWT
    $data['user_id'] = $user_id;   // ID do usuário
    $data['role']    = $roles;     // Roles do usuário
    $data['acf']     = array(
        'loja_id' => $loja_id     // Campo ACF da loja
    );

    return $data;
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

  // Dados extras
  $loja_id   = get_user_meta($user->ID, 'loja_id', true);
  $loja_nome = get_user_meta($user->ID, 'loja_nome', true);

  // Role principal
  $role = $user->roles[0] ?? 'subscriber';

  return new WP_REST_Response([
    'token' => wp_create_nonce('crm_auth_' . $user->ID),
    'user' => [
      'id'         => $user->ID,
      'email'      => $user->user_email,
      'name'       => $user->display_name,
      'role'       => $role === 'administrator' ? 'administrator' : 'loja',
      'loja_id'    => $loja_id ? intval($loja_id) : null,
      'loja_nome'  => $loja_nome ?: null,
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
        'portfolio.php'
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