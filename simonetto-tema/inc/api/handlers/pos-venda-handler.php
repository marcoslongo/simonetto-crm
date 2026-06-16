<?php
/**
 * Handler de Pós-Venda
 *
 * Tabelas gerenciadas:
 *   wp_pos_vendas            — registros principais (1 por venda)
 *   wp_pos_venda_colunas     — colunas do kanban por loja
 *   wp_pos_venda_historico   — log de movimentações
 *   wp_pos_venda_notas       — anotações internas
 *   wp_pos_venda_assistencias — ocorrências de assistência técnica
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

class Pos_Venda_Handler
{
  const DEFAULT_COLUMNS = [
    ['slug' => 'medicao',             'label' => 'Medição',             'cor' => 'blue',    'ordem' => 0, 'fixo' => 1],
    ['slug' => 'executivo',           'label' => 'Executivo',           'cor' => 'indigo',  'ordem' => 1, 'fixo' => 1],
    ['slug' => 'fabricacao',          'label' => 'Fabricação',          'cor' => 'purple',  'ordem' => 2, 'fixo' => 1],
    ['slug' => 'entrega',             'label' => 'Entrega',             'cor' => 'teal',    'ordem' => 3, 'fixo' => 1],
    ['slug' => 'montagem',            'label' => 'Montagem',            'cor' => 'orange',  'ordem' => 4, 'fixo' => 1],
    ['slug' => 'pos_montagem',        'label' => 'Pós-Montagem',        'cor' => 'cyan',    'ordem' => 5, 'fixo' => 1],
    ['slug' => 'concluido',           'label' => 'Concluído',           'cor' => 'emerald', 'ordem' => 6, 'fixo' => 1],
    ['slug' => 'assistencia_tecnica', 'label' => 'Assistência Técnica', 'cor' => 'red',     'ordem' => 7, 'fixo' => 1],
  ];

  // ── helpers de tabela ─────────────────────────────────────────────────────
  private static function t_pv(): string   { global $wpdb; return $wpdb->prefix . 'pos_vendas'; }
  private static function t_col(): string  { global $wpdb; return $wpdb->prefix . 'pos_venda_colunas'; }
  private static function t_hist(): string { global $wpdb; return $wpdb->prefix . 'pos_venda_historico'; }
  private static function t_nota(): string { global $wpdb; return $wpdb->prefix . 'pos_venda_notas'; }
  private static function t_asst(): string { global $wpdb; return $wpdb->prefix . 'pos_venda_assistencias'; }

  // ── criação das tabelas ───────────────────────────────────────────────────
  public static function maybe_create_tables(): void
  {
    global $wpdb;
    $charset = $wpdb->get_charset_collate();
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';

    // pos_vendas
    dbDelta("CREATE TABLE IF NOT EXISTS " . self::t_pv() . " (
      id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      lead_id            BIGINT UNSIGNED NOT NULL,
      loja_id            BIGINT UNSIGNED NOT NULL,
      etapa              VARCHAR(100)    NOT NULL DEFAULT 'medicao',
      etapa_desde        DATETIME        NOT NULL,
      responsavel_id     BIGINT UNSIGNED NULL,
      responsavel_nome   VARCHAR(255)    NULL,
      criado_por_id      BIGINT UNSIGNED NULL,
      criado_por_nome    VARCHAR(255)    NULL,
      created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY lead_id (lead_id),
      KEY loja_id (loja_id),
      KEY etapa (etapa)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 {$charset};");

    // pos_venda_colunas
    dbDelta("CREATE TABLE IF NOT EXISTS " . self::t_col() . " (
      id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      loja_id   BIGINT UNSIGNED NOT NULL,
      slug      VARCHAR(100)    NOT NULL,
      label     VARCHAR(255)    NOT NULL,
      cor       VARCHAR(50)     NOT NULL DEFAULT 'blue',
      ordem     INT             NOT NULL DEFAULT 0,
      fixo      TINYINT(1)      NOT NULL DEFAULT 0,
      criado_em DATETIME        NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY loja_slug (loja_id, slug),
      KEY loja_id (loja_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 {$charset};");

    // pos_venda_historico
    dbDelta("CREATE TABLE IF NOT EXISTS " . self::t_hist() . " (
      id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      pos_venda_id    BIGINT UNSIGNED NOT NULL,
      etapa_anterior  VARCHAR(100)    NULL,
      etapa_nova      VARCHAR(100)    NOT NULL,
      usuario_id      BIGINT UNSIGNED NULL,
      usuario_nome    VARCHAR(255)    NULL,
      comentario      TEXT            NULL,
      created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY pos_venda_id (pos_venda_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 {$charset};");

    // pos_venda_notas
    dbDelta("CREATE TABLE IF NOT EXISTS " . self::t_nota() . " (
      id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      pos_venda_id BIGINT UNSIGNED NOT NULL,
      usuario_id   BIGINT UNSIGNED NULL,
      usuario_nome VARCHAR(255)    NULL,
      conteudo     TEXT            NOT NULL,
      created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY pos_venda_id (pos_venda_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 {$charset};");

    // pos_venda_assistencias
    dbDelta("CREATE TABLE IF NOT EXISTS " . self::t_asst() . " (
      id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      pos_venda_id     BIGINT UNSIGNED NOT NULL,
      status           VARCHAR(30)     NOT NULL DEFAULT 'aberta',
      descricao        TEXT            NOT NULL,
      solucao          TEXT            NULL,
      responsavel_id   BIGINT UNSIGNED NULL,
      responsavel_nome VARCHAR(255)    NULL,
      data_conclusao   DATETIME        NULL,
      created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY pos_venda_id (pos_venda_id),
      KEY status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 {$charset};");
  }

  // ── pos_vendas: CRUD ──────────────────────────────────────────────────────

  /**
   * Cria um registro de pós-venda para um lead. Idempotente — retorna existente se já criado.
   */
  public static function create(int $lead_id, int $loja_id, int $user_id, string $user_nome): array|WP_Error
  {
    global $wpdb;
    $table = self::t_pv();

    // Idempotência: retorna existente
    $existing = $wpdb->get_row(
      $wpdb->prepare("SELECT * FROM {$table} WHERE lead_id = %d", $lead_id),
      ARRAY_A
    );
    if ($existing) {
      return self::enrich($existing);
    }

    $first_col = self::get_columns($loja_id)[0]['slug'] ?? 'medicao';
    $now = current_time('mysql');

    $inserted = $wpdb->insert($table, [
      'lead_id'          => $lead_id,
      'loja_id'          => $loja_id,
      'etapa'            => $first_col,
      'etapa_desde'      => $now,
      'responsavel_id'   => $user_id ?: null,
      'responsavel_nome' => $user_nome ?: null,
      'criado_por_id'    => $user_id ?: null,
      'criado_por_nome'  => $user_nome ?: null,
      'created_at'       => $now,
      'updated_at'       => $now,
    ], ['%d', '%d', '%s', '%s', '%d', '%s', '%d', '%s', '%s', '%s']);

    if (!$inserted) {
      return new WP_Error('db_error', 'Erro ao criar pós-venda.', ['status' => 500]);
    }

    $pv_id = $wpdb->insert_id;

    self::add_historico($pv_id, null, $first_col, $user_id, $user_nome, 'Pós-venda criado.');

    $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id = %d", $pv_id), ARRAY_A);
    return self::enrich($row);
  }

  /**
   * Garante que todos os leads com status 'venda_realizada' nas lojas informadas
   * possuam um registro de pós-venda. Criação silenciosa e idempotente.
   */
  private static function sync_missing(array $loja_ids): void
  {
    global $wpdb;
    $t_pv   = self::t_pv();
    $t_lead = $wpdb->prefix . 'leads';

    $placeholders = implode(',', array_fill(0, count($loja_ids), '%d'));

    $missing = $wpdb->get_results(
      $wpdb->prepare(
        "SELECT l.id AS lead_id, l.loja_id
         FROM {$t_lead} l
         LEFT JOIN {$t_pv} pv ON pv.lead_id = l.id
         WHERE l.status = 'venda_realizada'
           AND l.loja_id IN ({$placeholders})
           AND pv.id IS NULL",
        ...$loja_ids
      ),
      ARRAY_A
    );

    foreach ($missing as $row) {
      self::create((int) $row['lead_id'], (int) $row['loja_id'], 0, 'Sistema');
    }
  }

  /**
   * Lista pós-vendas de um conjunto de lojas com dados enriquecidos (lead + venda).
   */
  public static function get_many(array $loja_ids, array $params = []): array
  {
    global $wpdb;

    if (empty($loja_ids)) return ['items' => [], 'total' => 0];

    // Sincroniza leads existentes em venda_realizada que ainda não têm pós-venda
    self::sync_missing($loja_ids);

    $placeholders = implode(',', array_fill(0, count($loja_ids), '%d'));

    $where     = "pv.loja_id IN ({$placeholders})";
    $bindings  = $loja_ids;

    // Filtro por vendedor (responsavel)
    if (!empty($params['responsavel_id'])) {
      $where    .= " AND pv.responsavel_id = %d";
      $bindings[] = intval($params['responsavel_id']);
    }

    // Filtro por etapa
    if (!empty($params['etapa'])) {
      $where    .= " AND pv.etapa = %s";
      $bindings[] = sanitize_text_field($params['etapa']);
    }

    // Busca por nome do cliente ou número do pedido
    if (!empty($params['search'])) {
      $s = '%' . $wpdb->esc_like($params['search']) . '%';
      $where    .= " AND (l.nome LIKE %s OR vr.numero_pedido LIKE %s)";
      $bindings[] = $s;
      $bindings[] = $s;
    }

    $t_pv   = self::t_pv();
    $t_nota = self::t_nota();
    $t_asst = self::t_asst();
    $t_lead = $wpdb->prefix . 'leads';
    $t_vr   = $wpdb->prefix . 'lead_venda_realizada';

    $sql = $wpdb->prepare(
      "SELECT
         pv.id, pv.lead_id, pv.loja_id, pv.etapa, pv.etapa_desde,
         pv.responsavel_id, pv.responsavel_nome,
         pv.criado_por_id, pv.criado_por_nome,
         pv.created_at, pv.updated_at,
         l.nome       AS lead_nome,
         l.telefone   AS lead_telefone,
         l.email      AS lead_email,
         l.cidade     AS lead_cidade,
         l.estado     AS lead_estado,
         vr.valor           AS venda_valor,
         vr.data_venda      AS venda_data_venda,
         vr.numero_pedido   AS venda_numero_pedido,
         vr.forma_pagamento AS venda_forma_pagamento,
         (SELECT COUNT(*) FROM {$t_asst} pa
          WHERE pa.pos_venda_id = pv.id
            AND pa.status NOT IN ('resolvida','encerrada')) AS assistencias_abertas
       FROM {$t_pv} pv
       LEFT JOIN {$t_lead} l   ON l.id = pv.lead_id
       LEFT JOIN {$t_vr}   vr  ON vr.lead_id = pv.lead_id
       WHERE {$where}
       ORDER BY pv.updated_at DESC",
      ...$bindings
    );

    $rows = $wpdb->get_results($sql, ARRAY_A);

    return [
      'items' => array_map([self::class, 'cast_pv'], $rows ?: []),
      'total' => count($rows ?: []),
    ];
  }

  /**
   * Busca um pós-venda por ID com todos os dados.
   */
  public static function get_by_id(int $id): ?array
  {
    global $wpdb;

    $t_pv   = self::t_pv();
    $t_lead = $wpdb->prefix . 'leads';
    $t_vr   = $wpdb->prefix . 'lead_venda_realizada';
    $t_asst = self::t_asst();

    $sql = $wpdb->prepare(
      "SELECT
         pv.id, pv.lead_id, pv.loja_id, pv.etapa, pv.etapa_desde,
         pv.responsavel_id, pv.responsavel_nome,
         pv.criado_por_id, pv.criado_por_nome,
         pv.created_at, pv.updated_at,
         l.nome       AS lead_nome,
         l.telefone   AS lead_telefone,
         l.email      AS lead_email,
         l.cidade     AS lead_cidade,
         l.estado     AS lead_estado,
         vr.valor           AS venda_valor,
         vr.data_venda      AS venda_data_venda,
         vr.numero_pedido   AS venda_numero_pedido,
         vr.forma_pagamento AS venda_forma_pagamento,
         vr.observacoes     AS venda_observacoes,
         vr.atendente_nome  AS venda_atendente_nome,
         (SELECT COUNT(*) FROM {$t_asst} pa
          WHERE pa.pos_venda_id = pv.id
            AND pa.status NOT IN ('resolvida','encerrada')) AS assistencias_abertas
       FROM {$t_pv} pv
       LEFT JOIN {$t_lead} l   ON l.id = pv.lead_id
       LEFT JOIN {$t_vr}   vr  ON vr.lead_id = pv.lead_id
       WHERE pv.id = %d",
      $id
    );

    $row = $wpdb->get_row($sql, ARRAY_A);
    if (!$row) return null;

    return self::cast_pv($row);
  }

  /**
   * Busca pós-venda pelo lead_id.
   */
  public static function get_by_lead(int $lead_id): ?array
  {
    global $wpdb;
    $row = $wpdb->get_row(
      $wpdb->prepare("SELECT * FROM " . self::t_pv() . " WHERE lead_id = %d", $lead_id),
      ARRAY_A
    );
    if (!$row) return null;
    return self::cast_pv($row);
  }

  /**
   * Atualiza a etapa de um pós-venda e registra no histórico.
   */
  public static function update_etapa(int $id, string $nova_etapa, int $user_id, string $user_nome, string $comentario = ''): bool|WP_Error
  {
    global $wpdb;
    $table = self::t_pv();

    $pv = $wpdb->get_row($wpdb->prepare("SELECT id, etapa, loja_id FROM {$table} WHERE id = %d", $id));
    if (!$pv) {
      return new WP_Error('not_found', 'Pós-venda não encontrado.', ['status' => 404]);
    }

    // Valida se a etapa existe para a loja
    $allowed = array_column(self::get_columns((int)$pv->loja_id), 'slug');
    if (!in_array($nova_etapa, $allowed, true)) {
      return new WP_Error('invalid_etapa', 'Etapa inválida.', ['status' => 400]);
    }

    $now = current_time('mysql');
    $wpdb->update(
      $table,
      ['etapa' => $nova_etapa, 'etapa_desde' => $now, 'updated_at' => $now],
      ['id' => $id],
      ['%s', '%s', '%s'],
      ['%d']
    );

    self::add_historico($id, $pv->etapa, $nova_etapa, $user_id, $user_nome, $comentario);

    return true;
  }

  /**
   * Atualiza o responsável de um pós-venda.
   */
  public static function update_responsavel(int $id, int $responsavel_id, string $responsavel_nome): bool
  {
    global $wpdb;
    $result = $wpdb->update(
      self::t_pv(),
      ['responsavel_id' => $responsavel_id, 'responsavel_nome' => $responsavel_nome],
      ['id' => $id],
      ['%d', '%s'],
      ['%d']
    );
    return $result !== false;
  }

  // ── colunas ───────────────────────────────────────────────────────────────

  public static function get_columns(int $loja_id): array
  {
    global $wpdb;
    $table = self::t_col();

    $count = (int) $wpdb->get_var(
      $wpdb->prepare("SELECT COUNT(*) FROM {$table} WHERE loja_id = %d", $loja_id)
    );

    if ($count === 0) {
      self::seed_columns_for_loja($loja_id);
    }

    $results = $wpdb->get_results(
      $wpdb->prepare(
        "SELECT id, loja_id, slug, label, cor, ordem, fixo FROM {$table}
         WHERE loja_id = %d ORDER BY ordem ASC, id ASC",
        $loja_id
      ),
      ARRAY_A
    );

    return array_map(function ($r) {
      $r['id']    = (int) $r['id'];
      $r['fixo']  = (int) $r['fixo'];
      $r['ordem'] = (int) $r['ordem'];
      return $r;
    }, $results ?: []);
  }

  public static function create_column(int $loja_id, string $label, string $cor, ?int $after_id = null): array|WP_Error
  {
    global $wpdb;
    $table = self::t_col();

    $label = sanitize_text_field(trim($label));
    if (empty($label)) {
      return new WP_Error('invalid_label', 'O nome da etapa não pode ser vazio.', ['status' => 400]);
    }

    $cores_validas = ['purple', 'indigo', 'teal', 'orange', 'pink', 'gray', 'violet', 'cyan', 'lime', 'yellow', 'blue', 'emerald', 'red'];
    $cor = in_array($cor, $cores_validas, true) ? $cor : 'gray';

    if ($after_id !== null) {
      $after_ordem = (int) $wpdb->get_var(
        $wpdb->prepare("SELECT ordem FROM {$table} WHERE id = %d AND loja_id = %d", $after_id, $loja_id)
      );
      $wpdb->query(
        $wpdb->prepare("UPDATE {$table} SET ordem = ordem + 1 WHERE loja_id = %d AND ordem > %d", $loja_id, $after_ordem)
      );
      $new_ordem = $after_ordem + 1;
    } else {
      $max = (int) $wpdb->get_var(
        $wpdb->prepare("SELECT COALESCE(MAX(ordem), -1) FROM {$table} WHERE loja_id = %d", $loja_id)
      );
      $new_ordem = $max + 1;
    }

    $inserted = $wpdb->insert($table, [
      'loja_id'   => $loja_id,
      'slug'      => '_temp',
      'label'     => $label,
      'cor'       => $cor,
      'ordem'     => $new_ordem,
      'fixo'      => 0,
      'criado_em' => current_time('mysql'),
    ], ['%d', '%s', '%s', '%s', '%d', '%d', '%s']);

    if (!$inserted) {
      return new WP_Error('db_error', 'Erro ao criar etapa.', ['status' => 500]);
    }

    $new_id = $wpdb->insert_id;
    $slug   = 'pv_' . $new_id;
    $wpdb->update($table, ['slug' => $slug], ['id' => $new_id], ['%s'], ['%d']);

    return ['id' => $new_id, 'loja_id' => $loja_id, 'slug' => $slug, 'label' => $label, 'cor' => $cor, 'ordem' => $new_ordem, 'fixo' => 0];
  }

  public static function move_column(int $id, int $loja_id, string $direction): bool|WP_Error
  {
    global $wpdb;
    $table = self::t_col();

    $current = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id = %d AND loja_id = %d", $id, $loja_id));
    if (!$current) return new WP_Error('not_found', 'Etapa não encontrada.', ['status' => 404]);

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

    if (!$neighbor) return new WP_Error('boundary', 'A etapa já está no limite.', ['status' => 400]);

    $wpdb->update($table, ['ordem' => (int)$neighbor->ordem], ['id' => $id], ['%d'], ['%d']);
    $wpdb->update($table, ['ordem' => $current_ordem], ['id' => $neighbor->id], ['%d'], ['%d']);

    return true;
  }

  public static function delete_column(int $id, int $loja_id): bool|WP_Error
  {
    global $wpdb;
    $table = self::t_col();

    $col = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id = %d AND loja_id = %d", $id, $loja_id));
    if (!$col) return new WP_Error('not_found', 'Etapa não encontrada.', ['status' => 404]);
    if ((int) $col->fixo === 1) return new WP_Error('forbidden', 'Etapas fixas não podem ser excluídas.', ['status' => 403]);

    $count = (int) $wpdb->get_var(
      $wpdb->prepare("SELECT COUNT(*) FROM " . self::t_pv() . " WHERE etapa = %s AND loja_id = %d", $col->slug, $loja_id)
    );
    if ($count > 0) {
      return new WP_Error('has_items', "Não é possível excluir: há {$count} projeto(s) nesta etapa.", ['status' => 409]);
    }

    $wpdb->delete($table, ['id' => $id], ['%d']);
    return true;
  }

  private static function seed_columns_for_loja(int $loja_id): void
  {
    global $wpdb;
    $table = self::t_col();
    $now   = current_time('mysql');

    foreach (self::DEFAULT_COLUMNS as $col) {
      $wpdb->query($wpdb->prepare(
        "INSERT IGNORE INTO {$table} (loja_id, slug, label, cor, ordem, fixo, criado_em)
         VALUES (%d, %s, %s, %s, %d, %d, %s)",
        $loja_id, $col['slug'], $col['label'], $col['cor'], $col['ordem'], $col['fixo'], $now
      ));
    }
  }

  // ── histórico ─────────────────────────────────────────────────────────────

  public static function get_historico(int $pos_venda_id): array
  {
    global $wpdb;
    $rows = $wpdb->get_results(
      $wpdb->prepare(
        "SELECT * FROM " . self::t_hist() . " WHERE pos_venda_id = %d ORDER BY created_at ASC",
        $pos_venda_id
      ),
      ARRAY_A
    );
    return array_map(function ($r) {
      $r['id']           = (int) $r['id'];
      $r['pos_venda_id'] = (int) $r['pos_venda_id'];
      $r['usuario_id']   = $r['usuario_id'] ? (int) $r['usuario_id'] : null;
      return $r;
    }, $rows ?: []);
  }

  public static function add_historico(int $pos_venda_id, ?string $etapa_anterior, string $etapa_nova, int $user_id, string $user_nome, string $comentario = ''): void
  {
    global $wpdb;
    $wpdb->insert(self::t_hist(), [
      'pos_venda_id'   => $pos_venda_id,
      'etapa_anterior' => $etapa_anterior,
      'etapa_nova'     => $etapa_nova,
      'usuario_id'     => $user_id ?: null,
      'usuario_nome'   => $user_nome ?: null,
      'comentario'     => $comentario ?: null,
      'created_at'     => current_time('mysql'),
    ], ['%d', '%s', '%s', '%d', '%s', '%s', '%s']);
  }

  // ── notas ─────────────────────────────────────────────────────────────────

  public static function get_notas(int $pos_venda_id): array
  {
    global $wpdb;
    $rows = $wpdb->get_results(
      $wpdb->prepare(
        "SELECT * FROM " . self::t_nota() . " WHERE pos_venda_id = %d ORDER BY created_at ASC",
        $pos_venda_id
      ),
      ARRAY_A
    );
    return array_map(function ($r) {
      $r['id']           = (int) $r['id'];
      $r['pos_venda_id'] = (int) $r['pos_venda_id'];
      $r['usuario_id']   = $r['usuario_id'] ? (int) $r['usuario_id'] : null;
      return $r;
    }, $rows ?: []);
  }

  public static function add_nota(int $pos_venda_id, string $conteudo, int $user_id, string $user_nome): array|WP_Error
  {
    global $wpdb;
    $conteudo = sanitize_textarea_field(trim($conteudo));
    if (empty($conteudo)) {
      return new WP_Error('empty_content', 'A anotação não pode ser vazia.', ['status' => 400]);
    }

    $wpdb->insert(self::t_nota(), [
      'pos_venda_id' => $pos_venda_id,
      'usuario_id'   => $user_id ?: null,
      'usuario_nome' => $user_nome ?: null,
      'conteudo'     => $conteudo,
      'created_at'   => current_time('mysql'),
    ], ['%d', '%d', '%s', '%s', '%s']);

    $id = $wpdb->insert_id;
    return [
      'id'           => $id,
      'pos_venda_id' => $pos_venda_id,
      'usuario_id'   => $user_id ?: null,
      'usuario_nome' => $user_nome ?: null,
      'conteudo'     => $conteudo,
      'created_at'   => current_time('mysql'),
    ];
  }

  public static function delete_nota(int $nota_id, int $user_id, bool $is_gerente): bool|WP_Error
  {
    global $wpdb;
    $nota = $wpdb->get_row($wpdb->prepare("SELECT * FROM " . self::t_nota() . " WHERE id = %d", $nota_id));
    if (!$nota) return new WP_Error('not_found', 'Anotação não encontrada.', ['status' => 404]);
    if (!$is_gerente && (int) $nota->usuario_id !== $user_id) {
      return new WP_Error('forbidden', 'Sem permissão para excluir esta anotação.', ['status' => 403]);
    }
    $wpdb->delete(self::t_nota(), ['id' => $nota_id], ['%d']);
    return true;
  }

  // ── assistências técnicas ─────────────────────────────────────────────────

  public static function get_assistencias(int $pos_venda_id): array
  {
    global $wpdb;
    $rows = $wpdb->get_results(
      $wpdb->prepare(
        "SELECT * FROM " . self::t_asst() . " WHERE pos_venda_id = %d ORDER BY created_at DESC",
        $pos_venda_id
      ),
      ARRAY_A
    );
    return array_map(function ($r) {
      $r['id']           = (int) $r['id'];
      $r['pos_venda_id'] = (int) $r['pos_venda_id'];
      $r['responsavel_id'] = $r['responsavel_id'] ? (int) $r['responsavel_id'] : null;
      return $r;
    }, $rows ?: []);
  }

  public static function create_assistencia(int $pos_venda_id, array $data, int $user_id, string $user_nome): array|WP_Error
  {
    global $wpdb;

    $descricao = sanitize_textarea_field(trim($data['descricao'] ?? ''));
    if (empty($descricao)) {
      return new WP_Error('empty_descricao', 'A descrição é obrigatória.', ['status' => 400]);
    }

    $status_validos = ['aberta', 'em_atendimento', 'aguardando_cliente', 'resolvida', 'encerrada'];
    $status = in_array($data['status'] ?? '', $status_validos, true) ? $data['status'] : 'aberta';

    $now = current_time('mysql');
    $wpdb->insert(self::t_asst(), [
      'pos_venda_id'     => $pos_venda_id,
      'status'           => $status,
      'descricao'        => $descricao,
      'solucao'          => !empty($data['solucao']) ? sanitize_textarea_field($data['solucao']) : null,
      'responsavel_id'   => !empty($data['responsavel_id']) ? intval($data['responsavel_id']) : ($user_id ?: null),
      'responsavel_nome' => !empty($data['responsavel_nome']) ? sanitize_text_field($data['responsavel_nome']) : ($user_nome ?: null),
      'data_conclusao'   => !empty($data['data_conclusao']) ? sanitize_text_field($data['data_conclusao']) : null,
      'created_at'       => $now,
      'updated_at'       => $now,
    ], ['%d', '%s', '%s', '%s', '%d', '%s', '%s', '%s', '%s']);

    $id = $wpdb->insert_id;
    $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM " . self::t_asst() . " WHERE id = %d", $id), ARRAY_A);
    $row['id']           = (int) $row['id'];
    $row['pos_venda_id'] = (int) $row['pos_venda_id'];
    $row['responsavel_id'] = $row['responsavel_id'] ? (int) $row['responsavel_id'] : null;
    return $row;
  }

  public static function update_assistencia(int $aid, array $data, int $user_id): bool|WP_Error
  {
    global $wpdb;
    $table = self::t_asst();

    $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id = %d", $aid));
    if (!$row) return new WP_Error('not_found', 'Assistência não encontrada.', ['status' => 404]);

    $status_validos = ['aberta', 'em_atendimento', 'aguardando_cliente', 'resolvida', 'encerrada'];
    $updates = ['updated_at' => current_time('mysql')];

    if (!empty($data['status']) && in_array($data['status'], $status_validos, true)) {
      $updates['status'] = $data['status'];
    }
    if (isset($data['solucao'])) {
      $updates['solucao'] = sanitize_textarea_field($data['solucao']);
    }
    if (isset($data['descricao']) && trim($data['descricao'])) {
      $updates['descricao'] = sanitize_textarea_field($data['descricao']);
    }
    if (!empty($data['data_conclusao'])) {
      $updates['data_conclusao'] = sanitize_text_field($data['data_conclusao']);
    }
    if (!empty($data['responsavel_id'])) {
      $updates['responsavel_id']   = intval($data['responsavel_id']);
      $updates['responsavel_nome'] = sanitize_text_field($data['responsavel_nome'] ?? '');
    }

    $wpdb->update($table, $updates, ['id' => $aid]);
    return true;
  }

  // ── helpers internos ──────────────────────────────────────────────────────

  private static function enrich(array $row): array
  {
    return self::cast_pv($row);
  }

  private static function cast_pv(array $row): array
  {
    $row['id']               = (int) $row['id'];
    $row['lead_id']          = (int) $row['lead_id'];
    $row['loja_id']          = (int) $row['loja_id'];
    $row['responsavel_id']   = $row['responsavel_id'] ? (int) $row['responsavel_id'] : null;
    $row['criado_por_id']    = $row['criado_por_id']  ? (int) $row['criado_por_id']  : null;
    $row['assistencias_abertas'] = isset($row['assistencias_abertas']) ? (int) $row['assistencias_abertas'] : null;
    $row['venda_valor']      = isset($row['venda_valor']) && $row['venda_valor'] !== null ? floatval($row['venda_valor']) : null;
    return $row;
  }
}
