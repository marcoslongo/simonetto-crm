import { cookies } from 'next/headers'
import type { 
  Lead, 
  LeadsResponse, 
  LeadResponse, 
  LojasResponse, 
  LeadsFilters,
  User,
  Session,
  AuthResponse
} from './types'

const API_BASE_URL = process.env.WORDPRESS_API_URL || 'https://manager.simonetto.com.br/wp-json'

// =====================================
// CLIENTE DE API (SERVER-SIDE)
// =====================================

async function fetchApi<T>(
  endpoint: string, 
  options: RequestInit = {},
  requireAuth: boolean = true
): Promise<T> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (requireAuth && token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    cache: options.cache || 'no-store',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ mensagem: 'Erro desconhecido' }))
    throw new Error(error.mensagem || `HTTP Error: ${response.status}`)
  }

  return response.json()
}

// =====================================
// AUTENTICAÇÃO
// =====================================

export async function authenticateUser(
  username: string, 
  password: string
): Promise<Session> {
  const response = await fetch(`${API_BASE_URL}/jwt-auth/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Credenciais inválidas')
  }

  const data: AuthResponse = await response.json()
  
  const normalizedRole = data.role.includes('administrator') ? 'administrator' : 'loja'

  const user: User = {
    id: data.user_id,
    email: data.user_email,
    name: data.user_display_name,
    nicename: data.user_nicename,
    role: normalizedRole,
    loja_id: data.acf?.loja_id ? Number(data.acf.loja_id) : null,
    loja_nome: data.user_display_name
  }

  return {
    user,
    token: data.token,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

export async function validateToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/jwt-auth/v1/token/validate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    return response.ok
  } catch {
    return false
  }
}

// =====================================
// LEADS
// =====================================

export async function getLeads(filters: LeadsFilters = {}): Promise<LeadsResponse> {
  const params = new URLSearchParams()
  
  if (filters.page) params.set('page', String(filters.page))
  if (filters.per_page) params.set('per_page', String(filters.per_page))
  if (filters.email) params.set('email', filters.email)
  
  // Só adiciona o filtro de loja_id se ele for fornecido
  if (filters.loja_id !== undefined && filters.loja_id !== null) {
    params.set('loja_id', String(filters.loja_id))
  }

  const queryString = params.toString()
  const endpoint = `/api/v1/leads${queryString ? `?${queryString}` : ''}`
  
  return fetchApi<LeadsResponse>(endpoint)
}

// =====================================
// LOJAS
// =====================================

export async function getLojas(): Promise<LojasResponse> {
  return fetchApi<LojasResponse>('/api/v1/lojas', {}, false)
}

// =====================================
// ESTATÍSTICAS
// =====================================

export async function getDashboardStats(lojaId?: number): Promise<{
  totalLeads: number
  leadsHoje: number
  ultimoLead: Lead | null
}> {
  const filters: LeadsFilters = { per_page: 1000 }
  if (lojaId) filters.loja_id = lojaId
  
  const response = await getLeads(filters)
  
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  
  const leadsHoje = response.leads.filter(lead => {
    const dataLead = new Date(lead.data_criacao)
    return dataLead >= hoje
  })
  
  return {
    totalLeads: response.total,
    leadsHoje: leadsHoje.length,
    ultimoLead: response.leads[0] || null,
  }
}
