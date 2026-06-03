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

  let all
  if (isLojista) {
    const { leads } = await getMultiLojaLeads(session!.user.loja_ids, 1000)
    all = leads.filter(l => (l.status ?? 'nao_atendido') === params.status)
  } else {
    all = await getAllLeadsServer(undefined, params.from, params.to, undefined, [params.status])
  }

  const total = all.length
  const totalPages = Math.ceil(total / STATUS_PAGE_SIZE) || 1
  const leads = all.slice((params.page - 1) * STATUS_PAGE_SIZE, params.page * STATUS_PAGE_SIZE)
  return { leads, total, totalPages }
}
