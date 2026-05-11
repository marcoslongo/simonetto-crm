<?php
function registrar_cpt_lojas()
{
	register_post_type('lojas', array(
		'labels' => array(
			'name' => 'Lojas',
			'singular_name' => 'Loja',
			'add_new' => 'Adicionar Loja',
			'add_new_item' => 'Adicionar Nova Loja',
			'edit_item' => 'Editar Loja',
			'all_items' => 'Todas as Lojas'
		),
		'public' => true,
		'has_archive' => false,
		'show_in_rest' => true,
		'supports' => array('title'),
		'menu_icon' => 'dashicons-store',
		'show_in_nav_menus' => true,
		'show_in_graphql' => true,
		'graphql_single_name' => 'Loja',
		'graphql_plural_name' => 'Lojas',
	));
}
add_action('init', 'registrar_cpt_lojas');

function remover_supports_lojas()
{
	remove_post_type_support('lojas', 'editor');
	remove_post_type_support('lojas', 'thumbnail');
	remove_post_type_support('lojas', 'excerpt');
	remove_post_type_support('lojas', 'comments');
	remove_post_type_support('lojas', 'author');
	remove_post_type_support('lojas', 'trackbacks');
	remove_post_type_support('lojas', 'custom-fields');
	remove_post_type_support('lojas', 'revisions');
	remove_post_type_support('lojas', 'page-attributes');
	remove_post_type_support('lojas', 'post-formats');
}
add_action('init', 'remover_supports_lojas', 100);