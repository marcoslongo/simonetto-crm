export interface LojaStats {
  total: number
  hoje: number
  semana: number
  mes: number
}

export interface LojaStatusFunil {
  nao_atendido: number
  em_negociacao: number
  venda_realizada: number
  venda_nao_realizada: number
}

export interface LojaClassificacao {
  frio: number
  morno: number
  quente: number
}

export interface LeadsByDay {
  date: string
  total: number
}

export interface LeadsByMonth {
  date: string
  total: number
}

export interface LojaStatsResponse {
  success: boolean
  stats: LojaStats
}

export interface Leads30DaysResponse {
  success: boolean
  data: LeadsByDay[]
}

export interface Leads12MonthsResponse {
  success: boolean
  data: LeadsByMonth[]
}

export interface LojaServiceStats {
  total_leads: number
  leads_contatados: number
  leads_nao_contatados: number
  perc_contatados: number
  perc_nao_contatados: number
  tempo_medio_minutos: number | null
  tempo_medio_horas: number | null
}