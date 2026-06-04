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
  public static function get_general($origem = null)
  {
    global $wpdb;

    $table = $wpdb->prefix . 'leads';

    $where = '';
    if ($origem && in_array($origem, ['industria', 'proprio'], true)) {
      $where = $wpdb->prepare(" WHERE origem = %s", $origem);
    }

    $total = $wpdb->get_var("SELECT COUNT(*) FROM {$table}{$where}");

    $today_where = $where
      ? $where . " AND DATE(data_criacao) = CURDATE()"
      : " WHERE DATE(data_criacao) = CURDATE()";

    $today = $wpdb->get_var("
      SELECT COUNT(*)
      FROM {$table}{$today_where}
    ");

    $ultima = $wpdb->get_var("
      SELECT MAX(data_criacao)
      FROM {$table}{$where}
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
  public static function last_30_days($origem = null)
  {
    global $wpdb;

    $table = $wpdb->prefix . 'leads';

    $where = "WHERE data_criacao >= CURDATE() - INTERVAL 30 DAY";
    if ($origem && in_array($origem, ['industria', 'proprio'], true)) {
      $where .= $wpdb->prepare(" AND origem = %s", $origem);
    }

    return $wpdb->get_results("
      SELECT DATE(data_criacao) as data, COUNT(*) as total
      FROM {$table}
      {$where}
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
   * Taxa de conversão por loja
   */
  public static function conversao_por_loja(array $loja_ids = []): array
  {
    global $wpdb;
    $table_leads = $wpdb->prefix . 'leads';
    $table_posts = $wpdb->posts;

    $where = 'WHERE l.loja_id IS NOT NULL';
    if (!empty($loja_ids)) {
      $loja_ids = array_values(array_map('intval', $loja_ids));
      $placeholders = implode(',', array_fill(0, count($loja_ids), '%d'));
      $where .= $wpdb->prepare(" AND l.loja_id IN ($placeholders)", ...$loja_ids);
    }

    $sql = "
      SELECT
        l.loja_id,
        p.post_title AS loja_nome,
        COUNT(*) AS total_leads,
        SUM(l.status = 'venda_realizada') AS vendas_realizadas,
        SUM(l.status = 'venda_nao_realizada') AS vendas_nao_realizadas,
        SUM(l.status = 'em_negociacao') AS em_negociacao,
        SUM(l.status = 'nao_atendido') AS nao_atendido,
        ROUND(
          SUM(l.status = 'venda_realizada') * 100.0 /
          NULLIF(SUM(l.status IN ('venda_realizada', 'venda_nao_realizada')), 0), 2
        ) AS taxa_conversao
      FROM {$table_leads} l
      INNER JOIN {$table_posts} p
        ON p.ID = l.loja_id AND p.post_type = 'lojas'
      {$where}
      GROUP BY l.loja_id, p.post_title
      ORDER BY taxa_conversao DESC
    ";

    $results = $wpdb->get_results($sql, ARRAY_A);
    foreach ($results as &$row) {
      $row['loja_id']             = (int)   $row['loja_id'];
      $row['total_leads']         = (int)   $row['total_leads'];
      $row['vendas_realizadas']   = (int)   $row['vendas_realizadas'];
      $row['vendas_nao_realizadas'] = (int) $row['vendas_nao_realizadas'];
      $row['em_negociacao']       = (int)   $row['em_negociacao'];
      $row['nao_atendido']        = (int)   $row['nao_atendido'];
      $row['taxa_conversao']      = (float) $row['taxa_conversao'];
    }
    return $results;
  }

  /**
   * Funil por atendente
   */
  public static function funil_por_atendente(array $loja_ids = []): array
  {
    global $wpdb;
    $table_leads = $wpdb->prefix . 'leads';
    $table_users = $wpdb->users;

    $where = 'WHERE l.responsavel_id IS NOT NULL';
    if (!empty($loja_ids)) {
      $loja_ids = array_values(array_map('intval', $loja_ids));
      $placeholders = implode(',', array_fill(0, count($loja_ids), '%d'));
      $where .= $wpdb->prepare(" AND l.loja_id IN ($placeholders)", ...$loja_ids);
    }

    $sql = "
      SELECT
        l.responsavel_id,
        u.display_name AS atendente_nome,
        COUNT(*) AS total_leads,
        SUM(l.status = 'venda_realizada') AS vendas_realizadas,
        SUM(l.status = 'venda_nao_realizada') AS vendas_nao_realizadas,
        SUM(l.status = 'em_negociacao') AS em_negociacao,
        SUM(l.status = 'nao_atendido') AS nao_atendido,
        ROUND(
          SUM(l.status = 'venda_realizada') * 100.0 /
          NULLIF(SUM(l.status IN ('venda_realizada', 'venda_nao_realizada')), 0), 2
        ) AS taxa_conversao,
        ROUND(
          AVG(
            CASE WHEN l.status IN ('venda_realizada', 'venda_nao_realizada')
              THEN TIMESTAMPDIFF(HOUR, l.data_criacao, l.data_atualizacao)
            END
          ), 2
        ) AS ciclo_medio_horas
      FROM {$table_leads} l
      INNER JOIN {$table_users} u ON u.ID = l.responsavel_id
      {$where}
      GROUP BY l.responsavel_id, u.display_name
      ORDER BY vendas_realizadas DESC
    ";

    $results = $wpdb->get_results($sql, ARRAY_A);
    foreach ($results as &$row) {
      $row['responsavel_id']        = (int)   $row['responsavel_id'];
      $row['total_leads']           = (int)   $row['total_leads'];
      $row['vendas_realizadas']     = (int)   $row['vendas_realizadas'];
      $row['vendas_nao_realizadas'] = (int)   $row['vendas_nao_realizadas'];
      $row['em_negociacao']         = (int)   $row['em_negociacao'];
      $row['nao_atendido']          = (int)   $row['nao_atendido'];
      $row['taxa_conversao']        = (float) $row['taxa_conversao'];
      $row['ciclo_medio_horas']     = $row['ciclo_medio_horas'] !== null ? (float) $row['ciclo_medio_horas'] : null;
    }
    return $results;
  }

  /**
   * Tempo médio por etapa (usa data_atualizacao como proxy de quando o status foi alterado)
   */
  public static function tempo_por_etapa(array $loja_ids = []): array
  {
    global $wpdb;
    $table_leads = $wpdb->prefix . 'leads';

    $loja_filter = '';
    if (!empty($loja_ids)) {
      $loja_ids = array_values(array_map('intval', $loja_ids));
      $placeholders = implode(',', array_fill(0, count($loja_ids), '%d'));
      $loja_filter = $wpdb->prepare("AND loja_id IN ($placeholders)", ...$loja_ids);
    }

    // Leads ativos: tempo desde a última atualização de status (tempo na etapa atual)
    $sql_ativos = "
      SELECT
        status,
        COUNT(*) AS total,
        ROUND(AVG(TIMESTAMPDIFF(HOUR, data_atualizacao, NOW())), 2) AS tempo_medio_horas
      FROM {$table_leads}
      WHERE status NOT IN ('venda_realizada', 'venda_nao_realizada')
      {$loja_filter}
      GROUP BY status
    ";

    // Leads fechados: ciclo completo desde criação até fechamento
    $sql_fechados = "
      SELECT
        status,
        COUNT(*) AS total,
        ROUND(AVG(TIMESTAMPDIFF(HOUR, data_criacao, data_atualizacao)), 2) AS tempo_medio_horas
      FROM {$table_leads}
      WHERE status IN ('venda_realizada', 'venda_nao_realizada')
      {$loja_filter}
      GROUP BY status
    ";

    // Busca labels e ordem das colunas na tabela wp_kanban_columns
    $col_table = $wpdb->prefix . 'kanban_columns';
    $label_map = [
      'nao_atendido'        => 'Não Atendido',
      'em_negociacao'       => 'Em Negociação',
      'venda_realizada'     => 'Venda Realizada',
      'venda_nao_realizada' => 'Venda Não Realizada',
    ];
    $order_map = [
      'nao_atendido' => 0, 'em_negociacao' => 1,
      'venda_realizada' => 2, 'venda_nao_realizada' => 3,
    ];

    if (!empty($loja_ids)) {
      $placeholders = implode(',', array_fill(0, count($loja_ids), '%d'));
      $col_rows = $wpdb->get_results(
        $wpdb->prepare("SELECT slug, label, ordem FROM {$col_table} WHERE loja_id IN ($placeholders)", ...$loja_ids),
        ARRAY_A
      );
    } else {
      $col_rows = $wpdb->get_results("SELECT slug, label, ordem FROM {$col_table}", ARRAY_A);
    }

    foreach ($col_rows as $col) {
      $label_map[$col['slug']] = $col['label'];
      if (!isset($order_map[$col['slug']])) {
        $order_map[$col['slug']] = (int) $col['ordem'] + 4;
      }
    }

    $results = [];
    foreach ($wpdb->get_results($sql_ativos, ARRAY_A) as $row) {
      $results[] = [
        'status'            => $row['status'],
        'label'             => $label_map[$row['status']] ?? $row['status'],
        'total'             => (int)   $row['total'],
        'tempo_medio_horas' => (float) $row['tempo_medio_horas'],
        'tipo'              => 'ativo',
      ];
    }
    foreach ($wpdb->get_results($sql_fechados, ARRAY_A) as $row) {
      $results[] = [
        'status'            => $row['status'],
        'label'             => $label_map[$row['status']] ?? $row['status'],
        'total'             => (int)   $row['total'],
        'tempo_medio_horas' => (float) $row['tempo_medio_horas'],
        'tipo'              => 'fechado',
      ];
    }

    usort($results, fn($a, $b) => ($order_map[$a['status']] ?? 99) <=> ($order_map[$b['status']] ?? 99));
    return $results;
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