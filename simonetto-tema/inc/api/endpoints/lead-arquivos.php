<?php
/**
 * Endpoints REST de Arquivos de Lead
 *
 * GET    /api/v1/leads/{id}/arquivos    — listar arquivos do lead
 * POST   /api/v1/leads/{id}/arquivos    — upload de arquivo (multipart/form-data, campo "arquivo")
 * DELETE /api/v1/lead-arquivos/{id}     — excluir arquivo
 *
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

add_action('rest_api_init', function () {

  register_rest_route('api/v1', '/leads/(?P<id>\d+)/arquivos', [
    [
      'methods'             => 'GET',
      'callback'            => 'mytheme_api_list_lead_arquivos',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
    [
      'methods'             => 'POST',
      'callback'            => 'mytheme_api_upload_lead_arquivo',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
  ]);

  register_rest_route('api/v1', '/lead-arquivos/(?P<id>\d+)', [
    [
      'methods'             => 'DELETE',
      'callback'            => 'mytheme_api_delete_lead_arquivo',
      'permission_callback' => 'mytheme_api_is_authenticated',
    ],
  ]);
});

function mytheme_api_list_lead_arquivos(WP_REST_Request $request): WP_REST_Response
{
  $lead_id = (int) $request['id'];
  $arquivos = Lead_Arquivos_Handler::list_by_lead($lead_id);
  return new WP_REST_Response(['success' => true, 'arquivos' => $arquivos], 200);
}

function mytheme_api_upload_lead_arquivo(WP_REST_Request $request): WP_REST_Response
{
  $lead_id = (int) $request['id'];
  $files   = $request->get_file_params();

  if (empty($files['arquivo'])) {
    return new WP_REST_Response(['success' => false, 'mensagem' => 'Nenhum arquivo enviado.'], 400);
  }

  $user   = wp_get_current_user();
  $result = Lead_Arquivos_Handler::upload($lead_id, $files['arquivo'], $user->ID, $user->display_name);

  if (is_wp_error($result)) {
    $status = (int) ($result->get_error_data()['status'] ?? 400);
    return new WP_REST_Response(['success' => false, 'mensagem' => $result->get_error_message()], $status);
  }

  return new WP_REST_Response(['success' => true, 'arquivo' => $result], 201);
}

function mytheme_api_delete_lead_arquivo(WP_REST_Request $request): WP_REST_Response
{
  $id      = (int) $request['id'];
  $body    = $request->get_json_params() ?? [];
  $lead_id = (int) ($body['lead_id'] ?? 0);

  $user     = wp_get_current_user();
  $is_admin = in_array('administrator', (array) $user->roles, true);

  $result = Lead_Arquivos_Handler::delete($id, $lead_id, $user->ID, $is_admin);

  if (is_wp_error($result)) {
    $status = (int) ($result->get_error_data()['status'] ?? 400);
    return new WP_REST_Response(['success' => false, 'mensagem' => $result->get_error_message()], $status);
  }

  return new WP_REST_Response(['success' => true], 200);
}
