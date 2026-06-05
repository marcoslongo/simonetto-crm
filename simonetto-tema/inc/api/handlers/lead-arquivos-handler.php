<?php
/**
 * Handler de Arquivos de Lead
 *
 * Tabela: wp_lead_arquivos
 *   id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
 *   lead_id         BIGINT UNSIGNED NOT NULL
 *   nome_original   VARCHAR(255) NOT NULL
 *   mime_type       VARCHAR(100) NOT NULL
 *   tamanho         INT UNSIGNED NOT NULL  (bytes)
 *   arquivo_url     VARCHAR(500) NOT NULL
 *   attachment_id   BIGINT UNSIGNED NULL
 *   usuario_id      BIGINT UNSIGNED NOT NULL
 *   usuario_nome    VARCHAR(255) NOT NULL
 *   criado_em       DATETIME NOT NULL
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

class Lead_Arquivos_Handler
{
  const MAX_BYTES  = 3 * 1024 * 1024; // 3 MB
  const ALLOWED    = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
  ];

  private static function table(): string
  {
    global $wpdb;
    return $wpdb->prefix . 'lead_arquivos';
  }

  public static function maybe_create_table(): void
  {
    global $wpdb;
    $charset = $wpdb->get_charset_collate();
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta("CREATE TABLE IF NOT EXISTS " . self::table() . " (
      id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      lead_id       BIGINT UNSIGNED NOT NULL,
      nome_original VARCHAR(255)    NOT NULL,
      mime_type     VARCHAR(100)    NOT NULL,
      tamanho       INT UNSIGNED    NOT NULL DEFAULT 0,
      arquivo_url   VARCHAR(500)    NOT NULL,
      attachment_id BIGINT UNSIGNED NULL,
      usuario_id    BIGINT UNSIGNED NOT NULL,
      usuario_nome  VARCHAR(255)    NOT NULL DEFAULT '',
      criado_em     DATETIME        NOT NULL,
      PRIMARY KEY (id),
      KEY lead_id (lead_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 {$charset};");
  }

  // ── Listagem ──────────────────────────────────────────────────────────────

  public static function list_by_lead(int $lead_id): array
  {
    global $wpdb;
    $rows = $wpdb->get_results(
      $wpdb->prepare("SELECT * FROM " . self::table() . " WHERE lead_id = %d ORDER BY criado_em DESC", $lead_id),
      ARRAY_A
    );
    return array_map([self::class, 'cast'], $rows ?: []);
  }

  // ── Upload ────────────────────────────────────────────────────────────────

  public static function upload(int $lead_id, array $file, int $usuario_id, string $usuario_nome): array|WP_Error
  {
    // Validação de tamanho
    if ($file['size'] > self::MAX_BYTES) {
      return new WP_Error('too_large', 'Arquivo muito grande. Máximo 3 MB.', ['status' => 400]);
    }

    // Validação de MIME real
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime  = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mime, self::ALLOWED, true)) {
      return new WP_Error('invalid_type', 'Tipo de arquivo não permitido.', ['status' => 400]);
    }

    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';

    $uploaded = wp_handle_upload($file, ['test_form' => false]);
    if (isset($uploaded['error'])) {
      return new WP_Error('upload_failed', $uploaded['error'], ['status' => 500]);
    }

    // Cria attachment no media library (opcional, mas permite gerenciar via WP admin)
    $attachment_id = wp_insert_attachment([
      'post_mime_type' => $uploaded['type'],
      'post_title'     => sanitize_file_name(pathinfo($file['name'], PATHINFO_FILENAME)),
      'post_status'    => 'inherit',
    ], $uploaded['file']);

    if (!is_wp_error($attachment_id)) {
      wp_update_attachment_metadata($attachment_id, wp_generate_attachment_metadata($attachment_id, $uploaded['file']));
    } else {
      $attachment_id = null;
    }

    global $wpdb;
    $wpdb->insert(self::table(), [
      'lead_id'       => $lead_id,
      'nome_original' => sanitize_file_name($file['name']),
      'mime_type'     => $mime,
      'tamanho'       => (int) $file['size'],
      'arquivo_url'   => $uploaded['url'],
      'attachment_id' => $attachment_id ?: null,
      'usuario_id'    => $usuario_id,
      'usuario_nome'  => $usuario_nome,
      'criado_em'     => current_time('mysql'),
    ]);

    return self::get((int) $wpdb->insert_id);
  }

  // ── Exclusão ──────────────────────────────────────────────────────────────

  public static function delete(int $id, int $lead_id, int $usuario_id, bool $is_admin): bool|WP_Error
  {
    global $wpdb;
    $row = self::get($id);

    if (!$row || $row['lead_id'] !== $lead_id) {
      return new WP_Error('not_found', 'Arquivo não encontrado.', ['status' => 404]);
    }
    if (!$is_admin && $row['usuario_id'] !== $usuario_id) {
      return new WP_Error('forbidden', 'Sem permissão para excluir este arquivo.', ['status' => 403]);
    }

    // Remove attachment e arquivo físico
    if ($row['attachment_id']) {
      wp_delete_attachment($row['attachment_id'], true);
    }

    $wpdb->delete(self::table(), ['id' => $id]);
    return true;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private static function get(int $id): array|null
  {
    global $wpdb;
    $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM " . self::table() . " WHERE id = %d", $id), ARRAY_A);
    return $row ? self::cast($row) : null;
  }

  private static function cast(array $row): array
  {
    return [
      'id'            => (int) $row['id'],
      'lead_id'       => (int) $row['lead_id'],
      'nome_original' => $row['nome_original'],
      'mime_type'     => $row['mime_type'],
      'tamanho'       => (int) $row['tamanho'],
      'arquivo_url'   => $row['arquivo_url'],
      'usuario_id'    => (int) $row['usuario_id'],
      'usuario_nome'  => $row['usuario_nome'],
      'criado_em'     => $row['criado_em'],
    ];
  }
}
