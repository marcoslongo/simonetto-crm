<?php
/**
 * Handler de Mensagens - Lógica de negócio
 * Gerencia mensagens de atendimento via WhatsApp (Meta Cloud API)
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

class Mensagem_Handler
{
  // -------------------------------------------------------------------------
  // LISTAR mensagens de um lead
  // -------------------------------------------------------------------------

  public static function list_by_lead(int $lead_id): array
  {
    global $wpdb;

    $table = $wpdb->prefix . 'mensagens';

    $rows = $wpdb->get_results($wpdb->prepare(
      "SELECT * FROM {$table}
       WHERE lead_id = %d
       ORDER BY criado_em ASC",
      $lead_id
    ), ARRAY_A);

    return array_map([self::class, 'format_row'], $rows ?? []);
  }

  // -------------------------------------------------------------------------
  // CRIAR mensagem (salvar no banco)
  // -------------------------------------------------------------------------

  public static function create(array $params): array|WP_Error
  {
    global $wpdb;

    if (empty($params['lead_id']) || empty($params['conteudo'])) {
      return new WP_Error('missing_fields', 'lead_id e conteudo são obrigatórios.', ['status' => 400]);
    }

    $direcao_allowed = ['enviada', 'recebida'];
    $direcao = $params['direcao'] ?? 'enviada';
    if (!in_array($direcao, $direcao_allowed, true)) {
      return new WP_Error('invalid_direction', 'Direção inválida.', ['status' => 400]);
    }

    $dados = [
      'lead_id'    => intval($params['lead_id']),
      'loja_id'    => !empty($params['loja_id'])    ? intval($params['loja_id'])    : null,
      'usuario_id' => !empty($params['usuario_id']) ? intval($params['usuario_id']) : null,
      'conteudo'   => sanitize_textarea_field($params['conteudo']),
      'direcao'    => $direcao,
      'canal'      => sanitize_text_field($params['canal'] ?? 'whatsapp'),
      'status'     => sanitize_text_field($params['status'] ?? 'enviada'),
      'wamid'      => !empty($params['wamid']) ? sanitize_text_field($params['wamid']) : null,
      'criado_em'  => current_time('mysql'),
      'atualizado_em' => current_time('mysql'),
      'metadata'   => !empty($params['metadata']) ? json_encode($params['metadata']) : null,
    ];

    $result = $wpdb->insert($wpdb->prefix . 'mensagens', $dados);

    if ($result === false) {
      return new WP_Error('db_error', 'Erro ao salvar mensagem.', ['status' => 500]);
    }

    $id = $wpdb->insert_id;
    $row = $wpdb->get_row(
      $wpdb->prepare("SELECT * FROM {$wpdb->prefix}mensagens WHERE id = %d", $id),
      ARRAY_A
    );

    return self::format_row($row);
  }

  // -------------------------------------------------------------------------
  // ATUALIZAR status pelo wamid (chamado pelo webhook de status da Meta)
  // -------------------------------------------------------------------------

  public static function update_status(string $wamid, string $status): bool
  {
    global $wpdb;

    $result = $wpdb->update(
      $wpdb->prefix . 'mensagens',
      [
        'status'       => sanitize_text_field($status),
        'atualizado_em' => current_time('mysql'),
      ],
      ['wamid' => $wamid],
      ['%s', '%s'],
      ['%s']
    );

    return $result !== false;
  }

  // -------------------------------------------------------------------------
  // BUSCAR loja_id pelo nome da instância Evolution API
  // -------------------------------------------------------------------------

  public static function find_loja_by_instance(string $instance): ?int
  {
    global $wpdb;

    $loja_id = $wpdb->get_var($wpdb->prepare(
      "SELECT post_id FROM {$wpdb->postmeta}
       WHERE meta_key = '_evolution_instance' AND meta_value = %s
       LIMIT 1",
      $instance
    ));

    return $loja_id ? intval($loja_id) : null;
  }

  // -------------------------------------------------------------------------
  // BUSCAR lead_id pelo telefone (para vincular mensagem recebida)
  // -------------------------------------------------------------------------

  public static function find_lead_by_phone(string $telefone): ?int
  {
    global $wpdb;

    // Normaliza: mantém só dígitos
    $digits = preg_replace('/\D/', '', $telefone);

    // Tenta com e sem código do país (55)
    $variants = [$digits];
    if (strlen($digits) === 13 && str_starts_with($digits, '55')) {
      $variants[] = substr($digits, 2); // remove 55
    } elseif (strlen($digits) === 11) {
      $variants[] = '55' . $digits;    // adiciona 55
    }

    foreach ($variants as $variant) {
      $id = $wpdb->get_var($wpdb->prepare(
        "SELECT id FROM {$wpdb->prefix}leads WHERE REPLACE(REPLACE(REPLACE(telefone,'(',''),')',''),' ','') LIKE %s LIMIT 1",
        '%' . $wpdb->esc_like($variant) . '%'
      ));
      if ($id) return intval($id);
    }

    // Fallback: busca pelo último remetente já registrado na tabela de mensagens
    $lead_id = $wpdb->get_var($wpdb->prepare(
      "SELECT lead_id FROM {$wpdb->prefix}mensagens
       WHERE JSON_EXTRACT(metadata, '$.from') = %s
       ORDER BY criado_em DESC LIMIT 1",
      $digits
    ));

    return $lead_id ? intval($lead_id) : null;
  }

  // -------------------------------------------------------------------------
  // FORMATAR linha do banco para retorno da API
  // -------------------------------------------------------------------------

  private static function format_row(array $row): array
  {
    return [
      'id'            => intval($row['id']),
      'lead_id'       => intval($row['lead_id']),
      'loja_id'       => $row['loja_id'] ? intval($row['loja_id']) : null,
      'usuario_id'    => $row['usuario_id'] ? intval($row['usuario_id']) : null,
      'conteudo'      => $row['conteudo'],
      'direcao'       => $row['direcao'],
      'canal'         => $row['canal'],
      'status'        => $row['status'],
      'wamid'         => $row['wamid'],
      'criado_em'     => $row['criado_em'],
      'atualizado_em' => $row['atualizado_em'],
      'metadata'      => $row['metadata'] ? json_decode($row['metadata'], true) : null,
    ];
  }
}
