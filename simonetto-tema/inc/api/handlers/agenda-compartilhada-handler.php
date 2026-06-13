<?php
/**
 * Handler da Agenda Compartilhada da Loja
 *
 * Tabelas:
 *   wp_salas_reuniao         — salas cadastradas por loja
 *   wp_agenda_compartilhada  — eventos compartilhados da loja
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

class Agenda_Compartilhada_Handler
{
  private static function table_salas(): string
  {
    global $wpdb;
    return $wpdb->prefix . 'salas_reuniao';
  }

  private static function table_agenda(): string
  {
    global $wpdb;
    return $wpdb->prefix . 'agenda_compartilhada';
  }

  // ── Criação de tabelas ────────────────────────────────────────────────────

  public static function maybe_create_tables(): void
  {
    global $wpdb;
    $charset = $wpdb->get_charset_collate();

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';

    // Tabela de salas de reunião
    $ts = self::table_salas();
    dbDelta("CREATE TABLE IF NOT EXISTS {$ts} (
      id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      loja_id     BIGINT UNSIGNED NOT NULL,
      nome        VARCHAR(100)    NOT NULL,
      capacidade  INT UNSIGNED    NULL,
      descricao   TEXT            NULL,
      cor         VARCHAR(7)      NOT NULL DEFAULT '#3b82f6',
      ativo       TINYINT(1)      NOT NULL DEFAULT 1,
      criado_em   DATETIME        NOT NULL,
      PRIMARY KEY (id),
      KEY loja_id (loja_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 {$charset};");

    // Tabela de eventos compartilhados
    $ta = self::table_agenda();
    dbDelta("CREATE TABLE IF NOT EXISTS {$ta} (
      id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      loja_id       BIGINT UNSIGNED NOT NULL,
      sala_id       BIGINT UNSIGNED NULL,
      titulo        VARCHAR(255)    NOT NULL,
      descricao     TEXT            NULL,
      usuario_id    BIGINT UNSIGNED NOT NULL,
      usuario_nome  VARCHAR(255)    NOT NULL DEFAULT '',
      inicio        DATETIME        NOT NULL,
      fim           DATETIME        NULL,
      tipo          VARCHAR(50)     NOT NULL DEFAULT 'evento',
      cor           VARCHAR(7)      NOT NULL DEFAULT '#3b82f6',
      criado_em     DATETIME        NOT NULL,
      PRIMARY KEY (id),
      KEY loja_id (loja_id),
      KEY sala_id (sala_id),
      KEY inicio (inicio)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 {$charset};");
  }

  // ── Salas de Reunião ──────────────────────────────────────────────────────

  public static function list_salas(int $loja_id): array
  {
    global $wpdb;
    $table = self::table_salas();
    $rows  = $wpdb->get_results(
      $wpdb->prepare("SELECT * FROM {$table} WHERE loja_id = %d AND ativo = 1 ORDER BY nome ASC", $loja_id),
      ARRAY_A
    );
    return array_map([self::class, 'cast_sala'], $rows ?: []);
  }

  public static function create_sala(int $loja_id, array $data): array|WP_Error
  {
    global $wpdb;
    $nome = sanitize_text_field($data['nome'] ?? '');
    if (!$nome) return new WP_Error('invalid', 'Nome da sala é obrigatório.', ['status' => 400]);

    $wpdb->insert(self::table_salas(), [
      'loja_id'   => $loja_id,
      'nome'      => $nome,
      'capacidade'=> isset($data['capacidade']) ? (int) $data['capacidade'] : null,
      'descricao' => sanitize_textarea_field($data['descricao'] ?? ''),
      'cor'       => self::sanitize_color($data['cor'] ?? '#3b82f6'),
      'ativo'     => 1,
      'criado_em' => current_time('mysql'),
    ]);

    return self::get_sala((int) $wpdb->insert_id);
  }

  public static function update_sala(int $id, int $loja_id, array $data): array|WP_Error
  {
    global $wpdb;
    $table = self::table_salas();
    $sala  = self::get_sala($id);
    if (!$sala || $sala['loja_id'] !== $loja_id) {
      return new WP_Error('not_found', 'Sala não encontrada.', ['status' => 404]);
    }

    $fields = [];
    if (isset($data['nome']))       $fields['nome']       = sanitize_text_field($data['nome']);
    if (isset($data['capacidade'])) $fields['capacidade'] = (int) $data['capacidade'];
    if (isset($data['descricao']))  $fields['descricao']  = sanitize_textarea_field($data['descricao']);
    if (isset($data['cor']))        $fields['cor']        = self::sanitize_color($data['cor']);
    if (isset($data['ativo']))      $fields['ativo']      = (int) (bool) $data['ativo'];

    if ($fields) $wpdb->update($table, $fields, ['id' => $id]);
    return self::get_sala($id);
  }

  public static function delete_sala(int $id, int $loja_id): bool|WP_Error
  {
    global $wpdb;
    $sala = self::get_sala($id);
    if (!$sala || $sala['loja_id'] !== $loja_id) {
      return new WP_Error('not_found', 'Sala não encontrada.', ['status' => 404]);
    }
    // Soft-delete
    $wpdb->update(self::table_salas(), ['ativo' => 0], ['id' => $id]);
    return true;
  }

  private static function get_sala(int $id): array|null
  {
    global $wpdb;
    $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM " . self::table_salas() . " WHERE id = %d", $id), ARRAY_A);
    return $row ? self::cast_sala($row) : null;
  }

  private static function cast_sala(array $row): array
  {
    return [
      'id'         => (int) $row['id'],
      'loja_id'    => (int) $row['loja_id'],
      'nome'       => $row['nome'],
      'capacidade' => $row['capacidade'] !== null ? (int) $row['capacidade'] : null,
      'descricao'  => $row['descricao'],
      'cor'        => $row['cor'],
      'ativo'      => (bool) $row['ativo'],
      'criado_em'  => $row['criado_em'],
    ];
  }

  // ── Eventos da Agenda Compartilhada ───────────────────────────────────────

  public static function list_eventos(int $loja_id, int $year, int $month): array
  {
    global $wpdb;
    $ta   = self::table_agenda();
    $ts   = self::table_salas();
    $last = gmdate('t', mktime(0, 0, 0, $month, 1, $year));

    $from = sprintf('%04d-%02d-01 00:00:00', $year, $month);
    $to   = sprintf('%04d-%02d-%02d 23:59:59', $year, $month, $last);

    $rows = $wpdb->get_results($wpdb->prepare("
      SELECT a.*, s.nome AS sala_nome, s.cor AS sala_cor
      FROM {$ta} a
      LEFT JOIN {$ts} s ON s.id = a.sala_id
      WHERE a.loja_id = %d AND a.inicio BETWEEN %s AND %s
      ORDER BY a.inicio ASC
      LIMIT 500
    ", $loja_id, $from, $to), ARRAY_A);

    return array_map([self::class, 'cast_evento'], $rows ?: []);
  }

  public static function create_evento(int $loja_id, int $usuario_id, string $usuario_nome, array $data): array|WP_Error
  {
    global $wpdb;

    $titulo = sanitize_text_field($data['titulo'] ?? '');
    $inicio = sanitize_text_field($data['inicio'] ?? '');
    if (!$titulo) return new WP_Error('invalid', 'Título é obrigatório.', ['status' => 400]);
    if (!$inicio) return new WP_Error('invalid', 'Data de início é obrigatória.', ['status' => 400]);

    // Valida sala se informada
    $sala_id = isset($data['sala_id']) && $data['sala_id'] ? (int) $data['sala_id'] : null;
    if ($sala_id) {
      $sala = $wpdb->get_var($wpdb->prepare(
        "SELECT id FROM " . self::table_salas() . " WHERE id = %d AND loja_id = %d AND ativo = 1",
        $sala_id, $loja_id
      ));
      if (!$sala) return new WP_Error('invalid', 'Sala não encontrada para esta loja.', ['status' => 400]);
    }

    $wpdb->insert(self::table_agenda(), [
      'loja_id'      => $loja_id,
      'sala_id'      => $sala_id,
      'titulo'       => $titulo,
      'descricao'    => sanitize_textarea_field($data['descricao'] ?? ''),
      'usuario_id'   => $usuario_id,
      'usuario_nome' => $usuario_nome,
      'inicio'       => $inicio,
      'fim'          => isset($data['fim']) && $data['fim'] ? sanitize_text_field($data['fim']) : null,
      'tipo'         => self::sanitize_tipo($data['tipo'] ?? 'evento'),
      'cor'          => self::sanitize_color($data['cor'] ?? '#3b82f6'),
      'criado_em'    => current_time('mysql'),
    ]);

    return self::get_evento((int) $wpdb->insert_id);
  }

  public static function update_evento(int $id, int $loja_id, int $usuario_id, bool $is_admin, array $data): array|WP_Error
  {
    global $wpdb;
    $evento = self::get_evento($id);
    if (!$evento || $evento['loja_id'] !== $loja_id) {
      return new WP_Error('not_found', 'Evento não encontrado.', ['status' => 404]);
    }
    if (!$is_admin && $evento['usuario_id'] !== $usuario_id) {
      return new WP_Error('forbidden', 'Sem permissão para editar este evento.', ['status' => 403]);
    }

    $fields = [];
    if (isset($data['titulo']))    $fields['titulo']    = sanitize_text_field($data['titulo']);
    if (isset($data['descricao'])) $fields['descricao'] = sanitize_textarea_field($data['descricao']);
    if (isset($data['inicio']))    $fields['inicio']    = sanitize_text_field($data['inicio']);
    if (array_key_exists('fim', $data)) $fields['fim'] = $data['fim'] ? sanitize_text_field($data['fim']) : null;
    if (isset($data['tipo']))      $fields['tipo']      = self::sanitize_tipo($data['tipo']);
    if (isset($data['cor']))       $fields['cor']       = self::sanitize_color($data['cor']);
    if (array_key_exists('sala_id', $data)) {
      $fields['sala_id'] = $data['sala_id'] ? (int) $data['sala_id'] : null;
    }

    if ($fields) $wpdb->update(self::table_agenda(), $fields, ['id' => $id]);
    return self::get_evento($id);
  }

  public static function delete_evento(int $id, int $loja_id, int $usuario_id, bool $is_admin): bool|WP_Error
  {
    global $wpdb;
    $evento = self::get_evento($id);
    if (!$evento || $evento['loja_id'] !== $loja_id) {
      return new WP_Error('not_found', 'Evento não encontrado.', ['status' => 404]);
    }
    if (!$is_admin && $evento['usuario_id'] !== $usuario_id) {
      return new WP_Error('forbidden', 'Sem permissão para excluir este evento.', ['status' => 403]);
    }
    $wpdb->delete(self::table_agenda(), ['id' => $id]);
    return true;
  }

  private static function get_evento(int $id): array|null
  {
    global $wpdb;
    $ta = self::table_agenda();
    $ts = self::table_salas();
    $row = $wpdb->get_row($wpdb->prepare(
      "SELECT a.*, s.nome AS sala_nome, s.cor AS sala_cor
       FROM {$ta} a
       LEFT JOIN {$ts} s ON s.id = a.sala_id
       WHERE a.id = %d",
      $id
    ), ARRAY_A);
    return $row ? self::cast_evento($row) : null;
  }

  private static function cast_evento(array $row): array
  {
    return [
      'id'           => (int) $row['id'],
      'loja_id'      => (int) $row['loja_id'],
      'sala_id'      => $row['sala_id'] ? (int) $row['sala_id'] : null,
      'sala_nome'    => $row['sala_nome'] ?? null,
      'sala_cor'     => $row['sala_cor']  ?? null,
      'titulo'       => $row['titulo'],
      'descricao'    => $row['descricao'],
      'usuario_id'   => (int) $row['usuario_id'],
      'usuario_nome' => $row['usuario_nome'],
      'inicio'       => $row['inicio'],
      'fim'          => $row['fim'],
      'tipo'         => $row['tipo'],
      'cor'          => $row['cor'],
      'criado_em'    => $row['criado_em'],
    ];
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private static function sanitize_color(string $cor): string
  {
    return preg_match('/^#[0-9a-fA-F]{6}$/', $cor) ? $cor : '#3b82f6';
  }

  private static function sanitize_tipo(string $tipo): string
  {
    $allowed = ['evento', 'reuniao', 'treinamento', 'visita', 'outro'];
    return in_array($tipo, $allowed, true) ? $tipo : 'evento';
  }
}
