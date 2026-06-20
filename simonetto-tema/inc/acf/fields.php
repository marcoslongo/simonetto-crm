<?php
if (!defined('ABSPATH'))
	exit;
if (!function_exists('acf_add_local_field_group'))
	return;

// =====================================================================
// CAMPOS ACF — Perfil de Acesso (CPT perfil_acesso)
// =====================================================================
acf_add_local_field_group([
	'key' => 'group_perfil_acesso_campos',
	'title' => 'Configurações do Perfil',
	'fields' => [
		[
			'key' => 'field_nivel_atribuicao',
			'label' => 'Nível de Atribuição',
			'name' => 'nivel_atribuicao',
			'type' => 'select',
			'choices' => [
				'atendente' => 'Atendente',
				'gerente' => 'Gerente',
				'supervisor' => 'Supervisor',
				'industria' => 'Indústria',
				'master' => 'Master',
			],
			'default_value' => 'atendente',
			'allow_null' => 0,
			'multiple' => 0,
			'ui' => 1,
			'return_format' => 'value',
			'instructions' => 'Define o que o usuário pode fazer: atendente recebe leads, gerente atribui para atendentes, supervisor atribui para gerentes.',
		],
		[
			'key' => 'field_ver_leads_nao_atribuidos',
			'label' => 'Ver todos os leads da loja',
			'name' => 'ver_leads_nao_atribuidos',
			'type' => 'true_false',
			'default_value' => 0,
			'ui' => 1,
			'ui_on_text' => 'Sim',
			'ui_off_text' => 'Não',
			'instructions' => 'Se ativo, o usuário vê todos os leads da loja, incluindo os não atribuídos e de outros atendentes.',
		],
		[
			'key' => 'field_pode_atribuir_leads',
			'label' => 'Pode atribuir leads',
			'name' => 'pode_atribuir_leads',
			'type' => 'true_false',
			'default_value' => 0,
			'ui' => 1,
			'ui_on_text' => 'Sim',
			'ui_off_text' => 'Não',
			'instructions' => 'Permite ao usuário mudar o responsável de um lead.',
		],
		[
			'key' => 'field_acesso_multiplas_lojas',
			'label' => 'Acesso a múltiplas lojas',
			'name' => 'acesso_multiplas_lojas',
			'type' => 'true_false',
			'default_value' => 0,
			'ui' => 1,
			'ui_on_text' => 'Sim',
			'ui_off_text' => 'Não',
			'instructions' => 'Permite que usuários com este perfil sejam vinculados a mais de uma loja.',
		],
		[
			'key' => 'field_escopo_lojas',
			'label' => 'Escopo de lojas',
			'name' => 'escopo_lojas',
			'type' => 'select',
			'choices' => [
				'proprias' => 'Apenas lojas vinculadas',
				'todas' => 'Todas as lojas do sistema',
			],
			'default_value' => 'proprias',
			'allow_null' => 0,
			'ui' => 1,
			'return_format' => 'value',
			'instructions' => '"Todas as lojas" dá visão global sem precisar vincular loja_ids — reservado para supervisores.',
			'conditional_logic' => [
				[
					[
						'field' => 'field_nivel_atribuicao',
						'operator' => '==',
						'value' => 'supervisor',
					],
				],
				[
					[
						'field' => 'field_nivel_atribuicao',
						'operator' => '==',
						'value' => 'industria',
					],
				],
				[
					[
						'field' => 'field_nivel_atribuicao',
						'operator' => '==',
						'value' => 'master',
					],
				],
			],
		],
	],
	'location' => [
		[
			[
				'param' => 'post_type',
				'operator' => '==',
				'value' => 'perfil_acesso',
			],
		],
	],
	'menu_order' => 0,
	'position' => 'normal',
	'style' => 'default',
	'label_placement' => 'top',
	'instruction_placement' => 'label',
	'active' => true,
]);

// =====================================================================
// CAMPOS ACF — Perfil do Usuário (user_form)
// =====================================================================
acf_add_local_field_group([
	'key' => 'group_usuario_crm_campos',
	'title' => 'Dados do CRM',
	'fields' => [
		[
			'key' => 'field_usuario_loja_id',
			'label' => 'Loja(s) vinculada(s)',
			'name' => 'loja_id',
			'type' => 'post_object',
			'post_type' => ['lojas'],
			'filters' => ['search'],
			'multiple' => 1,
			'allow_null' => 1,
			'return_format' => 'id',
			'ui' => 1,
			'instructions' => 'Selecione a(s) loja(s) às quais este usuário pertence.',
		],
		[
			'key' => 'field_usuario_perfil_acesso_id',
			'label' => 'Perfil de Acesso',
			'name' => 'perfil_acesso_id',
			'type' => 'post_object',
			'post_type' => ['perfil_acesso'],
			'filters' => ['search'],
			'multiple' => 0,
			'allow_null' => 1,
			'return_format' => 'id',
			'ui' => 1,
			'instructions' => 'Define as permissões do usuário no CRM (substitui o campo "é gerente" legado).',
		],
		[
			'key' => 'field_usuario_is_gerente',
			'label' => 'É gerente? (legado)',
			'name' => 'is_gerente',
			'type' => 'true_false',
			'default_value' => 0,
			'ui' => 1,
			'ui_on_text' => 'Sim',
			'ui_off_text' => 'Não',
			'instructions' => 'Campo legado — prefira usar "Perfil de Acesso". Mantido para compatibilidade.',
		],
		[
			'key' => 'field_usuario_is_master',
			'label' => 'É master?',
			'name' => 'is_master',
			'type' => 'true_false',
			'default_value' => 0,
			'ui' => 1,
			'ui_on_text' => 'Sim',
			'ui_off_text' => 'Não',
			'instructions' => 'Acesso master — sobrepõe todas as restrições de perfil.',
		],
	],
	'location' => [
		[
			[
				'param' => 'user_form',
				'operator' => '==',
				'value' => 'all',
			],
		],
	],
	'menu_order' => 0,
	'position' => 'normal',
	'style' => 'default',
	'label_placement' => 'top',
	'instruction_placement' => 'label',
	'active' => true,
]);
