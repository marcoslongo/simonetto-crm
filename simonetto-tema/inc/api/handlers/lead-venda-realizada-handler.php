<?php
/**
 * Handler de Venda Realizada
 *
 * Tabela: wp_lead_venda_realizada
 *   id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
 *   lead_id          BIGINT UNSIGNED NOT NULL UNIQUE
 *   valor            DECIMAL(12,2)   NULL
 *   data_venda       DATE            NULL
 *   forma_pagamento  VARCHAR(50)     NULL
 *   numero_pedido    VARCHAR(100)    NULL
 *   numero_nf        VARCHAR(20)     NULL
 *   serie_nf         VARCHAR(10)     NULL
 *   chave_acesso_nf  VARCHAR(44)     NULL
 *   link_nf          TEXT            NULL
 *   observacoes      TEXT            NULL
 *   atendente_id     BIGINT UNSIGNED NULL
 *   atendente_nome   VARCHAR(255)    NULL
 *   created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
 *   updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

class Lead_Venda_Realizada_Handler
{
  private static function table(): string
  {
    global $wpdb;
    return $wpdb->prefix . 'lead_venda_realizada';
  }

  public static function maybe_create_table(): void
  {
    global $wpdb;
    $table   = self::table();
    $charset = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS {$table} (
      id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      lead_id          BIGINT UNSIGNED NOT NULL,
      valor            DECIMAL(12,2)   NULL,
      data_venda       DATE            NULL,
      forma_pagamento  VARCHAR(50)     NULL,
      numero_pedido    VARCHAR(100)    NULL,
      numero_nf        VARCHAR(20)     NULL,
      serie_nf         VARCHAR(10)     NULL,
      chave_acesso_nf  VARCHAR(44)     NULL,
      link_nf          TEXT            NULL,
      observacoes      TEXT            NULL,
      atendente_id     BIGINT UNSIGNED NULL,
      atendente_nome   VARCHAR(255)    NULL,
      created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY lead_id (lead_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 {$charset};";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql);
  }

  public static function get_by_lead(int $lead_id): ?array
  {
    global $wpdb;
    $row = $wpdb->get_row(
      $wpdb->prepare("SELECT * FROM " . self::table() . " WHERE lead_id = %d", $lead_id),
      ARRAY_A
    );

    if (!$row) return null;

    return self::cast_row($row);
  }

  public static function upsert(int $lead_id, array $data, int $user_id, string $user_nome): bool
  {
    global $wpdb;
    $table = self::table();

    $row = [
      'valor'           => isset($data['valor']) && $data['valor'] !== null && $data['valor'] !== '' ? floatval($data['valor']) : null,
      'data_venda'      => !empty($data['data_venda']) ? sanitize_text_field($data['data_venda']) : null,
      'forma_pagamento' => !empty($data['forma_pagamento']) ? sanitize_text_field($data['forma_pagamento']) : null,
      'numero_pedido'   => !empty($data['numero_pedido']) ? sanitize_text_field($data['numero_pedido']) : null,
      'numero_nf'       => !empty($data['numero_nf']) ? sanitize_text_field($data['numero_nf']) : null,
      'serie_nf'        => !empty($data['serie_nf']) ? sanitize_text_field($data['serie_nf']) : null,
      'chave_acesso_nf' => !empty($data['chave_acesso_nf']) ? sanitize_text_field($data['chave_acesso_nf']) : null,
      'link_nf'         => !empty($data['link_nf']) ? esc_url_raw($data['link_nf']) : null,
      'observacoes'     => !empty($data['observacoes']) ? sanitize_textarea_field($data['observacoes']) : null,
      'atendente_id'    => $user_id ?: null,
      'atendente_nome'  => $user_nome ?: null,
      'updated_at'      => current_time('mysql'),
    ];

    $existing_id = $wpdb->get_var(
      $wpdb->prepare("SELECT id FROM {$table} WHERE lead_id = %d", $lead_id)
    );

    if ($existing_id) {
      $result = $wpdb->update($table, $row, ['lead_id' => $lead_id]);
    } else {
      $row['lead_id']    = $lead_id;
      $row['created_at'] = current_time('mysql');
      $result = $wpdb->insert($table, $row);
    }

    return $result !== false && !$wpdb->last_error;
  }

  public static function delete_by_lead(int $lead_id): bool
  {
    global $wpdb;
    $result = $wpdb->delete(self::table(), ['lead_id' => $lead_id], ['%d']);
    return $result !== false;
  }

  private static function cast_row(array $row): array
  {
    $row['id']            = (int) $row['id'];
    $row['lead_id']       = (int) $row['lead_id'];
    $row['valor']         = $row['valor'] !== null ? floatval($row['valor']) : null;
    $row['atendente_id']  = $row['atendente_id'] ? (int) $row['atendente_id'] : null;
    return $row;
  }
}
