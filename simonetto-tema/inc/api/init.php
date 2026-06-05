<?php
/**
 * Inicializa a API REST
 * 
 * @package MyTheme
 */

if (!defined('ABSPATH')) {
  exit;
}

// Carregar utilitários
require_once __DIR__ . '/utils/cors.php';
require_once __DIR__ . '/utils/email.php';

// Carregar handlers
require_once __DIR__ . '/handlers/kanban-column-handler.php';
require_once __DIR__ . '/handlers/lead-handler.php';
require_once __DIR__ . '/handlers/lead-arquiteto-handler.php';
require_once __DIR__ . '/handlers/lead-tracking-handler.php';
require_once __DIR__ . '/handlers/loja-handler.php';
require_once __DIR__ . '/handlers/stats-handler.php';
require_once __DIR__ . '/handlers/mensagem-handler.php';
require_once __DIR__ . '/handlers/nota-handler.php';
require_once __DIR__ . '/handlers/followup-handler.php';
require_once __DIR__ . '/handlers/render-handler.php';
require_once __DIR__ . '/handlers/agenda-compartilhada-handler.php';
require_once __DIR__ . '/handlers/lead-arquivos-handler.php';
require_once __DIR__ . '/handlers/lead-notificacoes-handler.php';

// Carregar endpoints
require_once __DIR__ . '/endpoints/leads.php';
require_once __DIR__ . '/endpoints/leads-arquitetos.php';
require_once __DIR__ . '/endpoints/lojas.php';
require_once __DIR__ . '/endpoints/stats.php';
require_once __DIR__ . '/endpoints/lp-integration.php';
require_once __DIR__ . '/endpoints/mensagens.php';
require_once __DIR__ . '/endpoints/notas.php';
require_once __DIR__ . '/endpoints/followups.php';
require_once __DIR__ . '/endpoints/renders.php';
require_once __DIR__ . '/endpoints/ai.php';
require_once __DIR__ . '/endpoints/kanban-columns.php';
require_once __DIR__ . '/endpoints/agenda-compartilhada.php';
require_once __DIR__ . '/endpoints/lead-arquivos.php';
require_once __DIR__ . '/endpoints/lead-notificacoes.php';
require_once __DIR__ . '/endpoints/export.php';

// Criar tabelas novas se necessário
add_action('init', function () {
  Nota_Handler::maybe_create_table();
  Followup_Handler::maybe_create_table();
  Render_Handler::maybe_create_table();
  Kanban_Column_Handler::maybe_create_table();
  Agenda_Compartilhada_Handler::maybe_create_tables();
  Lead_Arquivos_Handler::maybe_create_table();
  Lead_Notificacoes_Handler::maybe_create_table();
}, 5);

