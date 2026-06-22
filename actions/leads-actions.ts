'use server'

import { getAllLeadsServer, getLeadsServer } from "@/lib/server-leads-service"
import { getLojaLeads, getMultiLojaLeads, getConversaoPorLoja, getLojaFunilSaude } from "@/lib/api-loja"
import { getSession } from "@/lib/auth"

export interface ExportFilters {
  lojaId?: number
  from?: string
  to?: string
  origem?: 'industria' | 'proprio'
  status?: string[]
}

export async function fetchAllLeadsForExport(filters?: ExportFilters) {
  return getAllLeadsServer(
    filters?.lojaId,
    filters?.from,
    filters?.to,
    filters?.origem,
    filters?.status,
  )
}

export async function fetchLojaLeadsForExport(lojaId: number, responsavelId?: number) {
  const { leads } = await getLojaLeads(lojaId, 1, 10000, undefined, undefined, undefined, undefined, responsavelId)
  return leads
}

export async function fetchLojaLeadsPaginated(lojaId: number, page: number) {
  return getLojaLeads(lojaId, page, 10)
}

export async function fetchPerformanceFranqueadosForExport() {
  const conversoes = await getConversaoPorLoja()
  if (!conversoes.length) return []

  const saudeResults = await Promise.all(
    conversoes.map(async (c) => {
      const saude = await getLojaFunilSaude(c.loja_id)
      return { loja_id: c.loja_id, saude } as const
    })
  )
  const saudeMap = Object.fromEntries(saudeResults.map(d => [d.loja_id, d.saude]))

  return conversoes.map(c => ({
    loja_id: c.loja_id,
    loja_nome: c.loja_nome,
    total_leads: c.total_leads,
    vendas_realizadas: c.vendas_realizadas,
    em_negociacao: c.em_negociacao,
    nao_atendido: c.nao_atendido,
    taxa_conversao: c.taxa_conversao,
    active_leads: saudeMap[c.loja_id]?.active_leads ?? 0,
    sla_breach_count: saudeMap[c.loja_id]?.sla_breach_count ?? 0,
    sla_breach_pct: saudeMap[c.loja_id]?.sla_breach_pct ?? 0,
    sla_nao_atendido: saudeMap[c.loja_id]?.sla_nao_atendido ?? 0,
    followup_compliance: saudeMap[c.loja_id]?.followup_compliance ?? null,
  }))
}

const STATUS_PAGE_SIZE = 10

export async function fetchLeadsByStatusPaginated(params: {
  status: string
  page: number
  from?: string
  to?: string
}) {
  const session = await getSession()
  const isLojista = session?.user.role === 'loja' && !!session.user.loja_ids?.length

  if (isLojista) {
    // Filtragem server-side via endpoint dedicado por loja
    const lojaIds = session!.user.loja_ids
    const results = await Promise.all(
      lojaIds.map(id => getLojaLeads(id, params.page, STATUS_PAGE_SIZE, undefined, undefined, undefined, params.status))
    )
    const leads = results.flatMap(r => r.leads)
      .sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime())
    const total = results.reduce((s, r) => s + r.total, 0)
    const totalPages = Math.ceil(total / STATUS_PAGE_SIZE) || 1
    return { leads, total, totalPages }
  }

  const response = await getLeadsServer(
    params.page,
    STATUS_PAGE_SIZE,
    undefined,
    undefined,
    params.from,
    params.to,
    undefined,
    params.status
  )
  return {
    leads: response.leads,
    total: response.total,
    totalPages: response.total_pages,
  }
}
