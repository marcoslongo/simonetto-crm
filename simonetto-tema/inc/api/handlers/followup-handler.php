<?php
/**
 * Handler de Follow-ups de Lead
 *
 * Tabela: wp_leads_followups
 *   id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
 *   lead_id         BIGINT UNSIGNED NOT NULL
 *   usuario_id      BIGINT UNSIGNED NOT NULL
 *   usuario_nome    VARCHAR(255) NOT NULL DEFAULT ''
 *   agendado_para   DATETIME NOT NULL
 *   descricao       TEXT NULL
 *   concluido       TINYINT(1) NOT NULL DEFAULT 0
 *   concluido_em    DATETIME NULL
 *   criado_em       DATETIME NOT NULL
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

class Followup_Handler
{
  private static function table(): string
  {
    global $wpdb;
    return $wpdb->prefix . 'leads_followups';
  }

  /**
   * Criar a tabela se não existir (chamado no init).
   */
  public static function maybe_create_table(): void
  {
    global $wpdb;
    $table   = self::table();
    $charset = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS {$table} (
      id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      lead_id       BIGINT UNSIGNED NULL,
      titulo        VARCHAR(255)    NULL,
      usuario_id    BIGINT UNSIGNED NOT NULL,
      usuario_nome  VARCHAR(255)    NOT NULL DEFAULT '',
      agendado_para DATETIME        NOT NULL,
      descricao     TEXT            NULL,
      concluido     TINYINT(1)      NOT NULL DEFAULT 0,
      concluido_em  DATETIME        NULL,
      criado_em     DATETIME        NOT NULL,
      PRIMARY KEY (id),
      KEY lead_id (lead_id),
      KEY agendado_para (agendado_para)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 {$charset};";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql);

    self::maybe_upgrade_table();
  }

  /**
   * Migra instalações existentes: torna lead_id nullable e adiciona coluna titulo.
   */
  public static function maybe_upgrade_table(): void
  {
    $version_key = 'noxus_followup_schema_version';
    if ((int) get_option($version_key, 0) >= 2) {
      return;
    }

    global $wpdb;
    $table = self::table();

    // Torna lead_id nullable se ainda for NOT NULL
    $col = $wpdb->get_row($wpdb->prepare(
      "SELECT IS_NULLABLE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = 'lead_id'",
      DB_NAME,
      $table
    ), ARRAY_A);

    if ($col && $col['IS_NULLABLE'] === 'NO') {
      $wpdb->query("ALTER TABLE {$table} MODIFY COLUMN lead_id BIGINT UNSIGNED NULL");
    }

    // Adiciona coluna titulo se não existir
    $has_titulo = (int) $wpdb->get_var($wpdb->prepare(
      "SELECT COUNT(*) FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = 'titulo'",
      DB_NAME,
      $table
    ));

    if (!$has_titulo) {
      $wpdb->query("ALTER TABLE {$table} ADD COLUMN titulo VARCHAR(255) NULL AFTER lead_id");
    }

    update_option($version_key, 2);
  }

  /**
   * Retorna follow-ups vencidos (agendado_para < agora, não concluídos) do usuário.
   */
  public static function list_overdue_for_user(int $user_id): array
  {
    global $wpdb;
    $table_f = self::table();
    $table_l = $wpdb->prefix . 'leads';

    $rows = $wpdb->get_results($wpdb->prepare(
      "SELECT f.*, l.nome AS lead_nome
       FROM {$table_f} f
       LEFT JOIN {$table_l} l ON l.id = f.lead_id
       WHERE f.usuario_id = %d
         AND f.concluido  = 0
         AND f.agendado_para < %s
       ORDER BY f.agendado_para ASC
       LIMIT 50",
      $user_id,
      current_time('mysql')
    ), ARRAY_A);

    return array_map(function ($row) {
      $f = self::format($row);
      $f['lead_nome'] = $row['lead_nome'] ?? null;
      return $f;
    }, $rows ?? []);
  }

  /**
   * Listar follow-ups de um mês para o calendário do usuário.
   * Retorna apenas os compromissos criados pelo próprio usuário.
   */
  public static function list_for_calendar(int $user_id, int $year, int $month): array
  {
    global $wpdb;
    $table_f = self::table();
    $table_l = $wpdb->prefix . 'leads';

    $days_in_month = (int) date('t', mktime(0, 0, 0, $month, 1, $year));
    $month_start   = sprintf('%04d-%02d-01 00:00:00', $year, $month);
    $month_end     = sprintf('%04d-%02d-%02d 23:59:59', $year, $month, $days_in_month);

    $rows = $wpdb->get_results($wpdb->prepare(
      "SELECT f.*, l.nome AS lead_nome
       FROM {$table_f} f
       LEFT JOIN {$table_l} l ON l.id = f.lead_id
       WHERE f.usuario_id = %d
         AND f.agendado_para BETWEEN %s AND %s
       ORDER BY f.agendado_para ASC
       LIMIT 500",
      $user_id,
      $month_start,
      $month_end
    ), ARRAY_A);

    return array_map(function (array $row): array {
      $f              = self::format($row);
      $f['lead_nome'] = $row['lead_nome'] ?? null;
      return $f;
    }, $rows ?? []);
  }

  /**
   * Listar follow-ups de um lead (ordem por agendado_para ASC).
   */
  public static function list_by_lead(int $lead_id): array
  {
    global $wpdb;
    $rows = $wpdb->get_results($wpdb->prepare(
      "SELECT * FROM " . self::table() . " WHERE lead_id = %d ORDER BY agendado_para ASC",
      $lead_id
    ), ARRAY_A);

    return array_map([self::class, 'format'], $rows ?? []);
  }

  /**
   * Criar follow-up (com ou sem lead vinculado).
   */
  public static function create(array $params): array|WP_Error
  {
    global $wpdb;

    $lead_id       = isset($params['lead_id']) && $params['lead_id'] ? (int) $params['lead_id'] : null;
    $titulo        = isset($params['titulo']) && $params['titulo'] !== ''
      ? sanitize_text_field($params['titulo'])
      : null;
    $agendado_para = sanitize_text_field($params['agendado_para'] ?? '');

    if (!$agendado_para) {
      return new WP_Error('missing_fields', 'agendado_para é obrigatório.', ['status' => 400]);
    }
    if (!$lead_id && !$titulo) {
      return new WP_Error('missing_fields', 'lead_id ou titulo é obrigatório.', ['status' => 400]);
    }

    $descricao = isset($params['descricao']) && $params['descricao'] !== ''
      ? sanitize_textarea_field($params['descricao'])
      : null;

    $user      = wp_get_current_user();
    $user_id   = (int) $user->ID;
    $user_nome = $user->display_name ?: $user->user_login;

    $wpdb->insert(self::table(), [
      'lead_id'      => $lead_id,
      'titulo'       => $titulo,
      'usuario_id'   => $user_id,
      'usuario_nome' => $user_nome,
      'agendado_para' => $agendado_para,
      'descricao'    => $descricao,
      'concluido'    => 0,
      'concluido_em' => null,
      'criado_em'    => current_time('mysql'),
    ]);

    if ($wpdb->last_error) {
      return new WP_Error('db_error', $wpdb->last_error, ['status' => 500]);
    }

    $row = $wpdb->get_row($wpdb->prepare(
      "SELECT * FROM " . self::table() . " WHERE id = %d",
      $wpdb->insert_id
    ), ARRAY_A);

    return self::format($row);
  }

  /**
   * Marcar follow-up como concluído.
   * Somente o autor ou admin pode concluir.
   */
  public static function mark_done(int $id): array|WP_Error
  {
    global $wpdb;

    $row = $wpdb->get_row($wpdb->prepare(
      "SELECT * FROM " . self::table() . " WHERE id = %d",
      $id
    ), ARRAY_A);

    if (!$row) {
      return new WP_Error('not_found', 'Follow-up não encontrado.', ['status' => 404]);
    }

    $user_id = (int) wp_get_current_user()->ID;
    if ((int) $row['usuario_id'] !== $user_id && !current_user_can('manage_options')) {
      return new WP_Error('forbidden', 'Sem permissão para concluir este follow-up.', ['status' => 403]);
    }

    $wpdb->update(
      self::table(),
      [
        'concluido'    => 1,
        'concluido_em' => current_time('mysql'),
      ],
      ['id' => $id],
      ['%d', '%s'],
      ['%d']
    );

    if ($wpdb->last_error) {
      return new WP_Error('db_error', $wpdb->last_error, ['status' => 500]);
    }

    $updated = $wpdb->get_row($wpdb->prepare(
      "SELECT * FROM " . self::table() . " WHERE id = %d",
      $id
    ), ARRAY_A);

    return self::format($updated);
  }

  /**
   * Excluir follow-up. Apenas o autor ou admin pode excluir.
   */
  public static function delete(int $id): bool|WP_Error
  {
    global $wpdb;

    $row = $wpdb->get_row($wpdb->prepare(
      "SELECT * FROM " . self::table() . " WHERE id = %d",
      $id
    ), ARRAY_A);

    if (!$row) {
      return new WP_Error('not_found', 'Follow-up não encontrado.', ['status' => 404]);
    }

    $user_id = (int) wp_get_current_user()->ID;
    if ((int) $row['usuario_id'] !== $user_id && !current_user_can('manage_options')) {
      return new WP_Error('forbidden', 'Sem permissão para excluir este follow-up.', ['status' => 403]);
    }

    $wpdb->delete(self::table(), ['id' => $id], ['%d']);
    return true;
  }

  private static function format(array $row): array
  {
    return [
      'id'           => (int) $row['id'],
      'lead_id'      => isset($row['lead_id']) && $row['lead_id'] !== null ? (int) $row['lead_id'] : null,
      'titulo'       => $row['titulo'] ?? null,
      'usuario_id'   => (int) $row['usuario_id'],
      'usuario_nome' => $row['usuario_nome'],
      'agendado_para' => $row['agendado_para'],
      'descricao'    => $row['descricao'] ?? null,
      'concluido'    => (bool) $row['concluido'],
      'concluido_em' => $row['concluido_em'] ?? null,
      'criado_em'    => $row['criado_em'],
    ];
  }
}
