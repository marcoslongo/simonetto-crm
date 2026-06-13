<?php
function registrar_cpt_portfolio()
{
  register_post_type('portfolio', array(
    'labels' => array(
      'name' => 'Portfólio',
      'singular_name' => 'Projeto',
      'add_new' => 'Adicionar Projeto',
      'add_new_item' => 'Adicionar Novo Projeto',
      'edit_item' => 'Editar Projeto',
      'all_items' => 'Todos os Projetos'
    ),
    'public' => true,
    'has_archive' => true,
    'show_in_rest' => true,
    'supports' => array('title', 'thumbnail'),
    'menu_icon' => 'dashicons-portfolio',
    'show_in_nav_menus' => true,
    'taxonomies' => array('category_portfolio', 'post_tag'),
    'show_in_graphql' => true,
    'graphql_single_name' => 'Projeto',
    'graphql_plural_name' => 'Projetos',
  ));
}
add_action('init', 'registrar_cpt_portfolio');

// Registrar taxonomia personalizada para categorias do portfólio
function registrar_taxonomia_category_portfolio()
{
  register_taxonomy('category_portfolio', 'portfolio', array(
    'labels' => array(
      'name' => 'Categorias do Portfólio',
      'singular_name' => 'Categoria',
      'add_new_item' => 'Adicionar Nova Categoria',
      'edit_item' => 'Editar Categoria',
      'all_items' => 'Todas as Categorias'
    ),
    'hierarchical' => true,
    'show_in_rest' => true,
    'show_admin_column' => true,
    'show_in_graphql' => true,
    'graphql_single_name' => 'CategoriaPortfolio',
    'graphql_plural_name' => 'CategoriasPortfolio',
  ));
}
add_action('init', 'registrar_taxonomia_category_portfolio');

function remover_supports_portfolio()
{
  remove_post_type_support('portfolio', 'editor');
  remove_post_type_support('portfolio', 'excerpt');
  remove_post_type_support('portfolio', 'comments');
  remove_post_type_support('portfolio', 'author');
  remove_post_type_support('portfolio', 'trackbacks');
  remove_post_type_support('portfolio', 'custom-fields');
  remove_post_type_support('portfolio', 'revisions');
  remove_post_type_support('portfolio', 'page-attributes');
  remove_post_type_support('portfolio', 'post-formats');
}
add_action('init', 'remover_supports_portfolio', 100);