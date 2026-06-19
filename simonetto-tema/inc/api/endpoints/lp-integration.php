<?php
/**
 * Endpoints de Integração LP
 *
 * Permite que lojas integrem suas Landing Pages externas enviando
 * leads diretamente para o CRM via token único por loja.
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

add_action('rest_api_init', function () {

  // POST /api/v1/lp/{token} — recebe lead de LP externa (público)
  register_rest_route('api/v1', '/lp/(?P<token>[a-f0-9]{48})', [
    'methods'             => 'POST',
    'callback'            => 'mytheme_api_lp_receive_lead',
    'permission_callback' => '__return_true',
  ]);

  // GET /api/v1/lp/{token}/leads — consulta leads da loja via token (público)
  register_rest_route('api/v1', '/lp/(?P<token>[a-f0-9]{48})/leads', [
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_lp_get_leads',
    'permission_callback' => '__return_true',
  ]);

  // GET /api/v1/lojas/{id}/integration — retorna token e snippet (autenticado)
  register_rest_route('api/v1', '/lojas/(?P<id>\d+)/integration', [
    'methods'             => 'GET',
    'callback'            => 'mytheme_api_get_loja_integration',
    'permission_callback' => 'mytheme_api_is_authenticated',
  ]);

  // POST /api/v1/lojas/{id}/generate-token — gera/regenera token (somente admin)
  register_rest_route('api/v1', '/lojas/(?P<id>\d+)/generate-token', [
    'methods'             => 'POST',
    'callback'            => 'mytheme_api_generate_loja_token',
    'permission_callback' => 'mytheme_api_is_administrator',
  ]);
});

/**
 * POST /api/v1/lp/{token}
 *
 * Recebe um lead enviado pela LP da loja.
 * Valida o token, identifica a loja e cria o lead normalmente.
 */
function mytheme_api_lp_receive_lead(WP_REST_Request $request)
{
  $token = sanitize_text_field($request['token']);
  $loja  = Loja_Handler::get_by_token($token);

  if (!$loja) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'Token de integração inválido.',
    ], 401);
  }

  $params = json_decode($request->get_body(), true);

  if (!is_array($params)) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'Corpo da requisição inválido. Envie JSON.',
    ], 400);
  }

  // Injeta loja_id automaticamente — a LP não precisa conhecer o ID interno
  $params['loja_id'] = $loja->ID;

  // Lead que chega via LP do lojista é sempre "próprio" da loja
  $params['origem'] = 'proprio';

  // Captura loja_regiao pelo nome da loja se não vier no payload
  if (empty($params['loja_regiao'])) {
    $params['loja_regiao'] = $loja->post_title;
  }

  $result = Lead_Handler::create($params);

  if (is_wp_error($result)) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => $result->get_error_message(),
    ], $result->get_error_data()['status'] ?? 400);
  }

  return new WP_REST_Response([
    'success'  => true,
    'lead_id'  => $result['lead_id'],
    'mensagem' => 'Lead recebido com sucesso.',
  ], 201);
}

/**
 * GET /api/v1/lojas/{id}/integration
 *
 * Retorna token atual, URL do endpoint e snippet JS para embed na LP.
 */
function mytheme_api_get_loja_integration(WP_REST_Request $request)
{
  $loja_id = (int) $request['id'];
  $loja    = get_post($loja_id);

  if (!$loja || $loja->post_type !== 'lojas') {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'Loja não encontrada.',
    ], 404);
  }

  $token    = Loja_Handler::get_integration_token($loja_id);
  $endpoint = $token
    ? rest_url("api/v1/lp/{$token}")
    : null;

  $snippet = $token
    ? mytheme_lp_build_snippet($endpoint)
    : null;

  return new WP_REST_Response([
    'success'  => true,
    'token'    => $token,
    'endpoint' => $endpoint,
    'snippet'  => $snippet,
  ], 200);
}

/**
 * POST /api/v1/lojas/{id}/generate-token
 *
 * Gera (ou regenera) o token de integração da loja.
 * Somente administradores podem chamar este endpoint.
 */
function mytheme_api_generate_loja_token(WP_REST_Request $request)
{
  $loja_id = (int) $request['id'];
  $loja    = get_post($loja_id);

  if (!$loja || $loja->post_type !== 'lojas') {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'Loja não encontrada.',
    ], 404);
  }

  $token    = Loja_Handler::generate_integration_token($loja_id);
  $endpoint = rest_url("api/v1/lp/{$token}");
  $snippet  = mytheme_lp_build_snippet($endpoint);

  return new WP_REST_Response([
    'success'  => true,
    'token'    => $token,
    'endpoint' => $endpoint,
    'snippet'  => $snippet,
    'mensagem' => 'Token gerado com sucesso.',
  ], 201);
}

