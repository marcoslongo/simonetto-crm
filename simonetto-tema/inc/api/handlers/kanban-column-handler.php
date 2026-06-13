<?php
/**
 * Handler de Colunas do Kanban
 *
 * Tabela: wp_kanban_columns
 *   id        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
 *   loja_id   BIGINT UNSIGNED NOT NULL
 *   slug      VARCHAR(100) NOT NULL
 *   label     VARCHAR(255) NOT NULL
 *   cor       VARCHAR(50)  NOT NULL DEFAULT 'gray'
 *   ordem     INT          NOT NULL DEFAULT 0
 *   fixo      TINYINT(1)   NOT NULL DEFAULT 0
 *   criado_em DATETIME     NOT NULL
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

class Kanban_Column_Handler
{
  const FIXED_COLUMNS = [
    ['slug' => 'nao_atendido',       'label' => 'Não Atendidos',      'cor' => 'amber',   'ordem' => 0],
    ['slug' => 'em_negociacao',      'label' => 'Em Negociação',      'cor' => 'blue',    'ordem' => 1],
    ['slug' => 'venda_realizada',    'label' => 'Venda Realizada',    'cor' => 'emerald', 'ordem' => 2],
    ['slug' => 'venda_nao_realizada','label' => 'Venda Não Realizada','cor' => 'red',     'ordem' => 3],
  ];

  private static function table(): string
  {
    global $wpdb;
    return $wpdb->prefix . 'kanban_columns';
  }

  public static function maybe_create_table(): void
  {
    global $wpdb;
    $table   = self::table();
    $charset = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS {$table} (
      id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      loja_id   BIGINT UNSIGNED NOT NULL,
      slug      VARCHAR(100)    NOT NULL,
      label     VARCHAR(255)    NOT NULL,
      cor       VARCHAR(50)     NOT NULL DEFAULT 'gray',
      ordem     INT             NOT NULL DEFAULT 0,
      fixo      TINYINT(1)      NOT NULL DEFAULT 0,
      criado_em DATETIME        NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY loja_slug (loja_id, slug),
      KEY loja_id (loja_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 {$charset};";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql);
  }

  /**
   * Retorna todas as colunas de uma loja, ordenadas.
   * Se ainda não existirem, semeia as 4 fixas automaticamente.
   */
  public static function get_columns(int $loja_id): array
  {
    global $wpdb;
    $table = self::table();

    // Garante que a tabela existe antes de qualquer consulta
    self::maybe_create_table();

    $wpdb->suppress_errors(true);
    $count = (int) $wpdb->get_var($wpdb->prepare(
      "SELECT COUNT(*) FROM {$table} WHERE loja_id = %d",
      $loja_id
    ));
    $wpdb->suppress_errors(false);

    if ($count === 0) {
      self::seed_fixed_for_loja($loja_id);
    }

    $results = $wpdb->get_results($wpdb->prepare(
      "SELECT id, loja_id, slug, label, cor, ordem, fixo FROM {$table}
       WHERE loja_id = %d ORDER BY ordem ASC, id ASC",
      $loja_id
    ), ARRAY_A);

    return $results ?: [];
  }

  /**
   * Retorna apenas os slugs de status permitidos para uma loja.
   */
  public static function get_allowed_statuses(int $loja_id): array
  {
    $columns = self::get_columns($loja_id);
    return array_column($columns, 'slug');
  }

  /**
   * Cria uma coluna customizada para uma loja.
   *
   * @param int      $loja_id
   * @param string   $label
   * @param string   $cor
   * @param int|null $after_id  ID da coluna após a qual inserir (null = no final)
   */
  public static function create_custom(int $loja_id, string $label, string $cor, ?int $after_id = null): array|WP_Error
  {
    global $wpdb;
    $table = self::table();

    $label = sanitize_text_field(trim($label));
    $cor   = sanitize_text_field(trim($cor));

    if (empty($label)) {
      return new WP_Error('invalid_label', 'O nome da coluna não pode ser vazio.', ['status' => 400]);
    }

    $cores_validas = ['purple', 'indigo', 'teal', 'orange', 'pink', 'gray', 'violet', 'cyan', 'lime', 'yellow'];
    if (!in_array($cor, $cores_validas, true)) {
      $cor = 'gray';
    }

    if ($after_id !== null) {
      $after_ordem = $wpdb->get_var($wpdb->prepare(
        "SELECT ordem FROM {$table} WHERE id = %d AND loja_id = %d",
        $after_id, $loja_id
      ));

      if ($after_ordem === null) {
        return new WP_Error('invalid_after_id', 'Coluna de referência não encontrada.', ['status' => 404]);
      }

      $after_ordem = (int) $after_ordem;

      // Abre espaço: incrementa ordem de todas as colunas após a posição de inserção
      $wpdb->query($wpdb->prepare(
        "UPDATE {$table} SET ordem = ordem + 1 WHERE loja_id = %d AND ordem > %d",
        $loja_id, $after_ordem
      ));

      $new_ordem = $after_ordem + 1;
    } else {
      $max_ordem = (int) $wpdb->get_var($wpdb->prepare(
        "SELECT COALESCE(MAX(ordem), -1) FROM {$table} WHERE loja_id = %d",
        $loja_id
      ));
      $new_ordem = $max_ordem + 1;
    }

    $inserted = $wpdb->insert(
      $table,
      [
        'loja_id'   => $loja_id,
        'slug'      => '_temp',
        'label'     => $label,
        'cor'       => $cor,
        'ordem'     => $new_ordem,
        'fixo'      => 0,
        'criado_em' => current_time('mysql'),
      ],
      ['%d', '%s', '%s', '%s', '%d', '%d', '%s']
    );

    if (!$inserted) {
      return new WP_Error('db_error', 'Erro ao criar coluna.', ['status' => 500]);
    }

    $new_id = $wpdb->insert_id;
    $slug   = 'c_' . $new_id;

    $wpdb->update($table, ['slug' => $slug], ['id' => $new_id], ['%s'], ['%d']);

    return [
      'id'      => $new_id,
      'loja_id' => $loja_id,
      'slug'    => $slug,
      'label'   => $label,
      'cor'     => $cor,
      'ordem'   => $new_ordem,
      'fixo'    => 0,
    ];
  }

  /**
   * Move uma coluna uma posição para a esquerda ou direita dentro da loja.
   *
   * @param int    $id       ID da coluna a mover
   * @param int    $loja_id
   * @param string $direction  'left' | 'right'
   */
  public static function move_column(int $id, int $loja_id, string $direction): bool|WP_Error
  {
    global $wpdb;
    $table = self::table();

    $current = $wpdb->get_row($wpdb->prepare(
      "SELECT * FROM {$table} WHERE id = %d AND loja_id = %d",
      $id, $loja_id
    ));

    if (!$current) {
      return new WP_Error('not_found', 'Coluna não encontrada.', ['status' => 404]);
    }

    $current_ordem = (int) $current->ordem;

    if ($direction === 'left') {
      $neighbor = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$table} WHERE loja_id = %d AND ordem < %d ORDER BY ordem DESC LIMIT 1",
        $loja_id, $current_ordem
      ));
    } else {
      $neighbor = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$table} WHERE loja_id = %d AND ordem > %d ORDER BY ordem ASC LIMIT 1",
        $loja_id, $current_ordem
      ));
    }

    if (!$neighbor) {
      return new WP_Error('boundary', 'A coluna já está no limite.', ['status' => 400]);
    }

    $neighbor_ordem = (int) $neighbor->ordem;

    // Troca as ordens
    $wpdb->update($table, ['ordem' => $neighbor_ordem], ['id' => $id],       ['%d'], ['%d']);
    $wpdb->update($table, ['ordem' => $current_ordem],  ['id' => $neighbor->id], ['%d'], ['%d']);

    return true;
  }

  /**
   * Exclui uma coluna customizada.
   * Bloqueia se houver leads com esse status.
   */
  public static function delete_custom(int $id, int $loja_id): bool|WP_Error
  {
    global $wpdb;
    $table = self::table();

    $coluna = $wpdb->get_row($wpdb->prepare(
      "SELECT * FROM {$table} WHERE id = %d AND loja_id = %d",
      $id, $loja_id
    ));

    if (!$coluna) {
      return new WP_Error('not_found', 'Coluna não encontrada.', ['status' => 404]);
    }

    if ((int) $coluna->fixo === 1) {
      return new WP_Error('forbidden', 'Colunas fixas não podem ser excluídas.', ['status' => 403]);
    }

    $leads_count = (int) $wpdb->get_var($wpdb->prepare(
      "SELECT COUNT(*) FROM {$wpdb->prefix}leads WHERE status = %s AND loja_id = %d",
      $coluna->slug, $loja_id
    ));

    if ($leads_count > 0) {
      return new WP_Error(
        'has_leads',
        "Não é possível excluir: há {$leads_count} lead(s) nesta coluna. Mova-os primeiro.",
        ['status' => 409]
      );
    }

    $wpdb->delete($table, ['id' => $id], ['%d']);
    return true;
  }

  /**
   * Semeia as 4 colunas fixas para todas as lojas que já possuem leads.
   * Chamado uma única vez na migração.
   */
  public static function seed_all_existing_lojas(): void
  {
    global $wpdb;

    $loja_ids = $wpdb->get_col(
      "SELECT DISTINCT loja_id FROM {$wpdb->prefix}leads WHERE loja_id IS NOT NULL AND loja_id > 0"
    );

    foreach ($loja_ids as $loja_id) {
      self::seed_fixed_for_loja((int) $loja_id);
    }
  }

  /**
   * Semeia as 4 colunas fixas para uma loja específica (idempotente via INSERT IGNORE).
   */
  private static function seed_fixed_for_loja(int $loja_id): void
  {
    global $wpdb;
    $table = self::table();
    $now   = current_time('mysql');

    foreach (self::FIXED_COLUMNS as $col) {
      $wpdb->query($wpdb->prepare(
        "INSERT IGNORE INTO {$table} (loja_id, slug, label, cor, ordem, fixo, criado_em)
         VALUES (%d, %s, %s, %s, %d, 1, %s)",
        $loja_id,
        $col['slug'],
        $col['label'],
        $col['cor'],
        $col['ordem'],
        $now
      ));
    }
  }
}
