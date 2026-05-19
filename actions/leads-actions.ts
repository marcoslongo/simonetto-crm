'use server'

import { getAllLeadsServer } from "@/lib/server-leads-service"
import { getLojaLeads } from "@/lib/api-loja"

export async function fetchAllLeadsForExport(lojaId?: number) {
  return getAllLeadsServer(lojaId)
}

export async function fetchLojaLeadsForExport(lojaId: number) {
  const { leads } = await getLojaLeads(lojaId, 1, 10000)
  return leads
}