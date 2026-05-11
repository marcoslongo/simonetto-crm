<?php
/**
 * Handler de Lojas - Lógica de negócio
 * 
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

class Loja_Handler
{
  /**
   * Listar todas as lojas
   */
  public static function list()
  {
    $args = array(
      'post_type' => 'lojas',
      'posts_per_page' => -1,
      'post_status' => 'publish',
      'orderby' => 'title',
      'order' => 'ASC'
    );

    $lojas = get_posts($args);
    $resultado = array();

    foreach ($lojas as $loja) {
      $cidade = get_field('cidade', $loja->ID);
      $estado = get_field('estado', $loja->ID);
      $emails = get_field('emails', $loja->ID);

      $resultado[] = array(
        'id' => (string) $loja->ID,
        'nome' => $loja->post_title,
        'cidade' => $cidade,
        'estado' => $estado,
        'localizacao' => trim("{$cidade}/{$estado}", '/'),
        'emails' => $emails
      );
    }

    return $resultado;
  }

  /**
   * Listar lojas com estatísticas
   */
  public static function list_with_stats()
  {
    global $wpdb;

    $args = array(
      'post_type' => 'lojas',
      'posts_per_page' => -1,
      'post_status' => 'publish',
      'orderby' => 'title',
      'order' => 'ASC'
    );

    $lojas = get_posts($args);

    if (empty($lojas)) {
      return array();
    }

    $loja_ids = wp_list_pluck($lojas, 'ID');
    $placeholders = implode(',', array_fill(0, count($loja_ids), '%d'));
    $table_leads = $wpdb->prefix . 'leads';

    $stats_query = "
      SELECT 
        loja_id,
        COUNT(*) as total_leads,
        SUM(CASE WHEN DATE(data_criacao) = CURDATE() THEN 1 ELSE 0 END) as leads_hoje
      FROM {$table_leads}
      WHERE loja_id IN ($placeholders)
      GROUP BY loja_id
    ";

    $stats_results = $wpdb->get_results(
      $wpdb->prepare($stats_query, ...$loja_ids),
      OBJECT_K
    );

    $resultado = array();

    foreach ($lojas as $loja) {
      $loja_id = $loja->ID;
      $cidade = get_field('cidade', $loja_id);
      $estado = get_field('estado', $loja_id);
      $emails = get_field('emails', $loja_id);

      $stats = isset($stats_results[$loja_id]) ? $stats_results[$loja_id] : null;

      $resultado[] = array(
        'id' => (string) $loja_id,
        'nome' => $loja->post_title,
        'cidade' => $cidade,
        'estado' => $estado,
        'localizacao' => trim("{$cidade}/{$estado}", '/'),
        'emails' => $emails,
        'totalLeads' => $stats ? (int) $stats->total_leads : 0,
        'leadsHoje' => $stats ? (int) $stats->leads_hoje : 0,
      );
    }

    return $resultado;
  }

  /**
   * Buscar loja por ID
   */
  public static function get_by_id($loja_id)
  {
    $loja = get_post($loja_id);

    if (!$loja || $loja->post_type !== 'lojas' || $loja->post_status !== 'publish') {
      return null;
    }

    $cidade = get_field('cidade', $loja_id);
    $estado = get_field('estado', $loja_id);
    $emails = get_field('emails', $loja_id);

    return array(
      'id' => (string) $loja_id,
      'nome' => $loja->post_title,
      'cidade' => $cidade,
      'estado' => $estado,
      'localizacao' => trim("{$cidade}/{$estado}", '/'),
      'emails' => $emails
    );
  }

  /**
   * Estatísticas gerais da loja
   */
  public static function get_stats($loja_id)
  {
    global $wpdb;
    $table_leads = $wpdb->prefix . 'leads';

    $stats = $wpdb->get_row($wpdb->prepare("
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN DATE(data_criacao) = CURDATE() THEN 1 ELSE 0 END) as hoje,
        SUM(CASE WHEN data_criacao >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as semana,
        SUM(CASE WHEN data_criacao >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as mes
      FROM {$table_leads}
      WHERE loja_id = %d
    ", $loja_id));

    return array(
      'total' => $stats ? (int) $stats->total : 0,
      'hoje' => $stats ? (int) $stats->hoje : 0,
      'semana' => $stats ? (int) $stats->semana : 0,
      'mes' => $stats ? (int) $stats->mes : 0,
    );
  }

  /**
   * Leads dos últimos 30 dias (agrupados por dia)
   */
  public static function get_leads_30_days($loja_id)
  {
    global $wpdb;
    $table_leads = $wpdb->prefix . 'leads';

    $results = $wpdb->get_results($wpdb->prepare("
      SELECT 
        DATE(data_criacao) as date,
        COUNT(*) as total
      FROM {$table_leads}
      WHERE loja_id = %d
        AND data_criacao >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(data_criacao)
      ORDER BY date ASC
    ", $loja_id));

    // Preenche os dias sem dados com 0
    $data = array();
    $start_date = new DateTime('-29 days');
    $end_date = new DateTime('today');
    
    $results_by_date = array();
    foreach ($results as $row) {
      $results_by_date[$row->date] = (int) $row->total;
    }

    while ($start_date <= $end_date) {
      $date_str = $start_date->format('Y-m-d');
      $data[] = array(
        'date' => $date_str,
        'total' => isset($results_by_date[$date_str]) ? $results_by_date[$date_str] : 0
      );
      $start_date->modify('+1 day');
    }

    return $data;
  }

  /**
   * Métricas de atendimento da loja (taxa de contato, tempo médio de resposta)
   */
  public static function get_service_stats($loja_id)
  {
    global $wpdb;

    $table_leads   = $wpdb->prefix . 'leads';
    $table_actions = $wpdb->prefix . 'leads_actions';

    $row = $wpdb->get_row($wpdb->prepare("
      SELECT
        COUNT(DISTINCT l.id)            AS total_leads,
        COUNT(DISTINCT a.lead_id)       AS leads_contatados,
        COUNT(DISTINCT l.id) - COUNT(DISTINCT a.lead_id) AS leads_nao_contatados,

        ROUND(
          COUNT(DISTINCT a.lead_id) * 100.0 /
          NULLIF(COUNT(DISTINCT l.id), 0), 2
        ) AS perc_contatados,

        ROUND(
          (COUNT(DISTINCT l.id) - COUNT(DISTINCT a.lead_id)) * 100.0 /
          NULLIF(COUNT(DISTINCT l.id), 0), 2
        ) AS perc_nao_contatados,

        ROUND(
          AVG(TIMESTAMPDIFF(MINUTE, l.data_criacao, fa.primeiro_atendimento)), 2
        ) AS tempo_medio_minutos,

        ROUND(
          AVG(TIMESTAMPDIFF(HOUR, l.data_criacao, fa.primeiro_atendimento)), 2
        ) AS tempo_medio_horas

      FROM {$table_leads} l

      LEFT JOIN {$table_actions} a
        ON a.lead_id = l.id

      LEFT JOIN (
        SELECT lead_id, MIN(criado_em) AS primeiro_atendimento
        FROM {$table_actions}
        GROUP BY lead_id
      ) fa ON fa.lead_id = l.id

      WHERE l.loja_id = %d
    ", $loja_id), ARRAY_A);

    if (!$row) {
      return [
        'total_leads'          => 0,
        'leads_contatados'     => 0,
        'leads_nao_contatados' => 0,
        'perc_contatados'      => 0,
        'perc_nao_contatados'  => 0,
        'tempo_medio_minutos'  => null,
        'tempo_medio_horas'    => null,
      ];
    }

    return [
      'total_leads'          => (int)   $row['total_leads'],
      'leads_contatados'     => (int)   $row['leads_contatados'],
      'leads_nao_contatados' => (int)   $row['leads_nao_contatados'],
      'perc_contatados'      => (float) $row['perc_contatados'],
      'perc_nao_contatados'  => (float) $row['perc_nao_contatados'],
      'tempo_medio_minutos'  => $row['tempo_medio_minutos'] !== null ? (float) $row['tempo_medio_minutos'] : null,
      'tempo_medio_horas'    => $row['tempo_medio_horas']   !== null ? (float) $row['tempo_medio_horas']   : null,
    ];
  }

  /**
   * Leads dos últimos 12 meses (agrupados por mês)
   */
  public static function get_leads_12_months($loja_id)
  {
    global $wpdb;
    $table_leads = $wpdb->prefix . 'leads';

    $results = $wpdb->get_results($wpdb->prepare("
      SELECT 
        DATE_FORMAT(data_criacao, '%%Y-%%m-01') as date,
        COUNT(*) as total
      FROM {$table_leads}
      WHERE loja_id = %d
        AND data_criacao >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(data_criacao, '%%Y-%%m')
      ORDER BY date ASC
    ", $loja_id));

    $data = array();
    $start_date = new DateTime('first day of -11 months');
    $end_date = new DateTime('first day of this month');
    
    $results_by_month = array();
    foreach ($results as $row) {
      $results_by_month[$row->date] = (int) $row->total;
    }

    while ($start_date <= $end_date) {
      $date_str = $start_date->format('Y-m-01');
      $data[] = array(
        'date' => $date_str,
        'total' => isset($results_by_month[$date_str]) ? $results_by_month[$date_str] : 0
      );
      $start_date->modify('+1 month');
    }

    return $data;
  }
}