<?php
/**
 * Endpoint REST para Assistente de IA
 *
 * Fornece contexto pré-agregado diretamente do MySQL,
 * evitando a paginação de centenas de leads no Node.js.
 *
 * GET /api/v1/ai/contexto
 *   Admins  → dados de todas as lojas (ou filtrado por ?loja_ids=1,2,3)
 *   Gerentes → apenas as lojas vinculadas ao usuário (via ACF loja_ids)
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

add_action('rest_api_init', function () {
  register_rest_route('api/v1', '/ai/contexto', [
    'methods'             => 'GET',
    'callback'            => 'mytheme_ai_get_contexto',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ]);
});

function mytheme_ai_get_contexto(WP_REST_Request $request): WP_REST_Response
{
  global $wpdb;

  $user     = wp_get_current_user();
  $is_admin = in_array('administrator', (array) $user->roles, true);

  // ── Escopo de lojas ────────────────────────────────────────────────────────
  if ($is_admin) {
    $param = $request->get_param('loja_ids');
    if ($param) {
      $loja_ids = array_values(array_filter(array_map('intval', explode(',', $param))));
    } else {
      $loja_ids = []; // todas
    }
  } else {
    // Não-admin: loja_ids vem do query param enviado pelo Next.js (extraído da sessão JWT).
    // Tentamos ACF como fonte primária; se falhar, usamos o param como fallback.
    $raw = get_field('loja_id', 'user_' . $user->ID);
    if ($raw) {
      $loja_ids = is_array($raw)
        ? array_values(array_filter(array_map('intval', $raw)))
        : [intval($raw)];
    } else {
      $param    = $request->get_param('loja_ids');
      $loja_ids = $param
        ? array_values(array_filter(array_map('intval', explode(',', $param))))
        : [];
    }

    if (empty($loja_ids)) {
      return new WP_REST_Response(['success' => false, 'message' => 'Nenhuma loja associada ao usuário.'], 403);
    }
  }

  $t_leads    = $wpdb->prefix . 'leads';
  $t_msgs = $wpdb->prefix . 'mensagens';
  $t_vnr  = $wpdb->prefix . 'lead_venda_nao_realizada';
  $t_users    = $wpdb->users;
  $t_posts    = $wpdb->posts;

  // WHERE seguro: loja_ids são todos intval()
  $loja_where = '';
  if (!empty($loja_ids)) {
    $loja_where = 'AND ' . $t_leads . '.loja_id IN (' . implode(',', $loja_ids) . ')';
  }

  $now            = current_time('mysql');
  $today          = current_time('Y-m-d');
  $week_ago       = date('Y-m-d', strtotime('-7 days',   current_time('timestamp')));
  $month_start    = date('Y-m-01', current_time('timestamp'));
  $lm_start       = date('Y-m-01', strtotime('-1 month', current_time('timestamp')));
  $lm_end         = date('Y-m-t',  strtotime('-1 month', current_time('timestamp')));

  // ── 1. VOLUME ──────────────────────────────────────────────────────────────
  $vol = $wpdb->get_row("
    SELECT
      COUNT(*)                                                                   AS total,
      SUM(DATE(data_criacao) = '$today')                                         AS hoje,
      SUM(DATE(data_criacao) >= '$week_ago')                                     AS ultimos_7_dias,
      SUM(DATE(data_criacao) >= '$month_start')                                  AS este_mes,
      SUM(DATE(data_criacao) BETWEEN '$lm_start' AND '$lm_end')                  AS mes_passado
    FROM $t_leads
    WHERE 1=1 $loja_where
  ", ARRAY_A);

  $este_mes_n   = (int) ($vol['este_mes']    ?? 0);
  $mes_pass_n   = (int) ($vol['mes_passado'] ?? 0);
  $crescimento  = $mes_pass_n > 0
    ? round((($este_mes_n - $mes_pass_n) / $mes_pass_n) * 100, 1)
    : null;

  // ── 2. POR STATUS ─────────────────────────────────────────────────────────
  $status_map = [
    'nao_atendido'        => 'Não atendido',
    'em_negociacao'       => 'Em negociação',
    'venda_realizada'     => 'Venda realizada',
    'venda_nao_realizada' => 'Venda não realizada',
  ];
  $rows = $wpdb->get_results("
    SELECT status, COUNT(*) AS total
    FROM $t_leads
    WHERE 1=1 $loja_where
    GROUP BY status
  ", ARRAY_A);
  $por_status = [];
  foreach ($rows as $r) {
    $por_status[$status_map[$r['status']] ?? $r['status']] = (int) $r['total'];
  }

  // ── 3. POR TEMPERATURA ────────────────────────────────────────────────────
  $rows = $wpdb->get_results("
    SELECT COALESCE(classificacao, 'sem_classificacao') AS temp, COUNT(*) AS total
    FROM $t_leads
    WHERE 1=1 $loja_where
    GROUP BY classificacao
  ", ARRAY_A);
  $por_temp = [];
  foreach ($rows as $r) {
    $por_temp[$r['temp']] = (int) $r['total'];
  }

  // ── 4. POR INVESTIMENTO ───────────────────────────────────────────────────
  $inv_map = [
    '35-50k'     => 'R$35k–50k',
    '50-100k'    => 'R$50k–100k',
    '100-150k'   => 'R$100k–150k',
    '150-200k'   => 'R$150k–200k',
    'acima-250k' => 'Acima de R$250k',
  ];
  $rows = $wpdb->get_results("
    SELECT expectativa_investimento AS faixa, COUNT(*) AS total
    FROM $t_leads
    WHERE 1=1 $loja_where
    GROUP BY expectativa_investimento
    ORDER BY total DESC
  ", ARRAY_A);
  $por_investimento = [];
  foreach ($rows as $r) {
    $label = $inv_map[$r['faixa']] ?? ($r['faixa'] ?: 'Não informado');
    $por_investimento[$label] = (int) $r['total'];
  }

  // ── 5. POR INTERESSE (campo comma-separated via FIND_IN_SET) ──────────────
  $int_map = [
    'cozinha'    => 'Cozinha',
    'dormitorio' => 'Dormitório',
    'lavanderia' => 'Lavanderia',
    'closet'     => 'Closet',
    'completo'   => 'Ambiente completo',
    'banheiro'   => 'Banheiro',
    'escritorio' => 'Escritório',
  ];
  $selects = array_map(
    fn($k) => "SUM(FIND_IN_SET('$k', interesse) > 0) AS `$k`",
    array_keys($int_map)
  );
  $int_row = $wpdb->get_row("
    SELECT " . implode(', ', $selects) . "
    FROM $t_leads
    WHERE 1=1 $loja_where
  ", ARRAY_A);
  $por_interesse = [];
  foreach ($int_map as $key => $label) {
    $v = (int) ($int_row[$key] ?? 0);
    if ($v > 0) $por_interesse[$label] = $v;
  }
  arsort($por_interesse);

  // ── 6. POR CIDADE (top 20) ────────────────────────────────────────────────
  $rows = $wpdb->get_results("
    SELECT
      CONCAT(l.cidade, ' (', l.estado, ')')  AS cidade_estado,
      p.post_title                            AS loja_nome,
      COUNT(*)                                AS total
    FROM $t_leads l
    LEFT JOIN $t_posts p ON p.ID = l.loja_id AND p.post_type = 'lojas'
    WHERE 1=1 $loja_where
    GROUP BY l.cidade, l.estado, l.loja_id
    ORDER BY total DESC
    LIMIT 40
  ", ARRAY_A);

  $cidades_tmp = [];
  foreach ($rows as $r) {
    $k = $r['cidade_estado'];
    if (!isset($cidades_tmp[$k])) {
      $cidades_tmp[$k] = ['total' => 0, 'lojas' => []];
    }
    $cidades_tmp[$k]['total'] += (int) $r['total'];
    if ($r['loja_nome']) {
      $cidades_tmp[$k]['lojas'][] = ['loja' => $r['loja_nome'], 'total' => (int) $r['total']];
    }
  }
  uasort($cidades_tmp, fn($a, $b) => $b['total'] - $a['total']);
  $por_cidade = array_slice($cidades_tmp, 0, 20, true);

  // ── 7. POR ATENDENTE ──────────────────────────────────────────────────────
  $rows = $wpdb->get_results("
    SELECT
      COALESCE(u.display_name, 'Sem atendente') AS atendente,
      COUNT(*)                                   AS total,
      SUM(l.status = 'nao_atendido')             AS nao_atendidos,
      SUM(l.status = 'em_negociacao')            AS em_negociacao,
      SUM(l.status = 'venda_realizada')          AS vendas,
      SUM(l.status = 'venda_nao_realizada')      AS perdidos
    FROM $t_leads l
    LEFT JOIN $t_users u ON u.ID = l.responsavel_id
    WHERE 1=1 $loja_where
    GROUP BY l.responsavel_id
    ORDER BY total DESC
  ", ARRAY_A);
  $por_atendente = [];
  foreach ($rows as $r) {
    $total = (int) $r['total'];
    $por_atendente[] = [
      'atendente'     => $r['atendente'],
      'total'         => $total,
      'nao_atendidos' => (int) $r['nao_atendidos'],
      'em_negociacao' => (int) $r['em_negociacao'],
      'vendas'        => (int) $r['vendas'],
      'perdidos'      => (int) $r['perdidos'],
      'conv_pct'      => $total > 0 ? round(((int) $r['vendas'] / $total) * 100, 1) : 0,
    ];
  }

  // ── 8. ALERTAS OPERACIONAIS ───────────────────────────────────────────────
  $alertas_row = $wpdb->get_row("
    SELECT
      SUM(status = 'em_negociacao' AND proximo_followup_em IS NULL)                           AS sem_followup_agendado,
      SUM(proximo_followup_em IS NOT NULL
          AND proximo_followup_em < '$now'
          AND status NOT IN ('venda_realizada','venda_nao_realizada'))                         AS followup_vencido,
      SUM(status = 'nao_atendido')                                                            AS nao_atendidos,
      SUM(status = 'nao_atendido' AND DATE(data_criacao) = '$today')                          AS novos_hoje_sem_atendimento,
      ROUND(AVG(
        CASE WHEN status != 'nao_atendido'
        THEN TIMESTAMPDIFF(HOUR, data_criacao, data_atualizacao) END
      ), 1)                                                                                    AS tempo_medio_1o_atend_horas
    FROM $t_leads
    WHERE 1=1 $loja_where
  ", ARRAY_A);

  // Mensagens não lidas
  if (!empty($loja_ids)) {
    $msgs_where = 'AND loja_id IN (' . implode(',', $loja_ids) . ')';
  } else {
    $msgs_where = '';
  }
  $unread = (int) $wpdb->get_var("
    SELECT COUNT(*)
    FROM $t_msgs
    WHERE direcao = 'recebida' AND status != 'vista' $msgs_where
  ");

  // ── 9. TENDÊNCIA — últimas 8 semanas ──────────────────────────────────────
  $tendencia = $wpdb->get_results("
    SELECT
      YEARWEEK(data_criacao, 3)  AS semana,
      MIN(DATE(data_criacao))    AS inicio_semana,
      COUNT(*)                   AS total
    FROM $t_leads
    WHERE data_criacao >= DATE_SUB('$now', INTERVAL 8 WEEK) $loja_where
    GROUP BY YEARWEEK(data_criacao, 3)
    ORDER BY semana ASC
  ", ARRAY_A);
  foreach ($tendencia as &$tw) {
    $tw['total'] = (int) $tw['total'];
    $tw['inicio_semana'] = date('d/m', strtotime($tw['inicio_semana']));
  }
  unset($tw);

  // ── 10. MOTIVOS DE VENDA NÃO REALIZADA ───────────────────────────────────
  if (!empty($loja_ids)) {
    $ids_str   = implode(',', $loja_ids);
    $vnr_query = "
      SELECT vnr.*
      FROM $t_vnr vnr
      JOIN $t_leads l ON l.id = vnr.lead_id AND l.loja_id IN ($ids_str)
    ";
  } else {
    $vnr_query = "SELECT * FROM $t_vnr vnr";
  }

  $vnr_raw = $wpdb->get_row("
    SELECT
      SUM(v.motivo_preco)              AS preco,
      SUM(v.motivo_concorrencia)       AS concorrencia,
      SUM(v.motivo_prazo_entrega)      AS prazo_entrega,
      SUM(v.motivo_pagamento)          AS pagamento,
      SUM(v.motivo_financiamento)      AS financiamento,
      SUM(v.motivo_obra_pendente)      AS obra_pendente,
      SUM(v.motivo_indecisao)          AS indecisao,
      SUM(v.motivo_produto_inadequado) AS produto_inadequado,
      SUM(v.motivo_contato_perdido)    AS contato_perdido,
      SUM(v.motivo_atendimento)        AS atendimento,
      SUM(v.motivo_desqualificado)     AS desqualificado,
      SUM(v.motivo_outro)              AS outro,
      COUNT(*)                         AS total
    FROM ($vnr_query) AS v
  ", ARRAY_A);

  $vnr_labels = [
    'preco'              => 'Preço acima do orçamento',
    'concorrencia'       => 'Perdeu para concorrência',
    'prazo_entrega'      => 'Prazo de entrega longo',
    'pagamento'          => 'Condições de pagamento',
    'financiamento'      => 'Financiamento negado',
    'obra_pendente'      => 'Obra/imóvel pendente',
    'indecisao'          => 'Cliente indeciso',
    'produto_inadequado' => 'Produto inadequado',
    'contato_perdido'    => 'Contato perdido',
    'atendimento'        => 'Problema no atendimento',
    'desqualificado'     => 'Lead Desqualificado ou Sem Fundamento',
    'outro'              => 'Outro motivo',
  ];
  $motivos_vnr = [];
  if ($vnr_raw && (int) ($vnr_raw['total'] ?? 0) > 0) {
    foreach ($vnr_labels as $k => $label) {
      $v = (int) ($vnr_raw[$k] ?? 0);
      if ($v > 0) $motivos_vnr[$label] = $v;
    }
    arsort($motivos_vnr);
  }

  // ── 11. SCORE MÉDIO ───────────────────────────────────────────────────────
  $score_row = $wpdb->get_row("
    SELECT
      ROUND(AVG(score), 1)                                              AS medio,
      ROUND(AVG(CASE WHEN classificacao = 'quente' THEN score END), 1) AS quente,
      ROUND(AVG(CASE WHEN classificacao = 'morno'  THEN score END), 1) AS morno,
      ROUND(AVG(CASE WHEN classificacao = 'frio'   THEN score END), 1) AS frio
    FROM $t_leads
    WHERE score IS NOT NULL $loja_where
  ", ARRAY_A);

  // ── 12. NOMES DAS LOJAS ───────────────────────────────────────────────────
  if (!empty($loja_ids)) {
    $ids_str  = implode(',', $loja_ids);
    $loja_rows = $wpdb->get_results(
      "SELECT ID, post_title FROM $t_posts WHERE ID IN ($ids_str) AND post_type = 'lojas'",
      ARRAY_A
    );
  } else {
    $loja_rows = $wpdb->get_results(
      "SELECT ID, post_title FROM $t_posts WHERE post_type = 'lojas' AND post_status = 'publish' ORDER BY post_title",
      ARRAY_A
    );
  }
  $lojas = array_map(fn($r) => ['id' => (int) $r['ID'], 'nome' => $r['post_title']], $loja_rows);

  // ── Resposta ───────────────────────────────────────────────────────────────
  return new WP_REST_Response([
    'success' => true,
    'gerado_em' => $now,
    'lojas' => $lojas,
    'volume' => [
      'total'               => (int) ($vol['total']           ?? 0),
      'hoje'                => (int) ($vol['hoje']            ?? 0),
      'ultimos_7_dias'      => (int) ($vol['ultimos_7_dias']  ?? 0),
      'este_mes'            => $este_mes_n,
      'mes_passado'         => $mes_pass_n,
      'crescimento_pct'     => $crescimento,
    ],
    'por_status'       => $por_status,
    'por_temperatura'  => $por_temp,
    'por_investimento' => $por_investimento,
    'por_interesse'    => $por_interesse,
    'por_cidade'       => $por_cidade,
    'por_atendente'    => $por_atendente,
    'alertas' => [
      'sem_followup_agendado'      => (int) ($alertas_row['sem_followup_agendado']      ?? 0),
      'followup_vencido'           => (int) ($alertas_row['followup_vencido']           ?? 0),
      'nao_atendidos'              => (int) ($alertas_row['nao_atendidos']              ?? 0),
      'novos_hoje_sem_atendimento' => (int) ($alertas_row['novos_hoje_sem_atendimento'] ?? 0),
      'tempo_medio_1o_atend_horas' => (float) ($alertas_row['tempo_medio_1o_atend_horas'] ?? 0),
      'mensagens_nao_lidas'        => $unread,
    ],
    'tendencia_semanal' => $tendencia,
    'motivos_nao_venda' => $motivos_vnr,
    'score' => [
      'medio'  => (float) ($score_row['medio']  ?? 0),
      'quente' => (float) ($score_row['quente'] ?? 0),
      'morno'  => (float) ($score_row['morno']  ?? 0),
      'frio'   => (float) ($score_row['frio']   ?? 0),
    ],
  ], 200);
}
