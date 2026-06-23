<?php
/**
 * Handler de Comissões
 *
 * Tabela: wp_comissao_fechamentos
 *   id                     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
 *   loja_id                BIGINT UNSIGNED NOT NULL
 *   usuario_id             BIGINT UNSIGNED NOT NULL
 *   usuario_nome           VARCHAR(255)    NOT NULL
 *   periodo_inicio         DATE            NOT NULL
 *   periodo_fim            DATE            NOT NULL
 *   metodo                 VARCHAR(20)     NOT NULL  (markup|pontuacao)
 *   valor_vendas           DECIMAL(15,2)   NOT NULL DEFAULT 0
 *   valor_custo            DECIMAL(15,2)   NOT NULL DEFAULT 0
 *   markup_gerado          DECIMAL(15,2)   NOT NULL DEFAULT 0
 *   pontos_acumulados      DECIMAL(10,2)   NOT NULL DEFAULT 0
 *   percentual_atingimento DECIMAL(5,1)    NOT NULL DEFAULT 0
 *   percentual_comissao    DECIMAL(5,2)    NOT NULL DEFAULT 0
 *   valor_comissao         DECIMAL(15,2)   NOT NULL DEFAULT 0
 *   observacoes            TEXT            NULL
 *   status                 VARCHAR(20)     NOT NULL DEFAULT 'rascunho'
 *   fechado_por            BIGINT UNSIGNED NULL
 *   fechado_em             DATETIME        NULL
 *   aprovado_por           BIGINT UNSIGNED NULL
 *   aprovado_em            DATETIME        NULL
 *   pago_em                DATETIME        NULL
 *   created_at             DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
 *   updated_at             DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
 *
 * Config de comissão salva em post_meta da loja: _comissao_config (JSON)
 * {
 *   "ativo": true,
 *   "metodo": "markup" | "pontuacao",
 *   "faixas_meta": [{"de":0,"ate":79,"percentual":2}, ...],
 *   "divisor_pontos": 1000,
 *   "faixas_pontos": [{"de":0,"ate":100,"valor_ponto":5}, ...]
 * }
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

class Comissao_Handler
{
  private const META_KEY = '_comissao_config';

  private static function table(): string
  {
    global $wpdb;
    return $wpdb->prefix . 'comissao_fechamentos';
  }

  public static function maybe_create_table(): void
  {
    global $wpdb;
    $table   = self::table();
    $charset = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS {$table} (
      id                     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      loja_id                BIGINT UNSIGNED NOT NULL,
      usuario_id             BIGINT UNSIGNED NOT NULL,
      usuario_nome           VARCHAR(255)    NOT NULL DEFAULT '',
      periodo_inicio         DATE            NOT NULL,
      periodo_fim            DATE            NOT NULL,
      metodo                 VARCHAR(20)     NOT NULL DEFAULT 'markup',
      valor_vendas           DECIMAL(15,2)   NOT NULL DEFAULT 0,
      valor_custo            DECIMAL(15,2)   NOT NULL DEFAULT 0,
      markup_gerado          DECIMAL(15,2)   NOT NULL DEFAULT 0,
      pontos_acumulados      DECIMAL(10,2)   NOT NULL DEFAULT 0,
      percentual_atingimento DECIMAL(5,1)    NOT NULL DEFAULT 0,
      percentual_comissao    DECIMAL(5,2)    NOT NULL DEFAULT 0,
      valor_comissao         DECIMAL(15,2)   NOT NULL DEFAULT 0,
      observacoes            TEXT            NULL,
      status                 VARCHAR(20)     NOT NULL DEFAULT 'rascunho',
      fechado_por            BIGINT UNSIGNED NULL,
      fechado_em             DATETIME        NULL,
      aprovado_por           BIGINT UNSIGNED NULL,
      aprovado_em            DATETIME        NULL,
      pago_em                DATETIME        NULL,
      created_at             DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at             DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY periodo_vendedor (loja_id, usuario_id, periodo_inicio, periodo_fim),
      KEY loja_id (loja_id),
      KEY usuario_id (usuario_id),
      KEY status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 {$charset};";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql);
  }

  // ─── Config ──────────────────────────────────────────────────────────────

  public static function get_config(int $loja_id): array
  {
    $raw = get_post_meta($loja_id, self::META_KEY, true);
    if ($raw) {
      $decoded = json_decode($raw, true);
      if (is_array($decoded)) return $decoded;
    }
    return self::config_padrao();
  }

  public static function save_config(int $loja_id, array $config): void
  {
    update_post_meta($loja_id, self::META_KEY, wp_json_encode(self::sanitize_config($config)));
  }

  private static function config_padrao(): array
  {
    return [
      'ativo'          => false,
      'metodo'         => 'markup',
      'faixas_meta'    => [
        ['de' => 0,   'ate' => 79,   'percentual' => 2.0],
        ['de' => 80,  'ate' => 99,   'percentual' => 3.0],
        ['de' => 100, 'ate' => null, 'percentual' => 4.0],
      ],
      'divisor_pontos' => 1000,
      'faixas_pontos'  => [
        ['de' => 0,   'ate' => 100,  'valor_ponto' => 5.0],
        ['de' => 101, 'ate' => 300,  'valor_ponto' => 7.0],
        ['de' => 300, 'ate' => null, 'valor_ponto' => 10.0],
      ],
    ];
  }

  private static function sanitize_config(array $c): array
  {
    $faixas_meta = [];
    foreach ((array) ($c['faixas_meta'] ?? []) as $f) {
      $ate = (isset($f['ate']) && $f['ate'] !== null && $f['ate'] !== '') ? (float) $f['ate'] : null;
      $faixas_meta[] = [
        'de'         => (float) ($f['de'] ?? 0),
        'ate'        => $ate,
        'percentual' => (float) ($f['percentual'] ?? 0),
      ];
    }

    $faixas_pontos = [];
    foreach ((array) ($c['faixas_pontos'] ?? []) as $f) {
      $ate = (isset($f['ate']) && $f['ate'] !== null && $f['ate'] !== '') ? (float) $f['ate'] : null;
      $faixas_pontos[] = [
        'de'          => (float) ($f['de'] ?? 0),
        'ate'         => $ate,
        'valor_ponto' => (float) ($f['valor_ponto'] ?? 0),
      ];
    }

    return [
      'ativo'          => !empty($c['ativo']),
      'metodo'         => in_array($c['metodo'] ?? '', ['markup', 'pontuacao'], true) ? $c['metodo'] : 'markup',
      'faixas_meta'    => $faixas_meta,
      'divisor_pontos' => max(1, intval($c['divisor_pontos'] ?? 1000)),
      'faixas_pontos'  => $faixas_pontos,
    ];
  }

  // ─── Preview ─────────────────────────────────────────────────────────────

  /**
   * Calcula preview de comissões por vendedor para o período.
   *
   * @param int    $loja_id
   * @param string $periodo_inicio  Y-m-d
   * @param string $periodo_fim     Y-m-d
   * @param array  $custos          [usuario_id => valor_custo] — apenas para método markup
   * @param array  $config          Config já carregada (passa para evitar re-query no fechar)
   */
  public static function calcular_preview(
    int $loja_id,
    string $periodo_inicio,
    string $periodo_fim,
    array $custos = [],
    array $config = []
  ): array {
    global $wpdb;

    if (empty($config)) {
      $config = self::get_config($loja_id);
    }

    $metodo      = $config['metodo'] ?? 'markup';
    $faixas_meta = $config['faixas_meta'] ?? [];

    $leads_table = $wpdb->prefix . 'leads';
    $vr_table    = $wpdb->prefix . 'lead_venda_realizada';

    // Vendedores com vendas no período
    $vendedores = $wpdb->get_results($wpdb->prepare(
      "SELECT l.responsavel_id AS usuario_id,
              MAX(u.display_name) AS usuario_nome,
              COALESCE(SUM(vr.valor), 0) AS valor_vendas,
              COUNT(*) AS qtd_vendas
       FROM {$vr_table} vr
       JOIN {$leads_table} l ON l.id = vr.lead_id
       LEFT JOIN {$wpdb->users} u ON u.ID = l.responsavel_id
       WHERE l.loja_id = %d
         AND l.responsavel_id IS NOT NULL
         AND (
           (vr.data_venda IS NOT NULL AND vr.data_venda BETWEEN %s AND %s)
           OR (vr.data_venda IS NULL AND DATE(vr.created_at) BETWEEN %s AND %s)
         )
       GROUP BY l.responsavel_id
       ORDER BY valor_vendas DESC",
      $loja_id,
      $periodo_inicio, $periodo_fim,
      $periodo_inicio, $periodo_fim
    ), ARRAY_A);

    // Metas de faturamento no período (por vendedor)
    $metas_table = $wpdb->prefix . 'metas_comerciais';
    $metas_rows  = $wpdb->get_results($wpdb->prepare(
      "SELECT usuario_id, SUM(valor_meta) AS total_meta
       FROM {$metas_table}
       WHERE loja_id = %d
         AND tipo = 'faturamento'
         AND status = 'ativa'
         AND data_inicio <= %s
         AND data_fim >= %s
       GROUP BY usuario_id",
      $loja_id, $periodo_fim, $periodo_inicio
    ), ARRAY_A);

    $meta_por_usuario = [];
    foreach ($metas_rows as $m) {
      $meta_por_usuario[(int) $m['usuario_id']] = (float) $m['total_meta'];
    }

    $items = [];
    foreach ($vendedores as $v) {
      $uid          = (int) $v['usuario_id'];
      $valor_vendas = (float) $v['valor_vendas'];
      $valor_meta   = $meta_por_usuario[$uid] ?? 0;
      $pct_ating    = $valor_meta > 0 ? round(($valor_vendas / $valor_meta) * 100, 1) : 0;

      $item = [
        'usuario_id'             => $uid,
        'usuario_nome'           => $v['usuario_nome'] ?? ('Usuário #' . $uid),
        'qtd_vendas'             => (int) $v['qtd_vendas'],
        'valor_vendas'           => $valor_vendas,
        'valor_meta'             => $valor_meta,
        'percentual_atingimento' => $pct_ating,
      ];

      if ($metodo === 'markup') {
        $valor_custo    = isset($custos[$uid]) ? (float) $custos[$uid] : 0;
        $markup_gerado  = max(0.0, $valor_vendas - $valor_custo);
        $pct_comissao   = self::faixa_meta_percentual($pct_ating, $faixas_meta);
        $valor_comissao = round($markup_gerado * $pct_comissao / 100, 2);

        $item['valor_custo']        = $valor_custo;
        $item['markup_gerado']      = $markup_gerado;
        $item['pontos_acumulados']  = 0.0;
        $item['valor_ponto']        = null;
        $item['percentual_comissao'] = $pct_comissao;
        $item['valor_comissao']     = $valor_comissao;
      } else {
        $divisor        = max(1.0, (float) ($config['divisor_pontos'] ?? 1000));
        $pontos         = round($valor_vendas / $divisor, 2);
        $faixas_pontos  = $config['faixas_pontos'] ?? [];
        $valor_ponto    = self::faixa_pontos_valor($pontos, $faixas_pontos);
        $valor_comissao = round($pontos * $valor_ponto, 2);

        $item['valor_custo']        = 0.0;
        $item['markup_gerado']      = 0.0;
        $item['pontos_acumulados']  = $pontos;
        $item['valor_ponto']        = $valor_ponto;
        $item['percentual_comissao'] = 0.0;
        $item['valor_comissao']     = $valor_comissao;
      }

      $items[] = $item;
    }

    return $items;
  }

  // ─── Fechamento ──────────────────────────────────────────────────────────

  /**
   * Fecha o período: cria ou atualiza um registro por vendedor.
   *
   * @param int    $loja_id
   * @param string $periodo_inicio
   * @param string $periodo_fim
   * @param array  $itens_custos   [['usuario_id'=>id, 'valor_custo'=>val, 'observacoes'=>''], ...]
   * @param int    $fechado_por    ID do gerente que fechou
   * @return int[] IDs dos fechamentos
   */
  public static function fechar_periodo(
    int $loja_id,
    string $periodo_inicio,
    string $periodo_fim,
    array $itens_custos,
    int $fechado_por
  ): array {
    $config = self::get_config($loja_id);
    $metodo = $config['metodo'] ?? 'markup';

    $custos_map = [];
    $obs_map    = [];
    foreach ($itens_custos as $item) {
      $uid               = (int) ($item['usuario_id'] ?? 0);
      $custos_map[$uid]  = (float) ($item['valor_custo'] ?? 0);
      $obs_map[$uid]     = sanitize_textarea_field($item['observacoes'] ?? '');
    }

    $preview = self::calcular_preview($loja_id, $periodo_inicio, $periodo_fim, $custos_map, $config);

    $ids = [];
    foreach ($preview as $p) {
      $uid = $p['usuario_id'];
      $row = [
        'loja_id'               => $loja_id,
        'usuario_id'            => $uid,
        'usuario_nome'          => $p['usuario_nome'],
        'periodo_inicio'        => $periodo_inicio,
        'periodo_fim'           => $periodo_fim,
        'metodo'                => $metodo,
        'valor_vendas'          => $p['valor_vendas'],
        'valor_custo'           => $p['valor_custo'],
        'markup_gerado'         => $p['markup_gerado'],
        'pontos_acumulados'     => $p['pontos_acumulados'],
        'percentual_atingimento' => $p['percentual_atingimento'],
        'percentual_comissao'   => $p['percentual_comissao'],
        'valor_comissao'        => $p['valor_comissao'],
        'observacoes'           => $obs_map[$uid] ?? '',
        'status'                => 'rascunho',
        'fechado_por'           => $fechado_por,
        'fechado_em'            => current_time('mysql'),
        'aprovado_por'          => null,
        'aprovado_em'           => null,
        'pago_em'               => null,
      ];

      $ids[] = self::upsert_fechamento($row);
    }

    return $ids;
  }

  private static function upsert_fechamento(array $row): int
  {
    global $wpdb;
    $table = self::table();

    $existing_id = (int) $wpdb->get_var($wpdb->prepare(
      "SELECT id FROM {$table}
       WHERE loja_id = %d AND usuario_id = %d AND periodo_inicio = %s AND periodo_fim = %s",
      $row['loja_id'], $row['usuario_id'], $row['periodo_inicio'], $row['periodo_fim']
    ));

    if ($existing_id) {
      $wpdb->update($table, $row, ['id' => $existing_id]);
      return $existing_id;
    }

    $wpdb->insert($table, $row);
    return (int) $wpdb->insert_id;
  }

  public static function list_fechamentos(array $args = []): array
  {
    global $wpdb;
    $table = self::table();

    $where  = ['1=1'];
    $values = [];

    if (!empty($args['loja_id'])) {
      $where[]  = 'loja_id = %d';
      $values[] = intval($args['loja_id']);
    }
    if (!empty($args['usuario_id'])) {
      $where[]  = 'usuario_id = %d';
      $values[] = intval($args['usuario_id']);
    }
    if (!empty($args['status'])) {
      $where[]  = 'status = %s';
      $values[] = sanitize_text_field($args['status']);
    }

    $sql = "SELECT * FROM {$table} WHERE " . implode(' AND ', $where) . " ORDER BY periodo_inicio DESC, usuario_nome ASC";

    $rows = !empty($values)
      ? $wpdb->get_results($wpdb->prepare($sql, ...$values), ARRAY_A)
      : $wpdb->get_results($sql, ARRAY_A);

    return array_map([self::class, 'cast_row'], $rows ?: []);
  }

  public static function get_by_id(int $id): ?array
  {
    global $wpdb;
    $row = $wpdb->get_row(
      $wpdb->prepare("SELECT * FROM " . self::table() . " WHERE id = %d", $id),
      ARRAY_A
    );
    return $row ? self::cast_row($row) : null;
  }

  public static function update_status(int $id, string $status, int $user_id): bool
  {
    global $wpdb;
    $statuses_validos = ['rascunho', 'aprovado', 'pago'];
    if (!in_array($status, $statuses_validos, true)) return false;

    $update = ['status' => $status];
    if ($status === 'aprovado') {
      $update['aprovado_por'] = $user_id;
      $update['aprovado_em']  = current_time('mysql');
    } elseif ($status === 'pago') {
      $update['pago_em'] = current_time('mysql');
    }

    return $wpdb->update(self::table(), $update, ['id' => $id]) !== false;
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────

  private static function faixa_meta_percentual(float $pct, array $faixas): float
  {
    foreach ($faixas as $f) {
      $de  = (float) ($f['de'] ?? 0);
      $ate = (isset($f['ate']) && $f['ate'] !== null) ? (float) $f['ate'] : PHP_FLOAT_MAX;
      if ($pct >= $de && $pct <= $ate) {
        return (float) ($f['percentual'] ?? 0);
      }
    }
    return 0.0;
  }

  private static function faixa_pontos_valor(float $pontos, array $faixas): float
  {
    foreach ($faixas as $f) {
      $de  = (float) ($f['de'] ?? 0);
      $ate = (isset($f['ate']) && $f['ate'] !== null) ? (float) $f['ate'] : PHP_FLOAT_MAX;
      if ($pontos >= $de && $pontos <= $ate) {
        return (float) ($f['valor_ponto'] ?? 0);
      }
    }
    return 0.0;
  }

  private static function cast_row(array $row): array
  {
    $row['id']                     = (int) $row['id'];
    $row['loja_id']                = (int) $row['loja_id'];
    $row['usuario_id']             = (int) $row['usuario_id'];
    $row['valor_vendas']           = (float) $row['valor_vendas'];
    $row['valor_custo']            = (float) $row['valor_custo'];
    $row['markup_gerado']          = (float) $row['markup_gerado'];
    $row['pontos_acumulados']      = (float) $row['pontos_acumulados'];
    $row['percentual_atingimento'] = (float) $row['percentual_atingimento'];
    $row['percentual_comissao']    = (float) $row['percentual_comissao'];
    $row['valor_comissao']         = (float) $row['valor_comissao'];
    $row['fechado_por']            = $row['fechado_por'] !== null ? (int) $row['fechado_por'] : null;
    $row['aprovado_por']           = $row['aprovado_por'] !== null ? (int) $row['aprovado_por'] : null;
    return $row;
  }
}
