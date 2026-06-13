<?php
/**
 * Handler de Notificações de Atribuição de Lead
 *
 * Tabela: wp_lead_notificacoes
 *   id                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
 *   usuario_id         BIGINT UNSIGNED NOT NULL  — destinatário
 *   lead_id            BIGINT UNSIGNED NOT NULL
 *   lead_nome          VARCHAR(255) NOT NULL
 *   atribuido_por_id   BIGINT UNSIGNED NOT NULL
 *   atribuido_por_nome VARCHAR(255) NOT NULL
 *   lida               TINYINT(1) NOT NULL DEFAULT 0
 *   criado_em          DATETIME NOT NULL
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

class Lead_Notificacoes_Handler
{
  private static function table(): string
  {
    global $wpdb;
    return $wpdb->prefix . 'lead_notificacoes';
  }

  public static function maybe_create_table(): void
  {
    global $wpdb;
    $charset = $wpdb->get_charset_collate();
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta("CREATE TABLE IF NOT EXISTS " . self::table() . " (
      id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      usuario_id         BIGINT UNSIGNED NOT NULL,
      lead_id            BIGINT UNSIGNED NOT NULL,
      lead_nome          VARCHAR(255)    NOT NULL DEFAULT '',
      atribuido_por_id   BIGINT UNSIGNED NOT NULL,
      atribuido_por_nome VARCHAR(255)    NOT NULL DEFAULT '',
      lida               TINYINT(1)      NOT NULL DEFAULT 0,
      criado_em          DATETIME        NOT NULL,
      PRIMARY KEY (id),
      KEY usuario_id (usuario_id),
      KEY lead_id (lead_id),
      KEY lida (lida)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 {$charset};");
  }

  // ── Criar notificação ─────────────────────────────────────────────────────

  public static function criar(
    int $usuario_id,
    int $lead_id,
    string $lead_nome,
    int $atribuido_por_id,
    string $atribuido_por_nome
  ): void {
    // Não notifica auto-atribuição
    if ($usuario_id === $atribuido_por_id) return;

    global $wpdb;
    $wpdb->insert(self::table(), [
      'usuario_id'         => $usuario_id,
      'lead_id'            => $lead_id,
      'lead_nome'          => $lead_nome,
      'atribuido_por_id'   => $atribuido_por_id,
      'atribuido_por_nome' => $atribuido_por_nome,
      'lida'               => 0,
      'criado_em'          => current_time('mysql'),
    ]);
  }

  // ── Listar não lidas ──────────────────────────────────────────────────────

  public static function list_unread(int $usuario_id): array
  {
    global $wpdb;
    $rows = $wpdb->get_results($wpdb->prepare(
      "SELECT * FROM " . self::table() . "
       WHERE usuario_id = %d AND lida = 0
       ORDER BY criado_em DESC
       LIMIT 50",
      $usuario_id
    ), ARRAY_A);

    return array_map([self::class, 'cast'], $rows ?: []);
  }

  // ── Marcar como lida ──────────────────────────────────────────────────────

  public static function marcar_lida(int $id, int $usuario_id): bool
  {
    global $wpdb;
    $updated = $wpdb->update(
      self::table(),
      ['lida' => 1],
      ['id' => $id, 'usuario_id' => $usuario_id]
    );
    return $updated !== false;
  }

  public static function marcar_todas_lidas(int $usuario_id): void
  {
    global $wpdb;
    $wpdb->update(self::table(), ['lida' => 1], ['usuario_id' => $usuario_id, 'lida' => 0]);
  }

  // ── Cast ──────────────────────────────────────────────────────────────────

  private static function cast(array $row): array
  {
    return [
      'id'                 => (int) $row['id'],
      'usuario_id'         => (int) $row['usuario_id'],
      'lead_id'            => (int) $row['lead_id'],
      'lead_nome'          => $row['lead_nome'],
      'atribuido_por_id'   => (int) $row['atribuido_por_id'],
      'atribuido_por_nome' => $row['atribuido_por_nome'],
      'lida'               => (bool) $row['lida'],
      'criado_em'          => $row['criado_em'],
    ];
  }
}
