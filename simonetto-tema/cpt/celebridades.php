<?php
function registrar_cpt_celebridades()
{
	register_post_type('celebridades', array(
		'labels' => array(
			'name' => 'Celebridades',
			'singular_name' => 'Celebridade',
			'add_new' => 'Adicionar Celebridade',
			'add_new_item' => 'Adicionar Nova Celebridade',
			'edit_item' => 'Editar Celebridade',
			'all_items' => 'Todas as Celebridades'
		),
		'public' => true,
		'has_archive' => false,
		'show_in_rest' => true,
		'supports' => array('title'),
		'menu_icon' => 'dashicons-star-filled',
		'show_in_nav_menus' => true,
		'show_in_graphql' => true,
		'graphql_single_name' => 'Celebridade',
		'graphql_plural_name' => 'Celebridades',
	));
}
add_action('init', 'registrar_cpt_celebridades');

function remover_supports_celebridades()
{
	remove_post_type_support('celebridades', 'editor');
	remove_post_type_support('celebridades', 'thumbnail');
	remove_post_type_support('celebridades', 'excerpt');
	remove_post_type_support('celebridades', 'comments');
	remove_post_type_support('celebridades', 'author');
	remove_post_type_support('celebridades', 'trackbacks');
	remove_post_type_support('celebridades', 'custom-fields');
	remove_post_type_support('celebridades', 'revisions');
	remove_post_type_support('celebridades', 'page-attributes');
	remove_post_type_support('celebridades', 'post-formats');
}
add_action('init', 'remover_supports_celebridades', 100);