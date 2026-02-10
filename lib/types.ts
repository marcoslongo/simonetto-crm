// =====================================
// TIPOS DO Noxus - Lead Ops
// =====================================

export type UserRole = 'administrator' | 'loja';

export interface AuthResponse {
  token: string;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
  user_id: number;
  role: string[];
  acf: {
    loja_id: number | string | null;
  };
}

export interface User {
  id: number;
  email: string;
  name: string;
  nicename: string;
  role: UserRole;
  loja_id: number | null;
  loja_nome?: string;
}

export interface Session {
  user: User;
  token: string;
  expires: string;
}

// Loja
export interface Loja {
  id: string
  nome: string
  cidade: string | null
  estado: string | null
  localizacao: string
  emails: Array<{ email: string }> | null
}

// Lead
export interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  estado: string;
  interesse: string;
  expectativa_investimento: string;
  loja_regiao: string;
  mensagem: string;
  pipefy_card_id: string | null;
  loja_id: string | null;
  data_criacao: string;
  data_atualizacao: string;
  loja_nome: string;
  loja_cidade: string;
  loja_estado: string;
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
  success: boolean
  lojas: Loja[]
}

// Resposta de lead único
export interface LeadResponse {
  success: boolean
  lead: Lead
}

// Filtros de leads
export interface LeadsFilters {
  page?: number
  per_page?: number
  email?: string
  loja_id?: number
}

// Estatísticas do dashboard
export interface DashboardStats {
  totalLeads: number
  leadsHoje: number
  leadsEsteMes: number
  ultimoLead: Lead | null
}

// Resposta de erro da API
export interface ApiError {
  success: false
  mensagem: string
  erro?: string
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
