<?php
/**
 * Handler de Renders Realistas
 *
 * Tabela: wp_loja_renders
 *   id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
 *   loja_id          BIGINT UNSIGNED NOT NULL
 *   usuario_id       BIGINT UNSIGNED NOT NULL
 *   usuario_nome     VARCHAR(255) NOT NULL DEFAULT ''
 *   titulo           VARCHAR(255) NULL
 *   prompt_usado     TEXT NULL
 *   imagem_original  VARCHAR(500) NULL
 *   imagem_resultado VARCHAR(500) NULL
 *   criado_em        DATETIME NOT NULL
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

class Render_Handler
{
  private static function table(): string
  {
    global $wpdb;
    return $wpdb->prefix . 'loja_renders';
  }

  public static function maybe_create_table(): void
  {
    global $wpdb;
    $table   = self::table();
    $charset = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS {$table} (
      id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      loja_id          BIGINT UNSIGNED NOT NULL,
      usuario_id       BIGINT UNSIGNED NOT NULL,
      usuario_nome     VARCHAR(255)    NOT NULL DEFAULT '',
      titulo           VARCHAR(255)    NULL,
      prompt_usado     TEXT            NULL,
      imagem_original  VARCHAR(500)    NULL,
      imagem_resultado VARCHAR(500)    NULL,
      criado_em        DATETIME        NOT NULL,
      PRIMARY KEY (id),
      KEY loja_id (loja_id),
      KEY criado_em (criado_em)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 {$charset};";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql);
  }

  public static function list_by_loja(int $loja_id, int $limit = 50): array
  {
    global $wpdb;
    $rows = $wpdb->get_results($wpdb->prepare(
      "SELECT * FROM " . self::table() . " WHERE loja_id = %d ORDER BY criado_em DESC LIMIT %d",
      $loja_id,
      $limit
    ), ARRAY_A);

    return array_map([self::class, 'format'], $rows ?? []);
  }

  public static function create(array $params): array|WP_Error
  {
    global $wpdb;

    $loja_id = isset($params['loja_id']) ? (int) $params['loja_id'] : 0;
    if (!$loja_id) {
      return new WP_Error('missing_loja', 'loja_id é obrigatório.', ['status' => 400]);
    }

    $user      = wp_get_current_user();
    $user_id   = (int) $user->ID;
    $user_nome = $user->display_name ?: $user->user_login;

    $titulo  = isset($params['titulo']) && $params['titulo'] !== ''
      ? sanitize_text_field($params['titulo'])
      : null;
    $prompt  = isset($params['prompt_usado']) && $params['prompt_usado'] !== ''
      ? sanitize_textarea_field($params['prompt_usado'])
      : null;

    $original_url  = null;
    $resultado_url = null;

    if (!empty($params['imagem_original_base64'])) {
      $original_url = self::save_base64_image($params['imagem_original_base64']);
    }

    if (!empty($params['imagem_resultado_base64'])) {
      $resultado_url = self::save_base64_image($params['imagem_resultado_base64']);
    }

    $wpdb->insert(self::table(), [
      'loja_id'          => $loja_id,
      'usuario_id'       => $user_id,
      'usuario_nome'     => $user_nome,
      'titulo'           => $titulo,
      'prompt_usado'     => $prompt,
      'imagem_original'  => $original_url,
      'imagem_resultado' => $resultado_url,
      'criado_em'        => current_time('mysql'),
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

  public static function delete(int $id): bool|WP_Error
  {
    global $wpdb;

    $row = $wpdb->get_row($wpdb->prepare(
      "SELECT * FROM " . self::table() . " WHERE id = %d",
      $id
    ), ARRAY_A);

    if (!$row) {
      return new WP_Error('not_found', 'Render não encontrado.', ['status' => 404]);
    }

    $user_id = (int) wp_get_current_user()->ID;
    if ((int) $row['usuario_id'] !== $user_id && !current_user_can('manage_options')) {
      return new WP_Error('forbidden', 'Sem permissão para excluir este render.', ['status' => 403]);
    }

    $wpdb->delete(self::table(), ['id' => $id], ['%d']);
    return true;
  }

  /**
   * Decodifica e salva uma imagem base64 na pasta de uploads do WordPress.
   * Retorna a URL pública do arquivo salvo, ou null em caso de falha.
   */
  private static function save_base64_image(string $base64): ?string
  {
    $base64 = preg_replace('#^data:image/\w+;base64,#i', '', $base64);
    $data   = base64_decode($base64, true);

    if (!$data) return null;

    $upload_dir = wp_upload_dir();
    $subdir     = 'renders/' . date('Y/m');
    $dir        = $upload_dir['basedir'] . '/' . $subdir;

    wp_mkdir_p($dir);

    $filename = wp_unique_filename($dir, uniqid('render_', true) . '.png');
    $filepath = $dir . '/' . $filename;

    if (file_put_contents($filepath, $data) === false) return null;

    return $upload_dir['baseurl'] . '/' . $subdir . '/' . $filename;
  }

  private static function format(array $row): array
  {
    return [
      'id'               => (int) $row['id'],
      'loja_id'          => (int) $row['loja_id'],
      'usuario_id'       => (int) $row['usuario_id'],
      'usuario_nome'     => $row['usuario_nome'],
      'titulo'           => $row['titulo'] ?? null,
      'prompt_usado'     => $row['prompt_usado'] ?? null,
      'imagem_original'  => $row['imagem_original'] ?? null,
      'imagem_resultado' => $row['imagem_resultado'] ?? null,
      'criado_em'        => $row['criado_em'],
    ];
  }
}
