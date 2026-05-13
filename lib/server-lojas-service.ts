import { cookies } from 'next/headers'
import {
  buscarLojas,
  getLojas,
  getLojasComStats,
  getLojaById,
  getLojaStats,
  type BuscarLojasParams,
  type LojaWithStats,
  type PaginatedResult,
  type LojaStats,
} from './lojas-service'
import type { Loja } from './types'

async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get('auth_token')?.value ?? undefined
}

export async function buscarLojasServer(
  params: Omit<BuscarLojasParams, 'token'> = {}
): Promise<PaginatedResult<LojaWithStats>> {
  const token = await getToken()
  return buscarLojas({ ...params, token })
}

export async function getLojasServer(): Promise<Loja[]> {
  const token = await getToken()
  return getLojas(token)
}

export async function getLojasComStatsServer(): Promise<LojaWithStats[]> {
  const token = await getToken()
  return getLojasComStats(token)
}

export async function getLojaByIdServer(id: string | number): Promise<Loja> {
  const token = await getToken()
  return getLojaById(id, token)
}

export async function getLojaStatsServer(lojaId: string | number): Promise<LojaStats> {
  const token = await getToken()
  return getLojaStats(lojaId, token)
}
