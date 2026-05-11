<?php
/**
 * Handler de Lead Tracking - Lógica de negócio
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

class Lead_Tracking_Handler
{
  /**
   * Registrar/atualizar dados de rastreamento para um lead
   * Garante unicidade por lead (UNIQUE KEY unique_lead)
   */
  public static function save($lead_id, $params = [], $request = null)
  {
    global $wpdb;

    $lead_id = intval($lead_id);

    if (!$lead_id) {
      return new WP_Error('missing_lead', 'Lead não informado.', ['status' => 400]);
    }

    $lead = $wpdb->get_var($wpdb->prepare(
      "SELECT id FROM {$wpdb->prefix}leads WHERE id = %d",
      $lead_id
    ));

    if (!$lead) {
      return new WP_Error('lead_not_found', 'Lead não encontrado.', ['status' => 404]);
    }

    $ip_address = self::get_client_ip($request);

    // Se o ip_address veio direto nos params (enviado pelo Next.js), prioriza
    if (!empty($params['ip_address'])) {
      $ip_address = sanitize_text_field($params['ip_address']);
    }

    $table = $wpdb->prefix . 'lead_tracking';

    $dados = [
      'lead_id'      => $lead_id,
      'utm_source'   => isset($params['utm_source'])   ? sanitize_text_field($params['utm_source'])     : null,
      'utm_medium'   => isset($params['utm_medium'])   ? sanitize_text_field($params['utm_medium'])     : null,
      'utm_campaign' => isset($params['utm_campaign']) ? sanitize_text_field($params['utm_campaign'])   : null,
      'utm_content'  => isset($params['utm_content'])  ? sanitize_text_field($params['utm_content'])    : null,
      'utm_term'     => isset($params['utm_term'])     ? sanitize_text_field($params['utm_term'])       : null,
      'referrer'     => isset($params['referrer'])     ? esc_url_raw($params['referrer'])               : null,
      'landing_page' => isset($params['landing_page']) ? esc_url_raw($params['landing_page'])           : null,
      'user_agent'   => isset($params['user_agent'])   ? sanitize_textarea_field($params['user_agent']) : ($_SERVER['HTTP_USER_AGENT'] ?? null),
      'ip_address'   => $ip_address,
    ];

    $existing = $wpdb->get_var($wpdb->prepare(
      "SELECT id FROM {$table} WHERE lead_id = %d",
      $lead_id
    ));

    if ($existing) {
      // Atualiza apenas campos que vieram preenchidos
      $update_data = array_filter($dados, fn($v) => $v !== null && $v !== '');
      unset($update_data['lead_id']);

      if (empty($update_data)) {
        return self::get_by_lead_id($lead_id);
      }

      $resultado = $wpdb->update($table, $update_data, ['lead_id' => $lead_id]);
    } else {
      $resultado = $wpdb->insert($table, $dados);
    }

    if ($resultado === false) {
      return new WP_Error('db_error', 'Erro ao salvar tracking no banco de dados.', ['status' => 500]);
    }

    return self::get_by_lead_id($lead_id);
  }

  /**
   * Buscar tracking por lead_id
   */
  public static function get_by_lead_id($lead_id)
  {
    global $wpdb;

    $table = $wpdb->prefix . 'lead_tracking';

    $row = $wpdb->get_row($wpdb->prepare(
      "SELECT * FROM {$table} WHERE lead_id = %d",
      intval($lead_id)
    ), ARRAY_A);

    return $row ?: null;
  }

  /**
   * Resolve o IP real do cliente considerando proxies e load balancers
   */
  private static function get_client_ip($request = null)
  {
    if ($request instanceof WP_REST_Request) {
      $forwarded = $request->get_header('x-forwarded-for');
      if ($forwarded) {
        $ip = trim(explode(',', $forwarded)[0]);
        if (filter_var($ip, FILTER_VALIDATE_IP)) {
          return $ip;
        }
      }
    }

    foreach (['HTTP_X_FORWARDED_FOR', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'] as $key) {
      if (!empty($_SERVER[$key])) {
        $ip = trim(explode(',', $_SERVER[$key])[0]);
        if (filter_var($ip, FILTER_VALIDATE_IP)) {
          return $ip;
        }
      }
    }

    return null;
  }
}
