<?php
/**
 * Handler de Estatísticas - Lógica de negócio
 * 
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

class Stats_Handler
{
  /**
   * Estatísticas gerais
   */
  public static function get_general()
  {
    global $wpdb;

    $table = $wpdb->prefix . 'leads';

    $total = $wpdb->get_var("SELECT COUNT(*) FROM {$table}");

    $today = $wpdb->get_var("
      SELECT COUNT(*) 
      FROM {$table}
      WHERE DATE(data_criacao) = CURDATE()
    ");

    $ultima = $wpdb->get_var("
      SELECT MAX(data_criacao)
      FROM {$table}
    ");

    return array(
      'total' => (int) $total,
      'today' => (int) $today,
      'ultimaCaptura' => $ultima
    );
  }

  /**
   * Leads por investimento
   */
  public static function by_investment()
  {
    global $wpdb;

    $table = $wpdb->prefix . 'leads';

    return $wpdb->get_results("
      SELECT expectativa_investimento, COUNT(*) as total
      FROM {$table}
      GROUP BY expectativa_investimento
      ORDER BY total DESC
    ");
  }

  /**
   * Leads por interesse
   */
  public static function by_interest()
  {
    global $wpdb;

    $table = $wpdb->prefix . 'leads';

    return $wpdb->get_results("
      SELECT interesse, COUNT(*) as total
      FROM {$table}
      GROUP BY interesse
      ORDER BY total DESC
    ");
  }

  /**
   * Leads por loja
   */
  public static function by_store()
  {
    global $wpdb;

    $table = $wpdb->prefix . 'leads';

    return $wpdb->get_results("
      SELECT loja_regiao, COUNT(*) as total
      FROM {$table}
      GROUP BY loja_regiao
      ORDER BY total DESC
    ");
  }

  /**
   * Leads últimos 30 dias
   */
  public static function last_30_days()
  {
    global $wpdb;

    $table = $wpdb->prefix . 'leads';

    return $wpdb->get_results("
      SELECT DATE(data_criacao) as data, COUNT(*) as total
      FROM {$table}
      WHERE data_criacao >= CURDATE() - INTERVAL 30 DAY
      GROUP BY DATE(data_criacao)
      ORDER BY data ASC
    ");
  }

  /**
   * Estatísticas geográficas
   */
  public static function geo_stats()
  {
    global $wpdb;

    $table = $wpdb->prefix . 'leads';

    $results = $wpdb->get_results("
      SELECT 
        estado,
        loja_id,
        loja_regiao,
        COUNT(*) as total
      FROM {$table}
      WHERE estado IS NOT NULL
      GROUP BY estado, loja_id, loja_regiao
      ORDER BY total DESC
    ");

    $grouped = [];

    foreach ($results as $row) {
      $estado = strtoupper(trim($row->estado));

      if (!isset($grouped[$estado])) {
        $grouped[$estado] = [
          'estado' => $estado,
          'total' => 0,
          'lojas' => []
        ];
      }

      $grouped[$estado]['total'] += (int) $row->total;

      $grouped[$estado]['lojas'][] = [
        'id' => (int) $row->loja_id,
        'nome' => $row->loja_regiao ?: 'Não informado',
        'leads' => (int) $row->total,
      ];
    }

    return array_values($grouped);
  }

  /**
   * Estatísticas de atendimento
   */
  public static function service_stats()
  {
    global $wpdb;

    $table_leads = $wpdb->prefix . 'leads';
    $table_actions = $wpdb->prefix . 'leads_actions';

    $sql = "
      SELECT
        COUNT(DISTINCT l.id) AS total_leads,
        COUNT(DISTINCT a.lead_id) AS leads_contatados,
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
          AVG(
            TIMESTAMPDIFF(
              MINUTE,
              l.data_criacao,
              fa.primeiro_atendimento
            )
          ), 2
        ) AS tempo_medio_minutos,

        ROUND(
          AVG(
            TIMESTAMPDIFF(
              HOUR,
              l.data_criacao,
              fa.primeiro_atendimento
            )
          ), 2
        ) AS tempo_medio_horas

      FROM {$table_leads} l

      LEFT JOIN {$table_actions} a
        ON a.lead_id = l.id

      LEFT JOIN (
        SELECT
          lead_id,
          MIN(criado_em) AS primeiro_atendimento
        FROM {$table_actions}
        GROUP BY lead_id
      ) fa ON fa.lead_id = l.id
    ";

    return $wpdb->get_row($sql, ARRAY_A);
  }

  /**
   * Tempo médio por loja
   */
  public static function avg_time_by_store()
  {
    global $wpdb;

    $table_leads = $wpdb->prefix . 'leads';
    $table_actions = $wpdb->prefix . 'leads_actions';
    $table_posts = $wpdb->posts;

    $sql = "
      SELECT
        l.loja_id,
        p.post_title AS loja_nome,
        COUNT(DISTINCT l.id) AS total_leads,

        ROUND(
          AVG(
            TIMESTAMPDIFF(
              MINUTE,
              l.data_criacao,
              fa.primeiro_atendimento
            )
          ), 2
        ) AS tempo_medio_minutos,

        ROUND(
          AVG(
            TIMESTAMPDIFF(
              HOUR,
              l.data_criacao,
              fa.primeiro_atendimento
            )
          ), 2
        ) AS tempo_medio_horas

      FROM {$table_leads} l

      INNER JOIN {$table_posts} p
        ON p.ID = l.loja_id
        AND p.post_type = 'lojas'

      INNER JOIN (
        SELECT
          lead_id,
          MIN(criado_em) AS primeiro_atendimento
        FROM {$table_actions}
        GROUP BY lead_id
      ) fa ON fa.lead_id = l.id

      WHERE l.loja_id IS NOT NULL

      GROUP BY l.loja_id

      ORDER BY tempo_medio_minutos DESC
    ";

    $result = $wpdb->get_results($sql, ARRAY_A);

    $ranking = 1;
    foreach ($result as &$row) {
      $row['ranking'] = $ranking++;
      $row['loja_id'] = (string) $row['loja_id'];
    }

    return $result;
  }
}