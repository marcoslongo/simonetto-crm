<?php
/**
 * CPT: Perfil de Acesso
 * Define as permissões de visibilidade e atribuição de leads por perfil de usuário.
 */

if (!defined('ABSPATH')) exit;

add_action('init', function () {
  register_post_type('perfil_acesso', [
    'labels' => [
      'name'               => 'Perfis de Acesso',
      'singular_name'      => 'Perfil de Acesso',
      'add_new'            => 'Novo Perfil',
      'add_new_item'       => 'Adicionar Perfil de Acesso',
      'edit_item'          => 'Editar Perfil de Acesso',
      'all_items'          => 'Todos os Perfis',
      'search_items'       => 'Buscar Perfis',
      'not_found'          => 'Nenhum perfil encontrado.',
    ],
    'public'              => false,
    'show_ui'             => true,
    'show_in_menu'        => true,
    'show_in_rest'        => false,
    'supports'            => ['title'],
    'menu_icon'           => 'dashicons-shield',
    'menu_position'       => 30,
    'capability_type'     => 'post',
    'map_meta_cap'        => true,
  ]);
});
