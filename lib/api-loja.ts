import { Leads12MonthsResponse, Leads30DaysResponse, LeadsByDay, LeadsByMonth, LojaStats, LojaStatsResponse } from "./types-loja"
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