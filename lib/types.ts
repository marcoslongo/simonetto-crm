// =====================================
// TIPOS DO CRM MULTI-UNIDADES
// =====================================

// Roles de usuário
export type UserRole = 'administrator' | 'loja'

// Usuário autenticado
export interface User {
  id: number
  email: string
  name: string
  role: UserRole
  loja_id: number | null
  loja_nome?: string
}

// Sessão do usuário
export interface Session {
  user: User
  token: string
  expires: string
}

// Loja
export interface Loja {
  id: number
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
  loja_id: string;
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
