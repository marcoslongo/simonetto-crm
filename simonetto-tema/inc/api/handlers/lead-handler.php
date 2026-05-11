<?php
/**
 * Handler de Leads - Lógica de negócio
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

class Lead_Handler
{
  const STATUS_ALLOWED = [
    'nao_atendido',
    'em_negociacao',
    'venda_realizada',
    'venda_nao_realizada',
  ];

  const CLASSIFICACAO_ALLOWED = [
    'frio',
    'morno',
    'quente',
  ];

  // -------------------------------------------------------------------------
  // CLASSIFICAÇÃO
  // -------------------------------------------------------------------------

  /**
   * Calcula score e classificação de um lead.
   *
   * Filosofia:
   *  - Frio   (0–19)  : preencheu o formulário e só isso, sem contexto real
   *  - Morno (20–54)  : demonstra interesse, tem algum contexto de projeto
   *  - Quente (55–100): projeto definido, múltiplos ambientes ou alta intenção
   *
   * Email e telefone NÃO pontuam — são campos obrigatórios do form, viram ruído.
   * Investimento atua como multiplicador final, não como soma fixa.
   *
   * @param  array $lead  Dados do lead (mesmos campos da tabela wp_leads).
   * @return array{ score: int, classificacao: string, motivos: string[] }
   */
  public static function calcular_classificacao(array $lead): array
  {
    $score   = 0;
    $motivos = [];

    // =========================================================================
    // 🛍️ INTERESSE — campo do formulário (ex: "cozinha, dormitorio, banheiro")
    // É o sinal mais confiável de escopo quando não há mensagem.
    // =========================================================================
    $interesse_raw = strtolower(trim($lead['interesse'] ?? ''));

    if (!empty($interesse_raw)) {
      // "completo" = casa toda, vale mais do que 1 ambiente avulso
      $tem_completo = strpos($interesse_raw, 'completo') !== false;

      // Conta ambientes individuais (exclui a palavra "completo" da contagem)
      $ambientes_form = array_filter(
        array_map('trim', explode(',', $interesse_raw)),
        fn($v) => $v !== 'completo' && $v !== ''
      );
      $qtd_ambientes_form = count($ambientes_form);

      if ($tem_completo && $qtd_ambientes_form >= 3) {
        // Casa completa + listou ambientes específicos = projeto grande definido
        $score   += 30;
        $motivos[] = 'Projeto completo com múltiplos ambientes selecionados';
      } elseif ($tem_completo || $qtd_ambientes_form >= 4) {
        $score   += 22;
        $motivos[] = 'Projeto amplo: casa completa ou 4+ ambientes';
      } elseif ($qtd_ambientes_form >= 2) {
        $score   += 14;
        $motivos[] = "Múltiplos ambientes selecionados ({$qtd_ambientes_form})";
      } elseif ($qtd_ambientes_form === 1) {
        $score   += 6;
        $motivos[] = 'Ambiente específico selecionado';
      }
    }

    // =========================================================================
    // 💬 MENSAGEM — análise de intenção, escopo e maturidade do lead
    // =========================================================================
    $mensagem = trim($lead['mensagem'] ?? '');

    if (!empty($mensagem)) {
      $msg      = strtolower($mensagem);
      $palavras = count(array_filter(preg_split('/\s+/', trim($msg))));

      // -----------------------------------------------------------------------
      // 1. TAMANHO — proxy de engajamento. Escala progressiva de 4 níveis.
      //    Abaixo de 8 palavras = só preencheu pra passar, não pontua.
      // -----------------------------------------------------------------------
      if ($palavras >= 80) {
        $score   += 25;
        $motivos[] = 'Mensagem muito detalhada';
      } elseif ($palavras >= 40) {
        $score   += 18;
        $motivos[] = 'Mensagem longa e detalhada';
      } elseif ($palavras >= 20) {
        $score   += 10;
        $motivos[] = 'Mensagem moderadamente detalhada';
      } elseif ($palavras >= 8) {
        $score   += 4;
        $motivos[] = 'Mensagem curta';
      }

      // -----------------------------------------------------------------------
      // 2. AMBIENTES NA MENSAGEM — reforça ou complementa o campo interesse
      //    (lead pode listar ambientes no texto mesmo sem usar o campo)
      // -----------------------------------------------------------------------
      $ambientes_msg = [
        'quarto', 'cozinha', 'lavanderia', 'varanda', 'banheiro',
        'sala', 'escritório', 'escritorio', 'closet', 'entrada',
        'área de serviço', 'area de serviço', 'home office',
        'suíte', 'suite', 'garagem', 'corredor', 'lavabo',
        'sala de jantar', 'hall',
      ];
      $ambientes_encontrados = [];
      foreach ($ambientes_msg as $amb) {
        if (strpos($msg, $amb) !== false && !in_array($amb, $ambientes_encontrados)) {
          $ambientes_encontrados[] = $amb;
        }
      }
      $qtd_amb_msg = count($ambientes_encontrados);

      if ($qtd_amb_msg >= 4) {
        $score   += 20;
        $motivos[] = "Múltiplos ambientes na mensagem ({$qtd_amb_msg})";
      } elseif ($qtd_amb_msg >= 2) {
        $score   += 10;
        $motivos[] = "Ambientes descritos na mensagem ({$qtd_amb_msg})";
      }
      // 1 ambiente na mensagem não pontua — já capturado pelo campo interesse

      // -----------------------------------------------------------------------
      // 3. ESPECIFICIDADE TÉCNICA — sabe o que quer, já pesquisou
      //    Alta especificidade = funil muito avançado, pronto para orçar
      // -----------------------------------------------------------------------
      $termos_tecnicos = [
        'embutir', 'embutido', 'embutida', 'vitrificado', 'ripado',
        'montessoriana', 'gaveteiro', 'coifa', 'frigobar', 'led', 'leds',
        'baú', 'bau', 'cristaleira', 'puxador', 'organizador',
        'buffet', 'aparador', 'painel', 'nicho', 'adega',
        'basculante', 'soft close', 'corrediça', 'corredica',
        'tampo', 'mdf', 'lacado', 'laminado', 'espelhado',
        'fosco', 'porta de correr', 'porta oculta', 'ilha',
        'tanque embutido', 'cabideiro', 'penteadeira', 'torre quente',
        'lava louça', 'lava louca', 'cook top', 'cooktop',
      ];
      $tecnico_count = 0;
      foreach ($termos_tecnicos as $termo) {
        if (strpos($msg, $termo) !== false) {
          $tecnico_count++;
        }
      }

      if ($tecnico_count >= 5) {
        $score   += 22;
        $motivos[] = "Alta especificidade técnica ({$tecnico_count} termos)";
      } elseif ($tecnico_count >= 3) {
        $score   += 14;
        $motivos[] = "Especificidade técnica moderada ({$tecnico_count} termos)";
      } elseif ($tecnico_count >= 1) {
        $score   += 6;
        $motivos[] = 'Alguns termos técnicos mencionados';
      }

      // -----------------------------------------------------------------------
      // 4. INTENÇÃO DE COMPRA / ORÇAMENTO — sinal direto de conversão
      // -----------------------------------------------------------------------
      $intencao_compra = [
        'quero comprar', 'quero adquirir', 'quero contratar',
        'tenho interesse', 'fechar', 'vamos fechar', 'já decidi',
        'orçamento', 'cotação', 'proposta', 'urgente',
      ];
      foreach ($intencao_compra as $termo) {
        if (strpos($msg, $termo) !== false) {
          $score   += 15;
          $motivos[] = 'Solicita orçamento ou demonstra intenção de compra';
          break;
        }
      }

      // -----------------------------------------------------------------------
      // 5. INTERESSE EM PREÇO/CONDIÇÕES — meio do funil
      // -----------------------------------------------------------------------
      $interesse_preco = ['preço', 'valor', 'quanto custa', 'condições', 'parcel', 'financ'];
      foreach ($interesse_preco as $termo) {
        if (strpos($msg, $termo) !== false) {
          $score   += 8;
          $motivos[] = 'Interesse em preço/condições';
          break;
        }
      }

      // -----------------------------------------------------------------------
      // 6. URGÊNCIA TEMPORAL — sinal de timing favorável
      // -----------------------------------------------------------------------
      $urgencia = ['hoje', 'essa semana', 'rápido', 'quanto antes', 'logo', 'urgente', 'imediato'];
      foreach ($urgencia as $termo) {
        if (strpos($msg, $termo) !== false) {
          $score   += 8;
          $motivos[] = 'Urgência temporal indicada';
          break;
        }
      }
    }

    // =========================================================================
    // 📍 LOCALIZAÇÃO — mesma cidade da loja (facilita visita ao showroom)
    // =========================================================================
    if (
      !empty($lead['cidade']) &&
      !empty($lead['loja_cidade']) &&
      strtolower(trim($lead['cidade'])) === strtolower(trim($lead['loja_cidade']))
    ) {
      $score   += 6;
      $motivos[] = 'Mesma cidade da loja';
    }

    // =========================================================================
    // 💰 INVESTIMENTO — multiplicador aplicado sobre o score bruto
    //
    // Valores possíveis: 35-50k | 50-100k | 100-150k | 150-200k | acima-250k
    //
    // Não soma direto pois inflava leads pobres em contexto.
    // Funciona como amplificador: leads bons ficam ainda melhores,
    // leads sem contexto continuam baixos mesmo com alto investimento.
    // =========================================================================
    $multiplicador = 1.0;

    if (!empty($lead['expectativa_investimento'])) {
      $inv = strtolower($lead['expectativa_investimento']);

      if (strpos($inv, 'acima') !== false) {
        $multiplicador = 1.5;
        $motivos[]     = 'Investimento acima de R$250k (×1.5)';
      } elseif (strpos($inv, '150') !== false || strpos($inv, '200') !== false) {
        $multiplicador = 1.35;
        $motivos[]     = 'Alto investimento esperado (×1.35)';
      } elseif (strpos($inv, '100') !== false) {
        $multiplicador = 1.2;
        $motivos[]     = 'Investimento médio-alto esperado (×1.2)';
      } elseif (strpos($inv, '50') !== false) {
        $multiplicador = 1.1;
        $motivos[]     = 'Investimento médio esperado (×1.1)';
      }
      // 35-50k = multiplicador neutro (1.0), não penaliza nem bonifica
    }

    // Aplica multiplicador e limita a 100
    $score = (int) round(min($score * $multiplicador, 100));

    // =========================================================================
    // CLASSIFICAÇÃO FINAL
    // =========================================================================
    if ($score >= 55) {
      $classificacao = 'quente';
    } elseif ($score >= 20) {
      $classificacao = 'morno';
    } else {
      $classificacao = 'frio';
    }

    return [
      'score'         => $score,
      'classificacao' => $classificacao,
      'motivos'       => $motivos,
    ];
  }

  // -------------------------------------------------------------------------
  // CRUD
  // -------------------------------------------------------------------------

  /**
   * Criar novo lead
   */
  public static function create($params)
  {
    global $wpdb;

    if (empty($params['nome']) || empty($params['email']) || empty($params['telefone'])) {
      return new WP_Error('missing_fields', 'Nome, email e telefone são obrigatórios.', ['status' => 400]);
    }

    if (!is_email($params['email'])) {
      return new WP_Error('invalid_email', 'E-mail inválido.', ['status' => 400]);
    }

    $loja_id     = null;
    $loja_cidade = null;

    if (!empty($params['loja_id'])) {
      $loja_id = intval($params['loja_id']);
      $loja    = get_post($loja_id);

      if (!$loja || $loja->post_type !== 'lojas') {
        return new WP_Error('invalid_store', 'Loja inválida ou não encontrada.', ['status' => 400]);
      }

      $loja_cidade = get_field('cidade', $loja_id);
    }

    // Calcula classificação antes de inserir
    $classificacao_result = self::calcular_classificacao([
      'interesse'                => $params['interesse']                ?? null,
      'expectativa_investimento' => $params['expectativa_investimento'] ?? null,
      'mensagem'                 => $params['mensagem']                 ?? null,
      'cidade'                   => $params['cidade']                   ?? null,
      'loja_cidade'              => $loja_cidade,
    ]);

    $table_name = $wpdb->prefix . 'leads';

    $dados = [
      'nome'                     => sanitize_text_field($params['nome']),
      'email'                    => sanitize_email($params['email']),
      'telefone'                 => sanitize_text_field($params['telefone']),
      'cidade'                   => isset($params['cidade'])                   ? sanitize_text_field($params['cidade'])          : null,
      'estado'                   => isset($params['estado'])                   ? sanitize_text_field($params['estado'])          : null,
      'interesse'                => isset($params['interesse'])                ? sanitize_text_field($params['interesse'])       : null,
      'expectativa_investimento' => isset($params['expectativa_investimento']) ? sanitize_text_field($params['expectativa_investimento']) : null,
      'loja_regiao'              => isset($params['loja_regiao'])              ? sanitize_text_field($params['loja_regiao'])     : null,
      'mensagem'                 => isset($params['mensagem'])                 ? sanitize_textarea_field($params['mensagem'])   : null,
      'pipefy_card_id'           => isset($params['pipefy_card_id'])           ? sanitize_text_field($params['pipefy_card_id']) : null,
      'loja_id'                  => $loja_id,
      'status'                   => 'nao_atendido',
      'classificacao'            => $classificacao_result['classificacao'],
      'score'                    => $classificacao_result['score'],
      'data_criacao'             => current_time('mysql'),
      'data_atualizacao'         => current_time('mysql'),
    ];

    $resultado = $wpdb->insert($table_name, $dados);

    if ($resultado === false) {
      return new WP_Error('db_error', 'Erro ao inserir lead no banco de dados.', ['status' => 500]);
    }

    $lead_id = $wpdb->insert_id;

    $email_enviado = false;
    if ($loja_id) {
      $email_enviado = mytheme_enviar_email_para_loja($lead_id, $loja_id, $dados);
    }

    // Salva tracking automaticamente se algum campo UTM vier no payload
    $tracking_fields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'referrer', 'landing_page', 'user_agent'];
    $tracking_params = array_intersect_key($params, array_flip($tracking_fields));

    if (!empty(array_filter($tracking_params))) {
      Lead_Tracking_Handler::save($lead_id, $tracking_params);
    }

    return [
      'lead_id'       => $lead_id,
      'email_enviado' => $email_enviado,
      'dados'         => $dados,
    ];
  }

  /**
   * Listar leads com paginação e filtros
   */
  public static function list($args = [])
  {
    global $wpdb;

    $table_name = $wpdb->prefix . 'leads';

    $page     = max(1, intval($args['page'] ?? 1));
    $per_page = intval($args['per_page'] ?? 20);
    $offset   = ($page - 1) * $per_page;
    $email    = $args['email'] ?? '';
    $loja_id  = $args['loja_id'] ?? 0;
    $search   = $args['search'] ?? '';
    $from     = $args['from'] ?? '';
    $to       = $args['to'] ?? '';
    $status   = $args['status'] ?? '';

    $where_clauses  = [];
    $prepare_values = [];

    if ($email) {
      $where_clauses[]  = "l.email LIKE %s";
      $prepare_values[] = '%' . $wpdb->esc_like($email) . '%';
    }

    if ($loja_id) {
      $where_clauses[]  = "l.loja_id = %d";
      $prepare_values[] = intval($loja_id);
    }

    if ($search) {
      $search_term      = '%' . $wpdb->esc_like($search) . '%';
      $where_clauses[]  = "(l.nome LIKE %s OR l.email LIKE %s OR l.telefone LIKE %s OR l.cidade LIKE %s)";
      $prepare_values[] = $search_term;
      $prepare_values[] = $search_term;
      $prepare_values[] = $search_term;
      $prepare_values[] = $search_term;
    }

    if ($from) {
      $where_clauses[]  = "l.data_criacao >= %s";
      $prepare_values[] = sanitize_text_field($from) . ' 00:00:00';
    }

    if ($to) {
      $where_clauses[]  = "l.data_criacao <= %s";
      $prepare_values[] = sanitize_text_field($to) . ' 23:59:59';
    }

    if ($status && in_array($status, self::STATUS_ALLOWED, true)) {
      $where_clauses[]  = "l.status = %s";
      $prepare_values[] = $status;
    }

    $where_sql = !empty($where_clauses)
      ? 'WHERE ' . implode(' AND ', $where_clauses)
      : '';

    $count_values = $prepare_values;

    $query_values   = $prepare_values;
    $query_values[] = $per_page;
    $query_values[] = $offset;

    $leads = $wpdb->get_results($wpdb->prepare(
      "SELECT l.*
       FROM {$table_name} l
       {$where_sql}
       ORDER BY l.data_criacao DESC
       LIMIT %d OFFSET %d",
      ...$query_values
    ), ARRAY_A);

    foreach ($leads as &$lead) {
      $lead = self::_format_lead($lead);
    }

    $total = $wpdb->get_var($wpdb->prepare(
      "SELECT COUNT(DISTINCT l.id) FROM {$table_name} l {$where_sql}",
      ...$count_values
    ));

    return [
      'leads'       => $leads,
      'total'       => (int) $total,
      'page'        => $page,
      'per_page'    => $per_page,
      'total_pages' => (int) ceil($total / $per_page),
    ];
  }

  /**
   * Buscar lead por ID
   */
  public static function get_by_id($id)
  {
    global $wpdb;

    $lead = $wpdb->get_row($wpdb->prepare(
      "SELECT * FROM {$wpdb->prefix}leads WHERE id = %d",
      $id
    ), ARRAY_A);

    if (!$lead) {
      return null;
    }

    return self::_format_lead($lead, true);
  }

  /**
   * Registrar contato com lead
   */
  public static function register_contact($params)
  {
    global $wpdb;

    if (empty($params['lead_id'])) {
      return new WP_Error('missing_lead', 'Lead não informado.', ['status' => 400]);
    }

    $lead = $wpdb->get_row($wpdb->prepare(
      "SELECT loja_id FROM {$wpdb->prefix}leads WHERE id = %d",
      intval($params['lead_id'])
    ));

    if (!$lead) {
      return new WP_Error('lead_not_found', 'Lead não encontrado.', ['status' => 404]);
    }

    $result = $wpdb->insert($wpdb->prefix . 'leads_actions', [
      'lead_id'      => intval($params['lead_id']),
      'tipo_contato' => sanitize_text_field($params['tipo_contato']),
      'usuario_id'   => intval($params['usuario_id'] ?? 0),
      'observacao'   => sanitize_textarea_field($params['observacao'] ?? ''),
      'criado_em'    => current_time('mysql'),
    ]);

    if ($result === false) {
      return new WP_Error('db_error', 'Erro ao registrar contato.', ['status' => 500]);
    }

    return true;
  }

  /**
   * Excluir lead e suas ações vinculadas
   */
  public static function delete($id)
  {
    global $wpdb;

    $table_leads   = $wpdb->prefix . 'leads';
    $table_actions = $wpdb->prefix . 'leads_actions';

    $lead = $wpdb->get_row($wpdb->prepare(
      "SELECT id FROM {$table_leads} WHERE id = %d",
      $id
    ));

    if (!$lead) {
      return new WP_Error('lead_not_found', 'Lead não encontrado.', ['status' => 404]);
    }

    $wpdb->delete($table_actions, ['lead_id' => $id], ['%d']);

    $resultado = $wpdb->delete($table_leads, ['id' => $id], ['%d']);

    if ($resultado === false) {
      return new WP_Error('db_error', 'Erro ao excluir lead do banco de dados.', ['status' => 500]);
    }

    return true;
  }

  /**
   * Atualizar loja do lead
   */
  public static function update_loja($id, $params)
  {
    global $wpdb;

    $table_leads = $wpdb->prefix . 'leads';

    $lead_row = $wpdb->get_row($wpdb->prepare(
      "SELECT * FROM {$table_leads} WHERE id = %d",
      $id
    ), ARRAY_A);

    if (!$lead_row) {
      return new WP_Error('lead_not_found', 'Lead não encontrado.', ['status' => 404]);
    }

    $loja_id     = isset($params['loja_id']) ? intval($params['loja_id']) : null;
    $loja_cidade = null;

    if ($loja_id) {
      $loja = get_post($loja_id);
      if (!$loja || $loja->post_type !== 'lojas') {
        return new WP_Error('invalid_store', 'Loja inválida ou não encontrada.', ['status' => 400]);
      }
      $loja_cidade = get_field('cidade', $loja_id);
    }

    // Recalcula classificação com a nova loja
    $classificacao_result = self::calcular_classificacao([
      'interesse'                => $lead_row['interesse'],
      'expectativa_investimento' => $lead_row['expectativa_investimento'],
      'mensagem'                 => $lead_row['mensagem'],
      'cidade'                   => $lead_row['cidade'],
      'loja_cidade'              => $loja_cidade,
    ]);

    $resultado = $wpdb->update(
      $table_leads,
      [
        'loja_id'          => $loja_id,
        'classificacao'    => $classificacao_result['classificacao'],
        'score'            => $classificacao_result['score'],
        'data_atualizacao' => current_time('mysql'),
      ],
      ['id' => $id],
      ['%s', '%s', '%d', '%s'],
      ['%d']
    );

    if ($resultado === false) {
      return new WP_Error('db_error', 'Erro ao atualizar lead.', ['status' => 500]);
    }

    return self::get_by_id($id);
  }

  /**
   * Atualizar status do lead (Kanban)
   * Não recalcula classificação — status é uma mudança manual, não de dados.
   */
  public static function update_status($id, $status)
  {
    global $wpdb;

    if (!in_array($status, self::STATUS_ALLOWED, true)) {
      return new WP_Error(
        'invalid_status',
        'Status inválido. Valores aceitos: ' . implode(', ', self::STATUS_ALLOWED),
        ['status' => 400]
      );
    }

    $table_leads = $wpdb->prefix . 'leads';

    $lead = $wpdb->get_row($wpdb->prepare(
      "SELECT id FROM {$table_leads} WHERE id = %d",
      $id
    ));

    if (!$lead) {
      return new WP_Error('lead_not_found', 'Lead não encontrado.', ['status' => 404]);
    }

    $resultado = $wpdb->update(
      $table_leads,
      [
        'status'           => $status,
        'data_atualizacao' => current_time('mysql'),
      ],
      ['id' => $id],
      ['%s', '%s'],
      ['%d']
    );

    if ($resultado === false) {
      return new WP_Error('db_error', 'Erro ao atualizar status do lead.', ['status' => 500]);
    }

    return self::get_by_id($id);
  }

  // -------------------------------------------------------------------------
  // HELPERS PRIVADOS
  // -------------------------------------------------------------------------

  /**
   * Formata um array bruto do banco para o formato de resposta da API.
   *
   * @param  array $lead       Linha crua do $wpdb.
   * @param  bool  $full       Se true, inclui campos extras da loja (endereço, telefone).
   * @return array
   */
  private static function _format_lead(array $lead, bool $full = false): array
  {
    $lead['id']             = (string) $lead['id'];
    $lead['loja_id']        = $lead['loja_id'] ? (string) $lead['loja_id'] : null;
    $lead['status']         = $lead['status']         ?? 'nao_atendido';
    $lead['classificacao']  = $lead['classificacao']  ?? 'frio';
    $lead['score']          = isset($lead['score']) ? (int) $lead['score'] : 0;

    if ($lead['loja_id']) {
      $loja_id = intval($lead['loja_id']);
      $loja    = get_post($loja_id);

      if ($loja) {
        $lead['loja_nome']   = $loja->post_title;
        $lead['loja_cidade'] = get_field('cidade', $loja_id);
        $lead['loja_estado'] = get_field('estado', $loja_id);

        if ($full) {
          $lead['loja_endereco'] = get_field('endereco', $loja_id);
          $lead['loja_telefone'] = get_field('telefone', $loja_id);
        }
      } else {
        $lead['loja_nome']   = 'Loja não encontrada';
        $lead['loja_cidade'] = '';
        $lead['loja_estado'] = '';
      }
    } else {
      $lead['loja_nome']   = '';
      $lead['loja_cidade'] = '';
      $lead['loja_estado'] = '';
    }

    return $lead;
  }
}