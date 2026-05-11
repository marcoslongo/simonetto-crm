import { Leads12MonthsResponse, Leads30DaysResponse, LeadsByDay, LeadsByMonth, LojaClassificacao, LojaServiceStats, LojaStats, LojaStatsResponse, LojaStatusFunil } from "./types-loja"
import type { Lead } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://manager.simonetto.com.br/wp-json/api/v1'

/**
 * Buscar estatísticas gerais da loja
 */
export async function getLojaStats(lojaId: string | number): Promise<LojaStats> {
  const response = await fetch(`${API_BASE_URL}/lojas/${lojaId}/stats`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Erro ao buscar estatísticas: ${response.status}`)
  }

  const data: LojaStatsResponse = await response.json()

  if (!data.success) {
    throw new Error('API retornou sucesso = false')
  }

  return data.stats
}

/**
 * Buscar leads dos últimos 30 dias
 */
export async function getLojaLeads30Days(lojaId: string | number): Promise<LeadsByDay[]> {
  const response = await fetch(`${API_BASE_URL}/lojas/${lojaId}/leads-30-days`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Erro ao buscar leads 30 dias: ${response.status}`)
  }

  const data: Leads30DaysResponse = await response.json()

  if (!data.success) {
    throw new Error('API retornou sucesso = false')
  }

  return data.data
}

/**
 * Buscar leads dos últimos 12 meses
 */
export async function getLojaLeads12Months(lojaId: string | number): Promise<LeadsByMonth[]> {
  const response = await fetch(`${API_BASE_URL}/lojas/${lojaId}/leads-12-months`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Erro ao buscar leads 12 meses: ${response.status}`)
  }

  const data: Leads12MonthsResponse = await response.json()

  if (!data.success) {
    throw new Error('API retornou sucesso = false')
  }

  return data.data
}

export async function getLojaStatusFunil(lojaId: string | number): Promise<LojaStatusFunil> {
  const response = await fetch(`${API_BASE_URL}/lojas/${lojaId}/status-funil`, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) throw new Error(`Erro ao buscar status do funil: ${response.status}`)
  const data = await response.json()
  return data.data || { nao_atendido: 0, em_negociacao: 0, venda_realizada: 0, venda_nao_realizada: 0 }
}

export async function getLojaClassificacao(lojaId: string | number): Promise<LojaClassificacao> {
  const response = await fetch(`${API_BASE_URL}/lojas/${lojaId}/classificacao`, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) throw new Error(`Erro ao buscar classificação: ${response.status}`)
  const data = await response.json()
  return data.data || { frio: 0, morno: 0, quente: 0 }
}

export async function getLojaServiceStats(lojaId: string | number): Promise<LojaServiceStats> {
  const response = await fetch(`${API_BASE_URL}/lojas/${lojaId}/service-stats`, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) throw new Error(`Erro ao buscar métricas de atendimento: ${response.status}`)
  const data = await response.json()
  return data.data || {
    total_leads: 0,
    leads_contatados: 0,
    leads_nao_contatados: 0,
    perc_contatados: 0,
    perc_nao_contatados: 0,
    tempo_medio_minutos: null,
    tempo_medio_horas: null,
  }
}

export async function getLojaLeads(
  lojaId: string | number,
  page = 1,
  perPage = 100
): Promise<{ leads: Lead[]; total: number }> {
  const response = await fetch(
    `${API_BASE_URL}/lojas/${lojaId}/leads?page=${page}&per_page=${perPage}`,
    {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    }
  )

  if (!response.ok) {
    throw new Error(`Erro ao buscar leads da loja: ${response.status}`)
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error('API retornou sucesso = false')
  }

  return { leads: data.leads, total: data.total }
}