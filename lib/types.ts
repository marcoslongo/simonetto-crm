// =====================================
// TIPOS DO Noxus - Lead Ops
// =====================================

export type UserRole = 'administrator' | 'loja';

export type LeadStatus = string;

export interface Etiqueta {
  id: number;
  loja_id: number;
  nome: string;
  cor: string;
  ordem?: number;
}

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
    is_master?: boolean;
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
  is_master: boolean;
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
  etiquetas?: Etiqueta[];
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

export type FormaPagamento =
  | 'dinheiro'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'pix'
  | 'boleto'
  | 'financiamento'
  | 'cheque'
  | 'outro'

export interface VendaRealizada {
  id?: number
  lead_id: string
  valor?: number | null
  data_venda?: string | null
  forma_pagamento?: FormaPagamento | null
  numero_pedido?: string | null
  numero_nf?: string | null
  serie_nf?: string | null
  chave_acesso_nf?: string | null
  link_nf?: string | null
  observacoes?: string | null
  created_at?: string
  updated_at?: string
}

export interface VendasRealizadasCampos {
  valor: boolean
  data_venda: boolean
  forma_pagamento: boolean
  numero_pedido: boolean
  nota_fiscal: boolean
  observacoes: boolean
}

export interface VendasRealizadasConfig {
  ativo: boolean
  preenchimento_obrigatorio: boolean
  campos: VendasRealizadasCampos
}

export const VENDAS_CONFIG_PADRAO: VendasRealizadasConfig = {
  ativo: false,
  preenchimento_obrigatorio: false,
  campos: {
    valor: true,
    data_venda: true,
    forma_pagamento: true,
    numero_pedido: false,
    nota_fiscal: false,
    observacoes: true,
  },
}

// ─── Metas Comerciais ────────────────────────────────────────────────────────

export type TipoMeta = 'faturamento' | 'quantidade_vendas' | 'conversao' | 'personalizada'
export type PeriodoMeta = 'mensal' | 'trimestral' | 'semestral' | 'anual'
export type StatusMeta = 'ativa' | 'encerrada' | 'cancelada'

export interface MetaComercial {
  id: number
  loja_id: number
  usuario_id: number | null
  usuario_nome?: string | null
  tipo: TipoMeta
  periodo: PeriodoMeta
  nome: string
  valor_meta: number
  data_inicio: string
  data_fim: string
  status: StatusMeta
  created_at: string
  updated_at: string
  valor_realizado?: number
  percentual_atingido?: number
  dias_restantes?: number
}

export interface MetasConfig {
  ativo: boolean
}

export const METAS_CONFIG_PADRAO: MetasConfig = {
  ativo: false,
}

export interface MetaRankingItem {
  usuario_id: number
  usuario_nome: string
  valor_realizado: number
  valor_meta: number
  percentual_atingido: number
}

export interface MetasDashboardData {
  config: MetasConfig
  metas: MetaComercial[]
  total_meta: number
  total_realizado: number
  percentual_geral: number
  ranking: MetaRankingItem[]
}

// ─── Pós-Venda ───────────────────────────────────────────────────────────────

export interface PosVendaColuna {
  id: number
  loja_id: number
  slug: string
  label: string
  cor: string
  ordem: number
  fixo: number | boolean
}

export interface PosVenda {
  id: number
  lead_id: number
  loja_id: number
  etapa: string
  etapa_desde: string
  responsavel_id: number | null
  responsavel_nome: string | null
  criado_por_id: number | null
  criado_por_nome: string | null
  created_at: string
  updated_at: string
  // campos enriquecidos do lead
  lead_nome?: string | null
  lead_telefone?: string | null
  lead_email?: string | null
  lead_cidade?: string | null
  lead_estado?: string | null
  loja_nome?: string | null
  // campos enriquecidos da venda
  venda_valor?: number | null
  venda_data_venda?: string | null
  venda_numero_pedido?: string | null
  venda_forma_pagamento?: string | null
  venda_observacoes?: string | null
  venda_atendente_nome?: string | null
  // contadores
  assistencias_abertas?: number | null
}

export interface PosVendaHistorico {
  id: number
  pos_venda_id: number
  etapa_anterior: string | null
  etapa_nova: string
  usuario_id: number | null
  usuario_nome: string | null
  comentario: string | null
  created_at: string
}

export interface PosVendaNota {
  id: number
  pos_venda_id: number
  usuario_id: number | null
  usuario_nome: string | null
  conteudo: string
  created_at: string
}

export type StatusAssistencia = 'aberta' | 'em_atendimento' | 'aguardando_cliente' | 'resolvida' | 'encerrada'

export interface PosVendaAssistencia {
  id: number
  pos_venda_id: number
  status: StatusAssistencia
  descricao: string
  solucao: string | null
  responsavel_id: number | null
  responsavel_nome: string | null
  data_conclusao: string | null
  created_at: string
  updated_at: string
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