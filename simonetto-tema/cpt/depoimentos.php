<?php
function registrar_cpt_depoimentos()
{
	register_post_type('depoimentos', array(
		'labels' => array(
			'name' => 'Depoimentos',
			'singular_name' => 'Depoimento',
			'add_new' => 'Adicionar Depoimento',
			'add_new_item' => 'Adicionar Novo Depoimento',
			'edit_item' => 'Editar Depoimento',
			'all_items' => 'Todos os Depoimentos'
		),
		'public' => true,
		'has_archive' => false,
		'show_in_rest' => true,
		'supports' => array('title'),
		'menu_icon' => 'dashicons-testimonial',
		'show_in_nav_menus' => true,
		'show_in_graphql' => true,
		'graphql_single_name' => 'Depoimento',
		'graphql_plural_name' => 'Depoimentos',
	));
}
add_action('init', 'registrar_cpt_depoimentos');

function remover_supports_depoimentos()
{
	remove_post_type_support('depoimentos', 'editor');
	remove_post_type_support('depoimentos', 'thumbnail');
	remove_post_type_support('depoimentos', 'excerpt');
	remove_post_type_support('depoimentos', 'comments');
	remove_post_type_support('depoimentos', 'author');
	remove_post_type_support('depoimentos', 'trackbacks');
	remove_post_type_support('depoimentos', 'custom-fields');
	remove_post_type_support('depoimentos', 'revisions');
	remove_post_type_support('depoimentos', 'page-attributes');
	remove_post_type_support('depoimentos', 'post-formats');
}
add_action('init', 'remover_supports_depoimentos', 100);