/**
 * GET /api/v1/lp/{token}/leads
 *
 * Retorna leads paginados da loja identificada pelo token.
 * Parâmetros opcionais: status, from (YYYY-MM-DD), to (YYYY-MM-DD),
 *                       page (padrão 1), per_page (padrão 50, máx 200)
 */
function mytheme_api_lp_get_leads(WP_REST_Request $request): WP_REST_Response
{
  $token = sanitize_text_field($request['token']);
  $loja  = Loja_Handler::get_by_token($token);

  if (!$loja) {
    return new WP_REST_Response([
      'success'  => false,
      'mensagem' => 'Token de integração inválido.',
    ], 401);
  }

  $loja_id  = (int) $loja->ID;
  $page     = max(1, (int) ($request->get_param('page')     ?? 1));
  $per_page = min(200, max(1, (int) ($request->get_param('per_page') ?? 50)));

  $status = sanitize_text_field($request->get_param('status') ?? '');
  $valid_statuses = ['nao_atendido', 'em_negociacao', 'venda_realizada', 'venda_nao_realizada'];
  if (!in_array($status, $valid_statuses, true)) $status = '';

  $from = sanitize_text_field($request->get_param('from') ?? '');
  $to   = sanitize_text_field($request->get_param('to')   ?? '');

  // Reutiliza Lead_Handler::list() — mesma query usada internamente, testada em produção
  $result = Lead_Handler::list([
    'loja_id'  => $loja_id,
    'page'     => $page,
    'per_page' => $per_page,
    'status'   => $status,
    'from'     => $from,
    'to'       => $to,
  ]);

  // Campos públicos expostos externamente
  $public_fields = [
    'id', 'nome', 'email', 'telefone', 'status', 'classificacao',
    'cidade', 'estado', 'interesse', 'expectativa_investimento',
    'mensagem', 'utm_source', 'utm_medium', 'utm_campaign',
    'data_criacao',
  ];

  $data = array_map(function ($lead) use ($public_fields) {
    $out = array_intersect_key($lead, array_flip($public_fields));
    $out['etiquetas'] = array_map(
      fn($e) => ['nome' => $e['nome'], 'cor' => $e['cor']],
      $lead['etiquetas'] ?? []
    );
    return $out;
  }, $result['leads']);

  return new WP_REST_Response([
    'success'     => true,
    'loja'        => $loja->post_title,
    'total'       => $result['total'],
    'page'        => $result['page'],
    'per_page'    => $result['per_page'],
    'total_pages' => $result['total_pages'],
    'data'        => $data,
  ], 200);
}

/**
 * Gera o snippet JS que a loja cola na sua LP.
 *
 * O snippet expõe window.SimonettoCRM.enviarLead(dados) que:
 * - Captura UTM params e referrer automaticamente
 * - Faz POST para o endpoint exclusivo da loja
 * - Retorna uma Promise com a resposta da API
 */
function mytheme_lp_build_snippet(string $endpoint): string
{
  return <<<JS
<!-- Simonetto CRM — Integração LP -->
<script>
(function () {
  var ENDPOINT = '{$endpoint}';

  function getTracking() {
    var p = new URLSearchParams(window.location.search);
    return {
      utm_source:   p.get('utm_source')   || '',
      utm_medium:   p.get('utm_medium')   || '',
      utm_campaign: p.get('utm_campaign') || '',
      utm_content:  p.get('utm_content')  || '',
      utm_term:     p.get('utm_term')     || '',
      referrer:     document.referrer     || '',
      landing_page: window.location.href
    };
  }

  window.SimonettoCRM = {
    /**
     * Envia um lead para o CRM.
     *
     * @param {Object} dados - Campos do lead
     * @param {string} dados.nome       - Nome completo (obrigatório)
     * @param {string} dados.email      - E-mail (obrigatório)
     * @param {string} dados.telefone   - Telefone (obrigatório)
     * @param {string} [dados.cidade]
     * @param {string} [dados.estado]
     * @param {string} [dados.interesse]              - Ex: "cozinha, quarto"
     * @param {string} [dados.expectativa_investimento] - Ex: "50-100k"
     * @param {string} [dados.mensagem]
     * @returns {Promise}
     */
    enviarLead: function (dados) {
      var payload = Object.assign({}, dados, getTracking());
      return fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json(); });
    }
  };
})();
</script>
<!-- Fim Simonetto CRM -->
JS;
}
