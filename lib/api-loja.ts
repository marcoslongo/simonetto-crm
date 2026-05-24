import { cookies } from 'next/headers'
import { Leads12MonthsResponse, Leads30DaysResponse, LeadsByDay, LeadsByMonth, LojaClassificacao, LojaServiceStats, LojaStats, LojaStatsResponse, LojaStatusFunil } from "./types-loja"
import type { Lead } from './types'
import type { VnrStatsData } from '@/components/dashboard/chart-vnr-motivos'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://manager.simonetto.com.br/wp-json/api/v1'

async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/**
 * Buscar estatísticas gerais da loja
 */
export async function getLojaStats(lojaId: string | number): Promise<LojaStats> {
  const response = await fetch(`${API_BASE_URL}/lojas/${lojaId}/stats`, {
    cache: 'no-store',
    headers: await getAuthHeaders(),
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
    headers: await getAuthHeaders(),
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
    headers: await getAuthHeaders(),
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
    headers: await getAuthHeaders(),
  })

  if (!response.ok) throw new Error(`Erro ao buscar status do funil: ${response.status}`)
  const data = await response.json()
  return data.data || { nao_atendido: 0, em_negociacao: 0, venda_realizada: 0, venda_nao_realizada: 0 }
}

export async function getLojaClassificacao(lojaId: string | number): Promise<LojaClassificacao> {
  const response = await fetch(`${API_BASE_URL}/lojas/${lojaId}/classificacao`, {
    cache: 'no-store',
    headers: await getAuthHeaders(),
  })

  if (!response.ok) throw new Error(`Erro ao buscar classificação: ${response.status}`)
  const data = await response.json()
  return data.data || { frio: 0, morno: 0, quente: 0 }
}

