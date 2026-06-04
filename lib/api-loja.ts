import { cache } from 'react'
import { cookies } from 'next/headers'
import { Leads12MonthsResponse, Leads30DaysResponse, LeadsByDay, LeadsByMonth, LojaClassificacao, LojaServiceStats, LojaStats, LojaStatsResponse, LojaStatusFunil } from "./types-loja"
import type { Lead, KanbanColuna } from './types'
import type { VnrStatsData } from '@/components/dashboard/chart-vnr-motivos'
import { DEFAULT_KANBAN_COLUNAS } from './kanban-config'

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
    next: { revalidate: 60 },
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
    next: { revalidate: 300 },
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
    next: { revalidate: 300 },
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
    next: { revalidate: 60 },
    headers: await getAuthHeaders(),
  })

  if (!response.ok) throw new Error(`Erro ao buscar classificação: ${response.status}`)
  const data = await response.json()
  return data.data || { frio: 0, morno: 0, quente: 0 }
}

export async function getLojaServiceStats(lojaId: string | number): Promise<LojaServiceStats> {
  const response = await fetch(`${API_BASE_URL}/lojas/${lojaId}/service-stats`, {
    next: { revalidate: 60 },
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
  search?: string,
  status?: string,
  responsavelId?: number,
): Promise<{ leads: Lead[]; total: number }> {
  let url = `${API_BASE_URL}/lojas/${lojaId}/leads?page=${page}&per_page=${perPage}`
  if (from)          url += `&from=${encodeURIComponent(from)}`
  if (to)            url += `&to=${encodeURIComponent(to)}`
  if (search)        url += `&search=${encodeURIComponent(search)}`
  if (status)        url += `&status=${encodeURIComponent(status)}`
  if (responsavelId) url += `&responsavel_id=${responsavelId}`
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

export async function getMultiLojaStatusFunil(lojaIds: number[]): Promise<Record<string, number>> {
  const zero: Record<string, number> = { nao_atendido: 0, em_negociacao: 0, venda_realizada: 0, venda_nao_realizada: 0 }
  if (!lojaIds.length) return zero
  const results = await Promise.all(lojaIds.map(id => safeCall(() => getLojaStatusFunil(id), zero)))
  const merged: Record<string, number> = {}
  for (const result of results) {
    for (const [key, val] of Object.entries(result)) {
      merged[key] = (merged[key] ?? 0) + (val as number)
    }
  }
  return merged
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

export async function getConversaoPorLoja(lojaIds: number[] = [], from?: string, to?: string): Promise<ConversaoPorLojaItem[]> {
  const qs = new URLSearchParams()
  if (lojaIds.length) qs.set('loja_ids', lojaIds.join(','))
  if (from) qs.set('from', from)
  if (to)   qs.set('to', to)
  const headers = await getAuthHeaders()
  try {
    const res = await fetch(
      `${API_BASE_URL}/stats/conversao-por-loja${qs.toString() ? `?${qs}` : ''}`,
      { next: { revalidate: from || to ? 0 : 60 }, headers }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.data ?? []
  } catch { return [] }
}

export async function getFunilPorAtendente(lojaIds: number[] = [], from?: string, to?: string): Promise<FunilPorAtendenteItem[]> {
  const qs = new URLSearchParams()
  if (lojaIds.length) qs.set('loja_ids', lojaIds.join(','))
  if (from) qs.set('from', from)
  if (to)   qs.set('to', to)
  const headers = await getAuthHeaders()
  try {
    const res = await fetch(
      `${API_BASE_URL}/stats/funil-por-atendente${qs.toString() ? `?${qs}` : ''}`,
      { next: { revalidate: from || to ? 0 : 60 }, headers }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.data ?? []
  } catch { return [] }
}

export async function getTempoPorEtapa(lojaIds: number[] = [], from?: string, to?: string): Promise<TempoPorEtapaItem[]> {
  const qs = new URLSearchParams()
  if (lojaIds.length) qs.set('loja_ids', lojaIds.join(','))
  if (from) qs.set('from', from)
  if (to)   qs.set('to', to)
  const headers = await getAuthHeaders()
  try {
    const res = await fetch(
      `${API_BASE_URL}/stats/tempo-por-etapa${qs.toString() ? `?${qs}` : ''}`,
      { next: { revalidate: from || to ? 0 : 60 }, headers }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.data ?? []
  } catch { return [] }
}

export interface SaudeFunilData {
  active_leads:        number
  sla_breach_count:    number
  sla_nao_atendido:    number
  sla_parados:         number
  sla_breach_pct:      number
  score_medio:         number
  followup_total:      number
  followup_concluidos: number
  followup_compliance: number | null
}

const SAUDE_ZERO: SaudeFunilData = {
  active_leads: 0, sla_breach_count: 0, sla_nao_atendido: 0,
  sla_parados: 0, sla_breach_pct: 0, score_medio: 0,
  followup_total: 0, followup_concluidos: 0, followup_compliance: null,
}

export async function getLojaFunilSaude(lojaId: string | number): Promise<SaudeFunilData> {
  try {
    const res = await fetch(`${API_BASE_URL}/lojas/${lojaId}/saude-funil`, {
      cache: 'no-store',
      headers: await getAuthHeaders(),
    })
    if (!res.ok) return SAUDE_ZERO
    const data = await res.json()
    return data.data ?? SAUDE_ZERO
  } catch { return SAUDE_ZERO }
}

export async function getMultiLojaFunilSaude(lojaIds: number[]): Promise<SaudeFunilData> {
  if (!lojaIds.length) return SAUDE_ZERO
  const results = await Promise.all(lojaIds.map(id => safeCall(() => getLojaFunilSaude(id), SAUDE_ZERO)))
  const merged = results.reduce((acc, s) => ({
    active_leads:        acc.active_leads        + s.active_leads,
    sla_breach_count:    acc.sla_breach_count    + s.sla_breach_count,
    sla_nao_atendido:    acc.sla_nao_atendido    + s.sla_nao_atendido,
    sla_parados:         acc.sla_parados         + s.sla_parados,
    sla_breach_pct:      0,
    score_medio:         0,
    followup_total:      acc.followup_total      + s.followup_total,
    followup_concluidos: acc.followup_concluidos + s.followup_concluidos,
    followup_compliance: null,
  }), SAUDE_ZERO)
  merged.sla_breach_pct = merged.active_leads > 0
    ? Math.round(merged.sla_breach_count / merged.active_leads * 1000) / 10
    : 0
  merged.followup_compliance = merged.followup_total > 0
    ? Math.round(merged.followup_concluidos / merged.followup_total * 1000) / 10
    : null
  // Score médio: média dos scores individuais
  const scores = results.filter(r => r.score_medio > 0).map(r => r.score_medio)
  merged.score_medio = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length * 10) / 10 : 0
  return merged
}

export async function getVnrStats(lojaIds?: number[]): Promise<VnrStatsData> {
  const qs = new URLSearchParams()
  if (lojaIds?.length) qs.set('loja_id', lojaIds.join(','))

  const headers = await getAuthHeaders()
  try {
    const res = await fetch(
      `${API_BASE_URL}/leads-vnr-stats${qs.toString() ? `?${qs}` : ''}`,
      { next: { revalidate: 60 }, headers }
    )
    if (!res.ok) return { total: 0, motivos: [] }
    const data = await res.json()
    if (!data.success) return { total: 0, motivos: [] }
    return { total: data.total, motivos: data.motivos }
  } catch {
    return { total: 0, motivos: [] }
  }
}


export interface AtendanteStats {
  total_atribuidos: number
  ativos: number
  por_status: Record<string, number>
  venda_realizada: number
  venda_nao_realizada: number
  taxa_conversao: number
  followups_atrasados: number
  followups_hoje: number
  leads_quentes_sem_contato: number
  sla_nao_atendido: number
  sla_negociacao: number
  leads_hoje: number
}

export async function getLojaAtendanteStats(
  lojaId: string | number,
  responsavelId: number,
): Promise<AtendanteStats> {
  const zero: AtendanteStats = {
    total_atribuidos: 0, ativos: 0, por_status: {},
    venda_realizada: 0, venda_nao_realizada: 0, taxa_conversao: 0,
    followups_atrasados: 0, followups_hoje: 0,
    leads_quentes_sem_contato: 0, sla_nao_atendido: 0, sla_negociacao: 0,
    leads_hoje: 0,
  }
  try {
    const response = await fetch(
      `${API_BASE_URL}/lojas/${lojaId}/atendente-stats?responsavel_id=${responsavelId}`,
      { cache: 'no-store', headers: await getAuthHeaders() }
    )
    if (!response.ok) return zero
    const data = await response.json()
    return data.data ?? zero
  } catch {
    return zero
  }
}

export async function getMultiLojaAtendanteStats(
  lojaIds: number[],
  responsavelId: number,
): Promise<AtendanteStats> {
  const zero: AtendanteStats = {
    total_atribuidos: 0, ativos: 0, por_status: {},
    venda_realizada: 0, venda_nao_realizada: 0, taxa_conversao: 0,
    followups_atrasados: 0, followups_hoje: 0,
    leads_quentes_sem_contato: 0, sla_nao_atendido: 0, sla_negociacao: 0,
    leads_hoje: 0,
  }
  if (!lojaIds.length) return zero
  const results = await Promise.all(
    lojaIds.map(id => safeCall(() => getLojaAtendanteStats(id, responsavelId), zero))
  )
  const merged = results.reduce((acc, s) => ({
    total_atribuidos:          acc.total_atribuidos + s.total_atribuidos,
    ativos:                    acc.ativos + s.ativos,
    por_status:                mergeStatusCounts(acc.por_status, s.por_status),
    venda_realizada:           acc.venda_realizada + s.venda_realizada,
    venda_nao_realizada:       acc.venda_nao_realizada + s.venda_nao_realizada,
    taxa_conversao:            0,
    followups_atrasados:       acc.followups_atrasados + s.followups_atrasados,
    followups_hoje:            acc.followups_hoje + s.followups_hoje,
    leads_quentes_sem_contato: acc.leads_quentes_sem_contato + s.leads_quentes_sem_contato,
    sla_nao_atendido:          acc.sla_nao_atendido + s.sla_nao_atendido,
    sla_negociacao:            acc.sla_negociacao + s.sla_negociacao,
    leads_hoje:                acc.leads_hoje + s.leads_hoje,
  }), zero)
  merged.taxa_conversao = merged.total_atribuidos > 0
    ? Math.round(merged.venda_realizada / merged.total_atribuidos * 1000) / 10
    : 0
  return merged
}

function mergeStatusCounts(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const out = { ...a }
  for (const [k, v] of Object.entries(b)) out[k] = (out[k] ?? 0) + v
  return out
}

export const getKanbanColumns = cache(async (lojaId: string | number): Promise<KanbanColuna[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/kanban-columns?loja_id=${lojaId}`, {
      next: { revalidate: 300 },
      headers: await getAuthHeaders(),
    })
    if (!response.ok) return DEFAULT_KANBAN_COLUNAS
    const data = await response.json()
    return data.data?.length ? data.data : DEFAULT_KANBAN_COLUNAS
  } catch {
    return DEFAULT_KANBAN_COLUNAS
  }
})

export async function getMultiLojaKanbanColumns(lojaIds: number[]): Promise<KanbanColuna[]> {
  if (!lojaIds.length) return DEFAULT_KANBAN_COLUNAS
  return getKanbanColumns(lojaIds[0])
}