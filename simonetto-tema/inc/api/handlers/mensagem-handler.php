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

    $has_media = !empty($params['metadata']['media_url']) || !empty($params['media_url']);
    if (empty($params['lead_id']) || (empty($params['conteudo']) && !$has_media)) {
      return new WP_Error('missing_fields', 'lead_id e conteudo são obrigatórios.', ['status' => 400]);
    }
    if (empty($params['conteudo']) && $has_media) {
      $params['conteudo'] = '[Mídia]';
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
  // BUSCAR usuario_id pelo nome/ID da instância Evolution API (user_meta)
  // -------------------------------------------------------------------------

  public static function find_user_by_instance(string $instance): ?int
  {
    global $wpdb;

    $user_id = $wpdb->get_var($wpdb->prepare(
      "SELECT user_id FROM {$wpdb->usermeta}
       WHERE meta_key = '_evolution_instance' AND meta_value = %s
       LIMIT 1",
      $instance
    ));

    return $user_id ? intval($user_id) : null;
  }

  // -------------------------------------------------------------------------
  // BUSCAR qualquer usuário com instância configurada (fallback de webhook)
  // -------------------------------------------------------------------------

  public static function find_any_configured_user(): ?int
  {
    global $wpdb;

    $user_id = $wpdb->get_var(
      "SELECT user_id FROM {$wpdb->usermeta}
       WHERE meta_key = '_evolution_instance' AND meta_value != ''
       LIMIT 1"
    );

    return $user_id ? intval($user_id) : null;
  }

  // -------------------------------------------------------------------------
  // BUSCAR qualquer loja que tenha instância configurada (legado — mantido)
  // -------------------------------------------------------------------------

  public static function find_any_configured_loja(): ?int
  {
    global $wpdb;

    $loja_id = $wpdb->get_var(
      "SELECT post_id FROM {$wpdb->postmeta}
       WHERE meta_key = '_evolution_instance' AND meta_value != ''
       LIMIT 1"
    );

    return $loja_id ? intval($loja_id) : null;
  }

  // -------------------------------------------------------------------------
  // BUSCAR loja_id pelo nome da instância (legado — mantido)
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

    // Gera variações para cobrir diferentes formatos de cadastro
    $variants = [$digits];
    $len = strlen($digits);

    if ($len === 13 && str_starts_with($digits, '55')) {
      $sem55 = substr($digits, 2);          // 11 dígitos: 46 9xxxx-xxxx
      $variants[] = $sem55;
      // Sem o 9 extra: 10 dígitos (55 + DDD + 8)
      if (strlen($sem55) === 11 && $sem55[2] === '9') {
        $variants[] = substr($sem55, 0, 2) . substr($sem55, 3); // remove o 9
        $variants[] = '55' . substr($sem55, 0, 2) . substr($sem55, 3);
      }
    } elseif ($len === 12 && str_starts_with($digits, '55')) {
      // 55 + DDD + 8 dígitos (sem 9 extra) — ex: 554691222763
      $sem55 = substr($digits, 2);          // 10 dígitos
      $variants[] = $sem55;
      $variants[] = '55' . substr($sem55, 0, 2) . '9' . substr($sem55, 2); // adiciona 9
      $variants[] = substr($sem55, 0, 2) . '9' . substr($sem55, 2);        // DDD + 9 + número
    } elseif ($len === 11) {
      $variants[] = '55' . $digits;
      // Sem o 9 extra: 10 dígitos
      if ($digits[2] === '9') {
        $variants[] = substr($digits, 0, 2) . substr($digits, 3);
        $variants[] = '55' . substr($digits, 0, 2) . substr($digits, 3);
      }
    } elseif ($len === 10) {
      $variants[] = '55' . $digits;
      $variants[] = substr($digits, 0, 2) . '9' . substr($digits, 2);
      $variants[] = '55' . substr($digits, 0, 2) . '9' . substr($digits, 2);
    }

    foreach ($variants as $variant) {
      $id = $wpdb->get_var($wpdb->prepare(
        "SELECT id FROM {$wpdb->prefix}leads WHERE REPLACE(REPLACE(REPLACE(REPLACE(telefone,'(',''),')',''),' ',''),'-','') LIKE %s LIMIT 1",
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
