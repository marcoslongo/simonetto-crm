// =====================================
// TIPOS DO Noxus - Lead Ops
// =====================================

export type UserRole = 'administrator' | 'loja';

export type LeadStatus = string;

export interface KanbanColuna {
  id: number
  loja_id: number
  slug: string
  label: string
  cor: string
  ordem: number
  fixo: boolean | 0 | 1
}

export interface AuthResponse {
  token: string;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
  user_id: number;
  role: string[];
  acf: {
    loja_ids: number[];
    is_gerente?: boolean;
    avatar_url?: string | null;
  };
}

export interface User {
  id: number;
  email: string;
  name: string;
  nicename: string;
  role: UserRole;
  loja_ids: number[];
  loja_nome?: string;
  is_gerente: boolean;
  avatar_url?: string | null;
}

export interface Session {
  user: User;
  token: string;
  expires: string;
}

// Loja
export interface Loja {
  id: string;
  nome: string;
  cidade: string | null;
  estado: string | null;
  localizacao: string;
  emails: Array<{ email: string }> | null;
}

export type LeadOrigem = 'industria' | 'proprio';

// Lead
export interface Lead {
  id: string;
  nome: string;
  email?: string;
  telefone: string;
  cidade: string;
  estado: string;
  interesse: string;
  expectativa_investimento: string;
  loja_regiao: string;
  mensagem: string;
  pipefy_card_id: string | null;
  loja_id: string | null;
  origem: LeadOrigem;
  status: LeadStatus;
  data_criacao: string;
  data_atualizacao: string;
  loja_nome: string;
  loja_cidade: string;
  loja_estado: string;
  classificacao?: "quente" | "morno" | "frio";
  score?: number;
  unread_count?: number;
  responsavel_id?: number | null;
  responsavel_nome?: string | null;
  responsavel_avatar_url?: string | null;
  proximo_followup_em?: string | null;
  proximo_followup_descricao?: string | null;
}

export interface LeadsResponse {
  success: boolean;
  leads: Lead[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Resposta de lojas
export interface LojasResponse {
  success: boolean;
  lojas: Loja[];
}

// Resposta de lead único
export interface LeadResponse {
  success: boolean;
  lead: Lead;
}

// Filtros de leads
export interface LeadsFilters {
  page?: number;
  per_page?: number;
  email?: string;
  loja_id?: number;
  search?: string;
  from?: string;
  to?: string;
  origem?: LeadOrigem;
}

// Estatísticas do dashboard
export interface DashboardStats {
  totalLeads: number;
  leadsHoje: number;
  leadsEsteMes: number;
  ultimoLead: Lead | null;
}

// Resposta de erro da API
export interface ApiError {
  success: false;
  mensagem: string;
  erro?: string;
}

export interface VendaNaoRealizada {
  id: number;
  lead_id: string;
  atendente_id: number | null;
  atendente_nome: string | null;
  motivo_preco: boolean;
  motivo_concorrencia: boolean;
  motivo_prazo_entrega: boolean;
  motivo_pagamento: boolean;
  motivo_financiamento: boolean;
  motivo_obra_pendente: boolean;
  motivo_indecisao: boolean;
  motivo_produto_inadequado: boolean;
  motivo_contato_perdido: boolean;
  motivo_atendimento: boolean;
  motivo_outro: boolean;
  observacao: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoreTimeRanking {
  loja_id: string;
  loja_nome: string;
  total_leads: string;
  tempo_medio_minutos: string;
  tempo_medio_horas: string;
  ranking: number;
}

export interface TimeStoreResponse {
  success: boolean;
  total_lojas: number;
  data: StoreTimeRanking[];
}