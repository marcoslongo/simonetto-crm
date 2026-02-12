import type { Loja } from '@/lib/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://manager.simonetto.com.br'

export interface LojaWithStats extends Loja {
  totalLeads: number
  leadsHoje: number
}

export interface LojasResponse {
  success: boolean
  lojas: Loja[]
  total: number
}

export interface LojasWithStatsResponse {
  success: boolean
  lojas: LojaWithStats[]
  total: number
}

const defaultFetchOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
  cache: 'no-store',
}

async function handleApiError(response: Response, endpoint: string) {
  const errorText = await response.text()
  console.error(`Erro na API [${endpoint}]:`, {
    status: response.status,
    statusText: response.statusText,
    error: errorText,
  })
  throw new Error(`Falha ao acessar ${endpoint}: ${response.status} ${response.statusText}`)
}

export async function getLojas(): Promise<Loja[]> {
  const endpoint = `${API_BASE_URL}/lojas`

  try {
    const response = await fetch(endpoint, defaultFetchOptions)

    if (!response.ok) {
      await handleApiError(response, 'getLojas')
    }

    const data: LojasResponse = await response.json()

    if (!data.success) {
      throw new Error('API retornou sucesso = false')
    }

    console.log(`✅ ${data.lojas.length} lojas carregadas`)
    return data.lojas
  } catch (error) {
    console.error('Erro ao buscar lojas:', error)
    throw error
  }
}


export async function getLojasComStats(): Promise<LojaWithStats[]> {
  const endpoint = `${API_BASE_URL}/lojas-with-stats`

  try {
    const response = await fetch(endpoint, defaultFetchOptions)

    if (!response.ok) {
      await handleApiError(response, 'getLojasComStats')
    }

    const data: LojasWithStatsResponse = await response.json()

    if (!data.success) {
      throw new Error('API retornou sucesso = false')
    }
    
    return data.lojas
  } catch (error) {
    console.error('Erro ao buscar lojas com stats:', error)
    throw error
  }
}

export async function getLojaById(id: string | number): Promise<Loja> {
  const endpoint = `${API_BASE_URL}/wp-json/api/v1/lojas/${id}`

  try {
    const response = await fetch(endpoint, defaultFetchOptions)

    if (!response.ok) {
      await handleApiError(response, `getLojaById(${id})`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error('API retornou sucesso = false')
    }

    console.log(`✅ Loja ${id} carregada`)
    return data.loja
  } catch (error) {
    console.error(`Erro ao buscar loja ${id}:`, error)
    throw error
  }
}

export interface LojaStats {
  total: number
  today: number
  thisWeek?: number
  thisMonth?: number
}

export async function getLojaStats(lojaId: string | number): Promise<LojaStats> {
  const endpoint = `${API_BASE_URL}/wp-json/api/v1/leads-stats/${lojaId}`

  try {
    const response = await fetch(endpoint, defaultFetchOptions)

    if (!response.ok) {
      await handleApiError(response, `getLojaStats(${lojaId})`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error('API retornou sucesso = false')
    }

    return data.stats
  } catch (error) {
    console.error(`Erro ao buscar stats da loja ${lojaId}:`, error)
    throw error
  }
}

export function filtrarLojas(
  lojas: LojaWithStats[],
  searchQuery: string
): LojaWithStats[] {
  if (!searchQuery) return lojas

  const query = searchQuery.toLowerCase()

  return lojas.filter((loja) => {
    return (
      loja.nome.toLowerCase().includes(query) ||
      loja.cidade?.toLowerCase().includes(query) ||
      loja.estado?.toLowerCase().includes(query) ||
      loja.localizacao.toLowerCase().includes(query) ||
      loja.emails?.some((e) => e.email.toLowerCase().includes(query))
    )
  })
}

export type SortBy = 
  | 'nome' 
  | 'nome-desc' 
  | 'leads-desc' 
  | 'leads-asc' 
  | 'hoje-desc' 
  | 'hoje-asc' 
  | 'localizacao'

export function ordenarLojas(
  lojas: LojaWithStats[],
  sortBy: SortBy = 'nome'
): LojaWithStats[] {
  const lojasOrdenadas = [...lojas]

  lojasOrdenadas.sort((a, b) => {
    switch (sortBy) {
      case 'nome':
        return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
      
      case 'nome-desc':
        return b.nome.localeCompare(a.nome, 'pt-BR', { sensitivity: 'base' })
      
      case 'leads-desc':
        return b.totalLeads - a.totalLeads
      
      case 'leads-asc':
        return a.totalLeads - b.totalLeads
      
      case 'hoje-desc':
        return b.leadsHoje - a.leadsHoje
      
      case 'hoje-asc':
        return a.leadsHoje - b.leadsHoje
      
      case 'localizacao':
        return a.localizacao.localeCompare(b.localizacao, 'pt-BR', {
          sensitivity: 'base',
        })
      
      default:
        return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
    }
  })

  return lojasOrdenadas
}

export interface PaginationParams {
  page: number
  perPage: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export function paginarLojas<T>(
  lojas: T[],
  { page, perPage }: PaginationParams
): PaginatedResult<T> {
  const total = lojas.length
  const totalPages = Math.ceil(total / perPage)
  const start = (page - 1) * perPage
  const end = start + perPage
  const items = lojas.slice(start, end)

  return {
    items,
    total,
    page,
    perPage,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}

export interface BuscarLojasParams {
  search?: string
  sortBy?: SortBy
  page?: number
  perPage?: number
}

export async function buscarLojas(
  params: BuscarLojasParams = {}
): Promise<PaginatedResult<LojaWithStats>> {
  const {
    search = '',
    sortBy = 'nome',
    page = 1,
    perPage = 9,
  } = params

  const todasLojas = await getLojasComStats()

  const lojasFiltradas = filtrarLojas(todasLojas, search)

  const lojasOrdenadas = ordenarLojas(lojasFiltradas, sortBy)

  const resultado = paginarLojas(lojasOrdenadas, { page, perPage })

  return resultado
}