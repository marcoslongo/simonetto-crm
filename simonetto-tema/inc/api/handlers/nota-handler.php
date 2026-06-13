<?php
/**
 * Handler de Notas Internas de Lead
 *
 * Tabela: wp_leads_notas
 *   id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
 *   lead_id     BIGINT UNSIGNED NOT NULL
 *   usuario_id  BIGINT UNSIGNED NOT NULL
 *   usuario_nome VARCHAR(255) NOT NULL DEFAULT ''
 *   conteudo    TEXT NOT NULL
 *   criado_em   DATETIME NOT NULL
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

class Nota_Handler
{
  private static function table(): string
  {
    global $wpdb;
    return $wpdb->prefix . 'leads_notas';
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
      id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      lead_id     BIGINT UNSIGNED NOT NULL,
      usuario_id  BIGINT UNSIGNED NOT NULL,
      usuario_nome VARCHAR(255)   NOT NULL DEFAULT '',
      conteudo    TEXT            NOT NULL,
      criado_em   DATETIME        NOT NULL,
      PRIMARY KEY (id),
      KEY lead_id (lead_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 {$charset};";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql);
  }

  /**
   * Listar notas de um lead (ordem cronológica inversa).
   */
  public static function list_by_lead(int $lead_id): array
  {
    global $wpdb;
    $rows = $wpdb->get_results($wpdb->prepare(
      "SELECT * FROM " . self::table() . " WHERE lead_id = %d ORDER BY criado_em DESC",
      $lead_id
    ), ARRAY_A);

    return array_map([self::class, 'format'], $rows ?? []);
  }

  /**
   * Criar nota.
   */
  public static function create(array $params): array|WP_Error
  {
    global $wpdb;

    $lead_id  = intval($params['lead_id'] ?? 0);
    $conteudo = sanitize_textarea_field($params['conteudo'] ?? '');

    if (!$lead_id || !$conteudo) {
      return new WP_Error('missing_fields', 'lead_id e conteudo são obrigatórios.', ['status' => 400]);
    }

    $user      = wp_get_current_user();
    $user_id   = (int) $user->ID;
    $user_nome = $user->display_name ?: $user->user_login;

    $wpdb->insert(self::table(), [
      'lead_id'      => $lead_id,
      'usuario_id'   => $user_id,
      'usuario_nome' => $user_nome,
      'conteudo'     => $conteudo,
      'criado_em'    => current_time('mysql'),
    ]);

    if ($wpdb->last_error) {
      return new WP_Error('db_error', $wpdb->last_error, ['status' => 500]);
    }

    $nota = $wpdb->get_row($wpdb->prepare(
      "SELECT * FROM " . self::table() . " WHERE id = %d",
      $wpdb->insert_id
    ), ARRAY_A);

    return self::format($nota);
  }

  /**
   * Excluir nota. Apenas o próprio autor pode excluir.
   */
  public static function delete(int $nota_id): bool|WP_Error
  {
    global $wpdb;

    $nota = $wpdb->get_row($wpdb->prepare(
      "SELECT * FROM " . self::table() . " WHERE id = %d",
      $nota_id
    ), ARRAY_A);

    if (!$nota) {
      return new WP_Error('not_found', 'Nota não encontrada.', ['status' => 404]);
    }

    $user_id = (int) wp_get_current_user()->ID;
    if ((int) $nota['usuario_id'] !== $user_id && !current_user_can('manage_options')) {
      return new WP_Error('forbidden', 'Sem permissão para excluir esta nota.', ['status' => 403]);
    }

    $wpdb->delete(self::table(), ['id' => $nota_id], ['%d']);
    return true;
  }

  private static function format(array $row): array
  {
    return [
      'id'           => (int) $row['id'],
      'lead_id'      => (int) $row['lead_id'],
      'usuario_id'   => (int) $row['usuario_id'],
      'usuario_nome' => $row['usuario_nome'],
      'conteudo'     => $row['conteudo'],
      'criado_em'    => $row['criado_em'],
    ];
  }
}
