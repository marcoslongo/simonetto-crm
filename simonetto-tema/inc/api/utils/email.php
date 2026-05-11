<?php
/**
 * Utilitários de Email
 * 
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

/**
 * Enviar email para loja quando novo lead é criado
 */
function mytheme_enviar_email_para_loja($lead_id, $loja_id, $dados_lead)
{
  $loja = get_post($loja_id);
  if (!$loja) {
    return false;
  }

  $emails_loja = get_field('emails', $loja_id);

  if (empty($emails_loja)) {
    return false;
  }

  $destinatarios = array();
  foreach ($emails_loja as $email_item) {
    if (!empty($email_item['email']) && is_email($email_item['email'])) {
      $destinatarios[] = $email_item['email'];
    }
  }

  if (empty($destinatarios)) {
    return false;
  }

  $nome_loja = $loja->post_title;

  $assunto = sprintf(
    '[Novo Lead] %s - Interesse em %s',
    $dados_lead['nome'],
    $dados_lead['interesse'] ?: 'Produtos'
  );

  $corpo = sprintf('
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0073aa; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .info-row { margin: 10px 0; padding: 10px; background: white; border-left: 3px solid #0073aa; }
        .label { font-weight: bold; color: #0073aa; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Novo Lead Recebido</h1>
        </div>
        
        <div class="content">
            <h2>Loja: %s</h2>
            <p>Você recebeu um novo lead interessado em seus produtos/serviços.</p>
            
            <div class="info-row">
                <span class="label">Nome:</span> %s
            </div>
            
            <div class="info-row">
                <span class="label">Email:</span> <a href="mailto:%s">%s</a>
            </div>
            
            <div class="info-row">
                <span class="label">Telefone:</span> %s
            </div>
            
            <div class="info-row">
                <span class="label">Cidade/Estado:</span> %s
            </div>
            
            <div class="info-row">
                <span class="label">Interesse:</span> %s
            </div>
            
            %s
            
            %s
            
            <div class="info-row">
                <span class="label">Data de Cadastro:</span> %s
            </div>
        </div>
        
        <div class="footer">
            <p>Lead ID: #%d | Este é um email automático, não responda.</p>
        </div>
    </div>
</body>
</html>
  ',
    $nome_loja,
    esc_html($dados_lead['nome']),
    esc_attr($dados_lead['email']),
    esc_html($dados_lead['email']),
    esc_html($dados_lead['telefone']),
    esc_html(trim("{$dados_lead['cidade']}/{$dados_lead['estado']}", '/')),
    esc_html($dados_lead['interesse'] ?: 'Não informado'),
    $dados_lead['expectativa_investimento'] ? sprintf(
      '<div class="info-row"><span class="label">Expectativa de Investimento:</span> %s</div>',
      esc_html($dados_lead['expectativa_investimento'])
    ) : '',
    $dados_lead['mensagem'] ? sprintf(
      '<div class="info-row"><span class="label">Mensagem:</span><br>%s</div>',
      nl2br(esc_html($dados_lead['mensagem']))
    ) : '',
    date('d/m/Y H:i', strtotime($dados_lead['data_criacao'])),
    $lead_id
  );

  $headers = array(
    'Content-Type: text/html; charset=UTF-8',
    'From: ' . get_bloginfo('name') . ' <' . get_option('admin_email') . '>'
  );

  return wp_mail($destinatarios, $assunto, $corpo, $headers);
}