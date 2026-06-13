<?php
/**
 * Handler de Metas Comerciais
 *
 * Tabela: wp_metas_comerciais
 *   id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
 *   loja_id      BIGINT UNSIGNED NOT NULL
 *   usuario_id   BIGINT UNSIGNED NULL  (NULL = meta da equipe)
 *   nome         VARCHAR(255)    NOT NULL
 *   tipo         VARCHAR(50)     NOT NULL  (faturamento|quantidade_vendas|conversao|personalizada)
 *   periodo      VARCHAR(20)     NOT NULL  (mensal|trimestral|semestral|anual)
 *   valor_meta   DECIMAL(15,2)   NOT NULL
 *   data_inicio  DATE            NOT NULL
 *   data_fim     DATE            NOT NULL
 *   status       VARCHAR(20)     NOT NULL DEFAULT 'ativa'
 *   created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
 *   updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

class Meta_Comercial_Handler
{
  private static function table(): string
  {
    global $wpdb;
    return $wpdb->prefix . 'metas_comerciais';
  }

  public static function maybe_create_table(): void
  {
    global $wpdb;
    $table   = self::table();
    $charset = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS {$table} (
      id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      loja_id     BIGINT UNSIGNED NOT NULL,
      usuario_id  BIGINT UNSIGNED NULL,
      nome        VARCHAR(255)    NOT NULL,
      tipo        VARCHAR(50)     NOT NULL,
      periodo     VARCHAR(20)     NOT NULL DEFAULT 'mensal',
      valor_meta  DECIMAL(15,2)   NOT NULL DEFAULT 0,
      data_inicio DATE            NOT NULL,
      data_fim    DATE            NOT NULL,
      status      VARCHAR(20)     NOT NULL DEFAULT 'ativa',
      created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY loja_id (loja_id),
      KEY usuario_id (usuario_id),
      KEY status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 {$charset};";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql);
  }

  public static function create(array $data): int
  {
    global $wpdb;

    $row = self::sanitize($data);
    $wpdb->insert(self::table(), $row);
    return (int) $wpdb->insert_id;
  }

  public static function update(int $id, array $data): bool
  {
    global $wpdb;
    $row = self::sanitize($data);
    $result = $wpdb->update(self::table(), $row, ['id' => $id]);
    return $result !== false;
  }

  public static function delete(int $id): bool
  {
    global $wpdb;
    return $wpdb->delete(self::table(), ['id' => $id], ['%d']) !== false;
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

  /**
   * Lista metas com filtros opcionais.
   * @param array $args { loja_id, usuario_id, status, tipo, periodo }
   */
  public static function list(array $args = []): array
  {
    global $wpdb;
    $table = self::table();

    $where  = ['1=1'];
    $values = [];

    if (!empty($args['loja_id'])) {
      $where[]  = 'loja_id = %d';
      $values[] = intval($args['loja_id']);
    }
    if (array_key_exists('usuario_id', $args)) {
      if ($args['usuario_id'] === null) {
        $where[] = 'usuario_id IS NULL';
      } elseif ($args['usuario_id'] !== '') {
        if (!empty($args['include_equipe'])) {
          $where[] = '(usuario_id = %d OR usuario_id IS NULL)';
        } else {
          $where[] = 'usuario_id = %d';
        }
        $values[] = intval($args['usuario_id']);
      }
    }
    if (!empty($args['status'])) {
      $where[]  = 'status = %s';
      $values[] = sanitize_text_field($args['status']);
    }
    if (!empty($args['tipo'])) {
      $where[]  = 'tipo = %s';
      $values[] = sanitize_text_field($args['tipo']);
    }

    $sql = "SELECT * FROM {$table} WHERE " . implode(' AND ', $where) . " ORDER BY data_inicio DESC";

    if (!empty($values)) {
      $rows = $wpdb->get_results($wpdb->prepare($sql, ...$values), ARRAY_A);
    } else {
      $rows = $wpdb->get_results($sql, ARRAY_A);
    }

    return array_map([self::class, 'cast_row'], $rows ?: []);
  }

  /**
   * Retorna meta enriquecida com valor realizado e percentual.
   */
  public static function com_resultado(array $meta): array
  {
    $valor_realizado = self::calcular_valor_realizado(
      $meta['tipo'],
      $meta['usuario_id'],
      $meta['loja_id'],
      $meta['data_inicio'],
      $meta['data_fim']
    );

    $valor_meta        = (float) $meta['valor_meta'];
    $percentual        = $valor_meta > 0 ? round(($valor_realizado / $valor_meta) * 100, 1) : 0;
    $hoje              = new DateTime('today');
    $fim               = DateTime::createFromFormat('Y-m-d', $meta['data_fim']);
    $dias_restantes    = $fim && $fim >= $hoje ? (int) $hoje->diff($fim)->days : 0;

    return array_merge($meta, [
      'valor_realizado'   => $valor_realizado,
      'percentual_atingido' => $percentual,
      'dias_restantes'    => $dias_restantes,
    ]);
  }

  /**
   * Calcula o valor realizado para uma meta baseado no tipo.
   */
  private static function calcular_valor_realizado(
    string $tipo,
    ?int $usuario_id,
    int $loja_id,
    string $data_inicio,
    string $data_fim
  ): float {
    global $wpdb;

    $leads_table = $wpdb->prefix . 'leads';
    $vr_table    = $wpdb->prefix . 'lead_venda_realizada';

    switch ($tipo) {

      case 'faturamento':
        $sql = "SELECT COALESCE(SUM(vr.valor), 0)
                FROM {$vr_table} vr
                JOIN {$leads_table} l ON l.id = vr.lead_id
                WHERE l.loja_id = %d
                AND (
                  (vr.data_venda IS NOT NULL AND vr.data_venda BETWEEN %s AND %s)
                  OR (vr.data_venda IS NULL AND DATE(vr.created_at) BETWEEN %s AND %s)
                )";
        $params = [$loja_id, $data_inicio, $data_fim, $data_inicio, $data_fim];

        if ($usuario_id !== null) {
          $sql     .= ' AND l.responsavel_id = %d';
          $params[] = $usuario_id;
        }

        return (float) $wpdb->get_var($wpdb->prepare($sql, ...$params));

      case 'quantidade_vendas':
        $sql = "SELECT COUNT(*)
                FROM {$vr_table} vr
                JOIN {$leads_table} l ON l.id = vr.lead_id
                WHERE l.loja_id = %d
                AND (
                  (vr.data_venda IS NOT NULL AND vr.data_venda BETWEEN %s AND %s)
                  OR (vr.data_venda IS NULL AND DATE(vr.created_at) BETWEEN %s AND %s)
                )";
        $params = [$loja_id, $data_inicio, $data_fim, $data_inicio, $data_fim];

        if ($usuario_id !== null) {
          $sql     .= ' AND l.responsavel_id = %d';
          $params[] = $usuario_id;
        }

        return (float) $wpdb->get_var($wpdb->prepare($sql, ...$params));

      case 'conversao':
        $sql_total = "SELECT COUNT(*) FROM {$leads_table}
                      WHERE loja_id = %d
                      AND DATE(data_criacao) BETWEEN %s AND %s";
        $params_total = [$loja_id, $data_inicio, $data_fim];

        $sql_conv = "SELECT COUNT(*) FROM {$vr_table} vr
                     JOIN {$leads_table} l ON l.id = vr.lead_id
                     WHERE l.loja_id = %d
                     AND DATE(vr.created_at) BETWEEN %s AND %s";
        $params_conv = [$loja_id, $data_inicio, $data_fim];

        if ($usuario_id !== null) {
          $sql_total  .= ' AND responsavel_id = %d';
          $params_total[] = $usuario_id;
          $sql_conv   .= ' AND l.responsavel_id = %d';
          $params_conv[]  = $usuario_id;
        }

        $total = (int) $wpdb->get_var($wpdb->prepare($sql_total, ...$params_total));
        $conv  = (int) $wpdb->get_var($wpdb->prepare($sql_conv, ...$params_conv));

        return $total > 0 ? round(($conv / $total) * 100, 1) : 0;

      default:
        return 0;
    }
  }

  /**
   * Retorna ranking de vendedores para as metas ativas de uma loja.
   * Agrupa metas de faturamento por usuário.
   */
  public static function ranking_faturamento(int $loja_id, string $data_inicio, string $data_fim): array
  {
    global $wpdb;
    $leads_table = $wpdb->prefix . 'leads';
    $vr_table    = $wpdb->prefix . 'lead_venda_realizada';

    $rows = $wpdb->get_results($wpdb->prepare(
      "SELECT l.responsavel_id AS usuario_id,
              MAX(u.display_name) AS usuario_nome,
              COALESCE(SUM(vr.valor), 0) AS total_realizado
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
       ORDER BY total_realizado DESC",
      $loja_id, $data_inicio, $data_fim, $data_inicio, $data_fim
    ), ARRAY_A);

    return array_map(function ($r) {
      return [
        'usuario_id'      => (int) $r['usuario_id'],
        'usuario_nome'    => $r['usuario_nome'] ?? 'Usuário #' . $r['usuario_id'],
        'valor_realizado' => (float) $r['total_realizado'],
      ];
    }, $rows ?: []);
  }

  private static function sanitize(array $data): array
  {
    $tipos_validos   = ['faturamento', 'quantidade_vendas', 'conversao', 'personalizada'];
    $periodos_validos = ['mensal', 'trimestral', 'semestral', 'anual'];
    $status_validos  = ['ativa', 'encerrada', 'cancelada'];

    return [
      'loja_id'    => intval($data['loja_id']),
      'usuario_id' => isset($data['usuario_id']) && $data['usuario_id'] !== null ? intval($data['usuario_id']) : null,
      'nome'       => sanitize_text_field($data['nome'] ?? ''),
      'tipo'       => in_array($data['tipo'] ?? '', $tipos_validos, true) ? $data['tipo'] : 'faturamento',
      'periodo'    => in_array($data['periodo'] ?? '', $periodos_validos, true) ? $data['periodo'] : 'mensal',
      'valor_meta' => floatval($data['valor_meta'] ?? 0),
      'data_inicio' => sanitize_text_field($data['data_inicio'] ?? ''),
      'data_fim'    => sanitize_text_field($data['data_fim'] ?? ''),
      'status'     => in_array($data['status'] ?? '', $status_validos, true) ? $data['status'] : 'ativa',
    ];
  }

  private static function cast_row(array $row): array
  {
    $row['id']         = (int) $row['id'];
    $row['loja_id']    = (int) $row['loja_id'];
    $row['usuario_id'] = $row['usuario_id'] !== null ? (int) $row['usuario_id'] : null;
    $row['valor_meta'] = (float) $row['valor_meta'];
    return $row;
  }
}
