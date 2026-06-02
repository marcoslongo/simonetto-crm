<?php
/**
 * Handler de Leads Arquitetos
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

class Lead_Arquiteto_Handler
{
  /**
   * Criar novo lead de arquiteto
   */
  public static function create($params)
  {
    global $wpdb;

    if (empty($params['nome']) || empty($params['telefone'])) {
      return new WP_Error('missing_fields', 'Nome e telefone são obrigatórios.', ['status' => 400]);
    }

    if (!empty($params['email']) && !is_email($params['email'])) {
      return new WP_Error('invalid_email', 'E-mail inválido.', ['status' => 400]);
    }

    $table = $wpdb->prefix . 'leads_arquitetos';

    $dados = [
      'nome'              => sanitize_text_field($params['nome']),
      'email'             => sanitize_email($params['email'] ?? ''),
      'telefone'          => sanitize_text_field($params['telefone']),
      'cidade'            => isset($params['cidade'])           ? sanitize_text_field($params['cidade'])            : null,
      'escritorio'        => isset($params['escritorio'])       ? sanitize_text_field($params['escritorio'])        : null,
      'instagram'         => isset($params['instagram'])        ? sanitize_text_field($params['instagram'])         : null,
      'especifica_moveis' => isset($params['especifica_moveis']) ? sanitize_text_field($params['especifica_moveis']) : null,
      'mensagem'          => isset($params['mensagem'])         ? sanitize_textarea_field($params['mensagem'])      : null,
      'utm_source'        => isset($params['utm_source'])       ? sanitize_text_field($params['utm_source'])        : null,
      'utm_medium'        => isset($params['utm_medium'])       ? sanitize_text_field($params['utm_medium'])        : null,
      'utm_campaign'      => isset($params['utm_campaign'])     ? sanitize_text_field($params['utm_campaign'])      : null,
      'utm_content'       => isset($params['utm_content'])      ? sanitize_text_field($params['utm_content'])       : null,
      'utm_term'          => isset($params['utm_term'])         ? sanitize_text_field($params['utm_term'])          : null,
      'referrer'          => isset($params['referrer'])         ? sanitize_text_field($params['referrer'])          : null,
      'landing_page'      => isset($params['landing_page'])     ? sanitize_text_field($params['landing_page'])      : null,
      'user_agent'        => isset($params['user_agent'])       ? sanitize_text_field($params['user_agent'])        : null,
      'data_criacao'      => current_time('mysql'),
    ];

    $resultado = $wpdb->insert($table, $dados);

    if ($resultado === false) {
      return new WP_Error('db_error', 'Erro ao inserir lead no banco de dados: ' . $wpdb->last_error, ['status' => 500]);
    }

    return [
      'lead_id' => $wpdb->insert_id,
    ];
  }
}
