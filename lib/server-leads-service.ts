/**
 * server-leads-service.ts
 *
 * Wrapper server-only do leads-service.
 * Lê o auth_token do cookie e injeta em todas as chamadas.
 *
 * ⚠️  Importe este arquivo APENAS em Server Components, Server Actions e Route Handlers.
 *     Para Client Components, use leads-service.ts diretamente (sem auth).
 */

import { cookies } from 'next/headers'
import {
  getLeads,
  getAllLeads,
  getLeadById,
  getLojas,
  getLojasWithStats,
  getLeadsStatsGeral,
  getLeadsPorInvestimento,
  getLeadsByDate,
  getLeadsPorInteresse,
  getLeadsPorLoja,
  getLeadsLast30Days,
  getLeadsGeoStats,
  getLeadsGeoStatsByEstado,
  getLeadsStatsService,
  getTempoMedioPorLoja,
  registrarContatoLead,
  createLead,
  getLeadsPorOrigem,
  type LojaGeo,
  type EstadoGeoStat,
  type OrigemItem,
} from './leads-service'
import type { Lead, LeadsResponse, TimeStoreResponse } from './types'

// Re-exporta tipos para quem importar daqui
export type { LojaGeo, EstadoGeoStat, OrigemItem }

async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get('auth_token')?.value ?? undefined
}

export async function getLeadsServer(
  page = 1,
  perPage = 10,
  lojaId?: number,
  search?: string,
  from?: string,
  to?: string
): Promise<LeadsResponse> {
  const token = await getToken()
  return getLeads(page, perPage, lojaId, search, from, to, token)
}

export async function getAllLeadsServer(lojaId?: number): Promise<Lead[]> {
  const token = await getToken()
  return getAllLeads(lojaId, token)
}

export async function getLeadByIdServer(id: number): Promise<Lead | null> {
  const token = await getToken()
  return getLeadById(id, token)
}

export async function getLojasServer() {
  const token = await getToken()
  return getLojas(token)
}

export async function getLojasWithStatsServer() {
  const token = await getToken()
  return getLojasWithStats(token)
}

export async function getLeadsStatsGeralServer() {
  const token = await getToken()
  return getLeadsStatsGeral(token)
}

export async function getLeadsPorInvestimentoServer() {
  const token = await getToken()
  return getLeadsPorInvestimento(token)
}

export async function getLeadsByDateServer(date: string) {
  const token = await getToken()
  return getLeadsByDate(date, token)
}

export async function getLeadsPorInteresseServer() {
  const token = await getToken()
  return getLeadsPorInteresse(token)
}

export async function getLeadsPorLojaServer() {
  const token = await getToken()
  return getLeadsPorLoja(token)
}

export async function getLeadsLast30DaysServer(from?: string, to?: string) {
  const token = await getToken()
  return getLeadsLast30Days(from, to, token)
}

export async function getLeadsGeoStatsServer(
  estado?: string,
  from?: string,
  to?: string
): Promise<Record<string, { total: number; lojas: LojaGeo[] }>> {
  const token = await getToken()
  return getLeadsGeoStats(estado, from, to, token)
}

export async function getLeadsGeoStatsByEstadoServer(
  estado: string,
  from?: string,
  to?: string
): Promise<EstadoGeoStat | null> {
  const token = await getToken()
  return getLeadsGeoStatsByEstado(estado, from, to, token)
}

export async function getLeadsStatsServiceServer() {
  const token = await getToken()
  return getLeadsStatsService(token)
}

export async function getTempoMedioPorLojaServer(): Promise<TimeStoreResponse> {
  const token = await getToken()
  return getTempoMedioPorLoja(token)
}

export async function registrarContatoLeadServer(params: {
  lead_id: number
  tipo_contato: string
  usuario_id?: number
  observacao?: string
}) {
  const token = await getToken()
  return registrarContatoLead(params, token)
}

export async function createLeadServer(leadData: {
  nome: string
  email: string
  telefone: string
  cidade?: string
  estado?: string
  interesse?: string
  expectativa_investimento?: string
  loja_regiao?: string
  mensagem?: string
  loja_id?: number
  pipefy_card_id?: string
}) {
  const token = await getToken()
  return createLead(leadData, token)
}

export async function getLeadsPorOrigemServer(from?: string, to?: string): Promise<OrigemItem[]> {
  const token = await getToken()
  return getLeadsPorOrigem(from, to, token)
}