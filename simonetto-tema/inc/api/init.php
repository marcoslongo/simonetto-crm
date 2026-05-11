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

// Carregar endpoints
require_once __DIR__ . '/endpoints/leads.php';
require_once __DIR__ . '/endpoints/lojas.php';
require_once __DIR__ . '/endpoints/stats.php';