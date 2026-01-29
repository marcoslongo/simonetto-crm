import { cookies } from 'next/headers'
import type { 
  Lead, 
  LeadsResponse, 
  LeadResponse, 
  LojasResponse, 
  LeadsFilters,
  User,
  Session
} from './types'

// =====================================
// CONFIGURAÇÃO DA API
// =====================================

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

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Adiciona autenticação se necessário
  if (requireAuth && token) {
    headers['Authorization'] = `Bearer ${token}`
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
  // Usa Application Passwords ou JWT do WordPress
  const response = await fetch(`${API_BASE_URL}/jwt-auth/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Credenciais inválidas')
  }

  const data = await response.json()
  
  // Busca informações adicionais do usuário (loja_id, role)
  const userInfo = await fetchUserInfo(data.token)

  return {
    user: userInfo,
    token: data.token,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
  }
}

async function fetchUserInfo(token: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/wp/v2/users/me?context=edit`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error('Falha ao buscar informações do usuário')
  }

  const wpUser = await response.json()
  
  // Determina o role do usuário
  const isAdmin = wpUser.roles?.includes('administrator')
  
  return {
    id: wpUser.id,
    email: wpUser.email,
    name: wpUser.name,
    role: isAdmin ? 'administrator' : 'loja',
    loja_id: wpUser.meta?.loja_id || null,
    loja_nome: wpUser.meta?.loja_nome || undefined,
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
  if (filters.loja_id) params.set('loja_id', String(filters.loja_id))

  const queryString = params.toString()
  const endpoint = `/api/v1/leads${queryString ? `?${queryString}` : ''}`
  
  return fetchApi<LeadsResponse>(endpoint)
}

export async function getLeadById(id: number): Promise<LeadResponse> {
  return fetchApi<LeadResponse>(`/api/v1/leads/${id}`)
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
  // Busca todos os leads para calcular estatísticas
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
