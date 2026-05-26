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
