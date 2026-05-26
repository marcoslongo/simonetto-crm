'use server'

import { getAllLeadsServer } from "@/lib/server-leads-service"
import { getLojaLeads } from "@/lib/api-loja"

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

const STATUS_PAGE_SIZE = 10

export async function fetchLeadsByStatusPaginated(params: {
  status: string
  page: number
  from?: string
  to?: string
}) {
  const all = await getAllLeadsServer(
    undefined,
    params.from,
    params.to,
    undefined,
    [params.status],
  )
  const total = all.length
  const totalPages = Math.ceil(total / STATUS_PAGE_SIZE) || 1
  const leads = all.slice((params.page - 1) * STATUS_PAGE_SIZE, params.page * STATUS_PAGE_SIZE)
  return { leads, total, totalPages }
}
