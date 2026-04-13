'use server'

import { getAllLeadsServer } from "@/lib/server-leads-service"

export async function fetchAllLeadsForExport(lojaId?: number) {
  return getAllLeadsServer(lojaId)
}