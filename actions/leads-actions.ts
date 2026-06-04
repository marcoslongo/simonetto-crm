'use server'

import { getAllLeadsServer } from "@/lib/server-leads-service"
import { getLojaLeads, getMultiLojaLeads } from "@/lib/api-loja"
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

export async function fetchLojaLeadsForExport(lojaId: number) {
  const { leads } = await getLojaLeads(lojaId, 1, 10000)
  return leads
}

export async function fetchLojaLeadsPaginated(lojaId: number, page: number) {
  return getLojaLeads(lojaId, page, 10)
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

  const all = await getAllLeadsServer(undefined, params.from, params.to, undefined, [params.status])
  const total = all.length
  const totalPages = Math.ceil(total / STATUS_PAGE_SIZE) || 1
  const leads = all.slice((params.page - 1) * STATUS_PAGE_SIZE, params.page * STATUS_PAGE_SIZE)
  return { leads, total, totalPages }
}
