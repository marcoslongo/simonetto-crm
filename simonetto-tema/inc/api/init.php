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
require_once __DIR__ . '/handlers/lead-handler.php';
require_once __DIR__ . '/handlers/lead-tracking-handler.php';
require_once __DIR__ . '/handlers/loja-handler.php';
require_once __DIR__ . '/handlers/stats-handler.php';
require_once __DIR__ . '/handlers/mensagem-handler.php';
require_once __DIR__ . '/handlers/nota-handler.php';

// Carregar endpoints
require_once __DIR__ . '/endpoints/leads.php';
require_once __DIR__ . '/endpoints/lojas.php';
require_once __DIR__ . '/endpoints/stats.php';
require_once __DIR__ . '/endpoints/lp-integration.php';
require_once __DIR__ . '/endpoints/mensagens.php';
require_once __DIR__ . '/endpoints/notas.php';

// Criar tabelas novas se necessário
add_action('init', function () {
  Nota_Handler::maybe_create_table();
}, 5);