export async function getLojaServiceStats(lojaId: string | number): Promise<LojaServiceStats> {
  const response = await fetch(`${API_BASE_URL}/lojas/${lojaId}/service-stats`, {
    cache: 'no-store',
    headers: await getAuthHeaders(),
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

export interface LojaIntegrationData {
  token: string | null
  endpoint: string | null
  snippet: string | null
}

export async function getLojaIntegration(lojaId: string | number): Promise<LojaIntegrationData> {
  const response = await fetch(`${API_BASE_URL}/lojas/${lojaId}/integration`, {
    cache: 'no-store',
    headers: await getAuthHeaders(),
  })

  if (!response.ok) {
    return { token: null, endpoint: null, snippet: null }
  }

  const data = await response.json()
  return {
    token: data.token ?? null,
    endpoint: data.endpoint ?? null,
    snippet: data.snippet ?? null,
  }
}

export async function getLojaLeads(
  lojaId: string | number,
  page = 1,
  perPage = 100,
  from?: string,
  to?: string,
  search?: string
): Promise<{ leads: Lead[]; total: number }> {
  let url = `${API_BASE_URL}/lojas/${lojaId}/leads?page=${page}&per_page=${perPage}`
  if (from)   url += `&from=${encodeURIComponent(from)}`
  if (to)     url += `&to=${encodeURIComponent(to)}`
  if (search) url += `&search=${encodeURIComponent(search)}`
  const response = await fetch(
    url,
    {
      cache: 'no-store',
      headers: await getAuthHeaders(),
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

// ============================================================
// Funções de agregação multi-loja
// ============================================================

function safeCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  return fn().catch(() => fallback)
}

function mergeDateSeries<T extends { date: string; total: number }>(arrays: T[][]): T[] {
  const map = new Map<string, number>()
  for (const arr of arrays) {
    for (const { date, total } of arr) {
      map.set(date, (map.get(date) ?? 0) + total)
    }
  }
  return Array.from(map.entries())
    .map(([date, total]) => ({ date, total } as T))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export async function getMultiLojaStats(lojaIds: number[]): Promise<LojaStats> {
  if (!lojaIds.length) return { total: 0, hoje: 0, semana: 0, mes: 0 }
  const results = await Promise.all(
    lojaIds.map(id => safeCall(() => getLojaStats(id), { total: 0, hoje: 0, semana: 0, mes: 0 }))
  )
  return results.reduce((acc, s) => ({
    total: acc.total + s.total,
    hoje: acc.hoje + s.hoje,
    semana: acc.semana + s.semana,
    mes: acc.mes + s.mes,
  }))
}

export async function getMultiLojaStatusFunil(lojaIds: number[]): Promise<LojaStatusFunil> {
  const zero: LojaStatusFunil = { nao_atendido: 0, em_negociacao: 0, venda_realizada: 0, venda_nao_realizada: 0 }
  if (!lojaIds.length) return zero
  const results = await Promise.all(lojaIds.map(id => safeCall(() => getLojaStatusFunil(id), zero)))
  return results.reduce((acc, s) => ({
    nao_atendido: acc.nao_atendido + s.nao_atendido,
    em_negociacao: acc.em_negociacao + s.em_negociacao,
    venda_realizada: acc.venda_realizada + s.venda_realizada,
    venda_nao_realizada: acc.venda_nao_realizada + s.venda_nao_realizada,
  }))
}

export async function getMultiLojaClassificacao(lojaIds: number[]): Promise<LojaClassificacao> {
  const zero: LojaClassificacao = { frio: 0, morno: 0, quente: 0 }
  if (!lojaIds.length) return zero
  const results = await Promise.all(lojaIds.map(id => safeCall(() => getLojaClassificacao(id), zero)))
  return results.reduce((acc, s) => ({
    frio: acc.frio + s.frio,
    morno: acc.morno + s.morno,
    quente: acc.quente + s.quente,
  }))
}

export async function getMultiLojaLeads30Days(lojaIds: number[]): Promise<LeadsByDay[]> {
  if (!lojaIds.length) return []
  const results = await Promise.all(lojaIds.map(id => safeCall(() => getLojaLeads30Days(id), [])))
  return mergeDateSeries(results)
}

export async function getMultiLojaLeads12Months(lojaIds: number[]): Promise<LeadsByMonth[]> {
  if (!lojaIds.length) return []
  const results = await Promise.all(lojaIds.map(id => safeCall(() => getLojaLeads12Months(id), [])))
  return mergeDateSeries(results)
}

export async function getMultiLojaServiceStats(lojaIds: number[]): Promise<LojaServiceStats> {
  const zero: LojaServiceStats = {
    total_leads: 0, leads_contatados: 0, leads_nao_contatados: 0,
    perc_contatados: 0, perc_nao_contatados: 0,
    tempo_medio_minutos: null, tempo_medio_horas: null,
  }
  if (!lojaIds.length) return zero
  const results = await Promise.all(lojaIds.map(id => safeCall(() => getLojaServiceStats(id), zero)))
  const totalLeads = results.reduce((s, r) => s + r.total_leads, 0)
  const totalContatados = results.reduce((s, r) => s + r.leads_contatados, 0)
  const totalNaoContatados = results.reduce((s, r) => s + r.leads_nao_contatados, 0)
  // Média ponderada pelo número de leads contatados
  const tempoSumMin = results.reduce((s, r) => s + (r.tempo_medio_minutos ?? 0) * r.leads_contatados, 0)
  const tempoSumHrs = results.reduce((s, r) => s + (r.tempo_medio_horas ?? 0) * r.leads_contatados, 0)
  return {
    total_leads: totalLeads,
    leads_contatados: totalContatados,
    leads_nao_contatados: totalNaoContatados,
    perc_contatados: totalLeads ? Math.round(totalContatados * 10000 / totalLeads) / 100 : 0,
    perc_nao_contatados: totalLeads ? Math.round(totalNaoContatados * 10000 / totalLeads) / 100 : 0,
    tempo_medio_minutos: totalContatados ? Math.round(tempoSumMin / totalContatados * 100) / 100 : null,
    tempo_medio_horas: totalContatados ? Math.round(tempoSumHrs / totalContatados * 100) / 100 : null,
  }
}

export async function getMultiLojaLeads(
  lojaIds: number[],
  perPage = 200
): Promise<{ leads: Lead[]; total: number }> {
  if (!lojaIds.length) return { leads: [], total: 0 }
  const results = await Promise.all(
    lojaIds.map(id => safeCall(() => getLojaLeads(id, 1, perPage), { leads: [], total: 0 }))
  )
  const leads = results
    .flatMap(r => r.leads)
    .sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime())
  return { leads, total: results.reduce((s, r) => s + r.total, 0) }
}

export interface ConversaoPorLojaItem {
  loja_id: number
  loja_nome: string
  total_leads: number
  vendas_realizadas: number
  vendas_nao_realizadas: number
  em_negociacao: number
  nao_atendido: number
  taxa_conversao: number
}

export interface FunilPorAtendenteItem {
  responsavel_id: number
  atendente_nome: string
  total_leads: number
  vendas_realizadas: number
  vendas_nao_realizadas: number
  em_negociacao: number
  nao_atendido: number
  taxa_conversao: number
  ciclo_medio_horas: number | null
}

export interface TempoPorEtapaItem {
  status: string
  label: string
  total: number
  tempo_medio_horas: number
  tipo: 'ativo' | 'fechado'
}

export async function getConversaoPorLoja(lojaIds: number[] = []): Promise<ConversaoPorLojaItem[]> {
  const qs = new URLSearchParams()
  if (lojaIds.length) qs.set('loja_ids', lojaIds.join(','))
  const headers = await getAuthHeaders()
  try {
    const res = await fetch(
      `${API_BASE_URL}/stats/conversao-por-loja${qs.toString() ? `?${qs}` : ''}`,
      { cache: 'no-store', headers }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.data ?? []
  } catch { return [] }
}

export async function getFunilPorAtendente(lojaIds: number[] = []): Promise<FunilPorAtendenteItem[]> {
  const qs = new URLSearchParams()
  if (lojaIds.length) qs.set('loja_ids', lojaIds.join(','))
  const headers = await getAuthHeaders()
  try {
    const res = await fetch(
      `${API_BASE_URL}/stats/funil-por-atendente${qs.toString() ? `?${qs}` : ''}`,
      { cache: 'no-store', headers }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.data ?? []
  } catch { return [] }
}

export async function getTempoPorEtapa(lojaIds: number[] = []): Promise<TempoPorEtapaItem[]> {
  const qs = new URLSearchParams()
  if (lojaIds.length) qs.set('loja_ids', lojaIds.join(','))
  const headers = await getAuthHeaders()
  try {
    const res = await fetch(
      `${API_BASE_URL}/stats/tempo-por-etapa${qs.toString() ? `?${qs}` : ''}`,
      { cache: 'no-store', headers }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.data ?? []
  } catch { return [] }
}

export async function getVnrStats(lojaIds?: number[]): Promise<VnrStatsData> {
  const qs = new URLSearchParams()
  if (lojaIds?.length) qs.set('loja_id', lojaIds.join(','))

  const headers = await getAuthHeaders()
  try {
    const res = await fetch(
      `${API_BASE_URL}/leads-vnr-stats${qs.toString() ? `?${qs}` : ''}`,
      { cache: 'no-store', headers }
    )
    if (!res.ok) return { total: 0, motivos: [] }
    const data = await res.json()
    if (!data.success) return { total: 0, motivos: [] }
    return { total: data.total, motivos: data.motivos }
  } catch {
    return { total: 0, motivos: [] }
  }
}