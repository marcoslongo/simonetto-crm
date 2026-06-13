<?php
/**
 * Handler de Etiquetas
 *
 * Tabelas:
 *   wp_etiquetas:
 *     id        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
 *     loja_id   BIGINT UNSIGNED NOT NULL
 *     nome      VARCHAR(100) NOT NULL
 *     cor       VARCHAR(50)  NOT NULL DEFAULT 'gray'
 *     ordem     INT          NOT NULL DEFAULT 0
 *     criado_em DATETIME     NOT NULL
 *
 *   wp_lead_etiquetas:
 *     lead_id      BIGINT UNSIGNED NOT NULL
 *     etiqueta_id  BIGINT UNSIGNED NOT NULL
 *     PRIMARY KEY (lead_id, etiqueta_id)
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

class Etiqueta_Handler
{
  const CORES_VALIDAS = [
    'purple', 'indigo', 'teal', 'orange', 'pink', 'gray',
    'violet', 'cyan', 'lime', 'yellow', 'red', 'emerald', 'blue', 'amber',
  ];

  private static function table(): string
  {
    global $wpdb;
    return $wpdb->prefix . 'etiquetas';
  }

  private static function pivot(): string
  {
    global $wpdb;
    return $wpdb->prefix . 'lead_etiquetas';
  }

  public static function maybe_create_tables(): void
  {
    global $wpdb;
    $charset = $wpdb->get_charset_collate();

    $t_etiquetas = self::table();
    $sql_etiquetas = "CREATE TABLE IF NOT EXISTS {$t_etiquetas} (
      id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      loja_id   BIGINT UNSIGNED NOT NULL,
      nome      VARCHAR(100)    NOT NULL,
      cor       VARCHAR(50)     NOT NULL DEFAULT 'gray',
      ordem     INT             NOT NULL DEFAULT 0,
      criado_em DATETIME        NOT NULL,
      PRIMARY KEY (id),
      KEY loja_id (loja_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 {$charset};";

    $t_pivot = self::pivot();
    $sql_pivot = "CREATE TABLE IF NOT EXISTS {$t_pivot} (
      lead_id     BIGINT UNSIGNED NOT NULL,
      etiqueta_id BIGINT UNSIGNED NOT NULL,
      PRIMARY KEY (lead_id, etiqueta_id),
      KEY etiqueta_id (etiqueta_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 {$charset};";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql_etiquetas);
    dbDelta($sql_pivot);
  }

  public static function get_by_loja(int $loja_id): array
  {
    global $wpdb;
    $t = self::table();

    $rows = $wpdb->get_results($wpdb->prepare(
      "SELECT id, loja_id, nome, cor, ordem FROM {$t}
       WHERE loja_id = %d ORDER BY ordem ASC, id ASC",
      $loja_id
    ), ARRAY_A);

    return array_map([self::class, '_format_etiqueta'], $rows ?: []);
  }

  public static function create(int $loja_id, string $nome, string $cor): array|WP_Error
  {
    global $wpdb;
    $t = self::table();

    $nome = sanitize_text_field(trim($nome));
    $cor  = sanitize_text_field(trim($cor));

    if (empty($nome)) {
      return new WP_Error('invalid_nome', 'O nome da etiqueta não pode ser vazio.', ['status' => 400]);
    }

    if (!in_array($cor, self::CORES_VALIDAS, true)) {
      $cor = 'gray';
    }

    $max_ordem = (int) $wpdb->get_var($wpdb->prepare(
      "SELECT COALESCE(MAX(ordem), -1) FROM {$t} WHERE loja_id = %d",
      $loja_id
    ));

    $inserted = $wpdb->insert(
      $t,
      [
        'loja_id'   => $loja_id,
        'nome'      => $nome,
        'cor'       => $cor,
        'ordem'     => $max_ordem + 1,
        'criado_em' => current_time('mysql'),
      ],
      ['%d', '%s', '%s', '%d', '%s']
    );

    if (!$inserted) {
      return new WP_Error('db_error', 'Erro ao criar etiqueta.', ['status' => 500]);
    }

    return self::_format_etiqueta([
      'id'      => $wpdb->insert_id,
      'loja_id' => $loja_id,
      'nome'    => $nome,
      'cor'     => $cor,
      'ordem'   => $max_ordem + 1,
    ]);
  }

  public static function update(int $id, int $loja_id, ?string $nome, ?string $cor): array|WP_Error
  {
    global $wpdb;
    $t = self::table();

    $row = $wpdb->get_row($wpdb->prepare(
      "SELECT * FROM {$t} WHERE id = %d AND loja_id = %d",
      $id, $loja_id
    ));

    if (!$row) {
      return new WP_Error('not_found', 'Etiqueta não encontrada.', ['status' => 404]);
    }

    $fields  = [];
    $formats = [];

    if ($nome !== null) {
      $nome = sanitize_text_field(trim($nome));
      if (empty($nome)) {
        return new WP_Error('invalid_nome', 'O nome não pode ser vazio.', ['status' => 400]);
      }
      $fields['nome'] = $nome;
      $formats[]      = '%s';
    }

    if ($cor !== null) {
      $cor = sanitize_text_field(trim($cor));
      if (!in_array($cor, self::CORES_VALIDAS, true)) {
        $cor = 'gray';
      }
      $fields['cor'] = $cor;
      $formats[]     = '%s';
    }

    if (empty($fields)) {
      return new WP_Error('no_changes', 'Nenhum campo para atualizar.', ['status' => 400]);
    }

    $wpdb->update($t, $fields, ['id' => $id], $formats, ['%d']);

    return self::_format_etiqueta([
      'id'      => $id,
      'loja_id' => $loja_id,
      'nome'    => $fields['nome'] ?? $row->nome,
      'cor'     => $fields['cor']  ?? $row->cor,
      'ordem'   => (int) $row->ordem,
    ]);
  }

  public static function delete(int $id, int $loja_id): bool|WP_Error
  {
    global $wpdb;

    $row = $wpdb->get_row($wpdb->prepare(
      "SELECT id FROM {$wpdb->prefix}etiquetas WHERE id = %d AND loja_id = %d",
      $id, $loja_id
    ));

    if (!$row) {
      return new WP_Error('not_found', 'Etiqueta não encontrada.', ['status' => 404]);
    }

    $wpdb->delete(self::pivot(), ['etiqueta_id' => $id], ['%d']);
    $wpdb->delete(self::table(), ['id' => $id], ['%d']);

    return true;
  }

  /**
   * Etiquetas de um lead (usado em get_by_id — consulta única).
   */
  public static function get_lead_etiquetas(int $lead_id): array
  {
    global $wpdb;

    $rows = $wpdb->get_results($wpdb->prepare(
      "SELECT e.id, e.loja_id, e.nome, e.cor
       FROM {$wpdb->prefix}lead_etiquetas le
       JOIN {$wpdb->prefix}etiquetas e ON le.etiqueta_id = e.id
       WHERE le.lead_id = %d
       ORDER BY e.ordem ASC, e.id ASC",
      $lead_id
    ), ARRAY_A);

    return array_map([self::class, '_format_etiqueta'], $rows ?: []);
  }

  /**
   * Mapa [lead_id => [etiquetas]] para um conjunto de IDs.
   * Usado em listagens para evitar N+1.
   */
  public static function get_etiquetas_for_leads(array $lead_ids): array
  {
    global $wpdb;
    if (empty($lead_ids)) return [];

    $placeholders = implode(',', array_fill(0, count($lead_ids), '%d'));

    $rows = $wpdb->get_results(
      $wpdb->prepare(
        "SELECT le.lead_id, e.id, e.loja_id, e.nome, e.cor
         FROM {$wpdb->prefix}lead_etiquetas le
         JOIN {$wpdb->prefix}etiquetas e ON le.etiqueta_id = e.id
         WHERE le.lead_id IN ({$placeholders})
         ORDER BY e.ordem ASC, e.id ASC",
        ...$lead_ids
      ),
      ARRAY_A
    );

    $map = [];
    foreach ($rows as $row) {
      $lid       = (int) $row['lead_id'];
      $map[$lid][] = self::_format_etiqueta([
        'id'      => $row['id'],
        'loja_id' => $row['loja_id'],
        'nome'    => $row['nome'],
        'cor'     => $row['cor'],
      ]);
    }

    return $map;
  }

  /**
   * Atribui etiqueta a um lead (idempotente via INSERT IGNORE).
   */
  public static function assign(int $lead_id, int $etiqueta_id, int $loja_id): bool|WP_Error
  {
    global $wpdb;

    $etiqueta = $wpdb->get_row($wpdb->prepare(
      "SELECT id FROM {$wpdb->prefix}etiquetas WHERE id = %d AND loja_id = %d",
      $etiqueta_id, $loja_id
    ));

    if (!$etiqueta) {
      return new WP_Error('not_found', 'Etiqueta não encontrada para esta loja.', ['status' => 404]);
    }

    $wpdb->query($wpdb->prepare(
      "INSERT IGNORE INTO {$wpdb->prefix}lead_etiquetas (lead_id, etiqueta_id) VALUES (%d, %d)",
      $lead_id, $etiqueta_id
    ));

    return true;
  }

  /**
   * Remove etiqueta de um lead.
   */
  public static function remove_from_lead(int $lead_id, int $etiqueta_id): void
  {
    global $wpdb;
    $wpdb->delete(
      $wpdb->prefix . 'lead_etiquetas',
      ['lead_id' => $lead_id, 'etiqueta_id' => $etiqueta_id],
      ['%d', '%d']
    );
  }

  private static function _format_etiqueta(array $row): array
  {
    return [
      'id'      => (int) $row['id'],
      'loja_id' => (int) $row['loja_id'],
      'nome'    => $row['nome'],
      'cor'     => $row['cor'],
      'ordem'   => isset($row['ordem']) ? (int) $row['ordem'] : 0,
    ];
  }
}
