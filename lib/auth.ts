import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Session, User, UserRole } from './types'

// =====================================
// CONSTANTES
// =====================================

const SESSION_COOKIE = 'crm_session'
const AUTH_TOKEN_COOKIE = 'auth_token'

// =====================================
// GERENCIAMENTO DE SESSÃO
// =====================================

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE)

  if (!sessionCookie?.value) {
    return null
  }

  try {
    const session: Session = JSON.parse(sessionCookie.value)

    // Verifica se a sessão expirou
    if (new Date(session.expires) < new Date()) {
      await clearSession()
      return null
    }

    // Migra sessões no formato antigo (loja_id → loja_ids)
    const u = session.user as User & { loja_id?: number | null }
    if (!Array.isArray(u.loja_ids)) {
      u.loja_ids = u.loja_id ? [u.loja_id] : []
      delete u.loja_id
    }
    // Garante campo is_master em sessões antigas
    if (u.is_master === undefined) {
      u.is_master = false
    }

    return session
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()
  return session?.user || null
}

export async function setSession(session: Session): Promise<void> {
  const cookieStore = await cookies()
  
  // Salva a sessão
  cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(session.expires),
    path: '/',
  })

  // Salva o token separadamente para uso na API
  cookieStore.set(AUTH_TOKEN_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(session.expires),
    path: '/',
  })
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  cookieStore.delete(AUTH_TOKEN_COOKIE)
}

// =====================================
// VERIFICAÇÕES DE PERMISSÃO
// =====================================

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  return user
}

export async function requireRole(allowedRoles: UserRole[]): Promise<User> {
  const user = await requireAuth()
  
  if (!allowedRoles.includes(user.role)) {
    redirect('/unauthorized')
  }

  return user
}

export async function requireAdmin(): Promise<User> {
  return requireRole(['administrator'])
}

export async function requireMaster(): Promise<User> {
  const user = await requireAdmin()
  if (!isMaster(user)) {
    redirect('/admin')
  }
  return user
}

export async function requireLoja(): Promise<User> {
  return requireRole(['loja', 'administrator'])
}

export async function requireGerente(): Promise<User> {
  const user = await requireLoja()
  if (!isGerente(user)) {
    redirect('/crm')
  }
  return user
}

// =====================================
// UTILITÁRIOS
// =====================================

export function isMaster(user: User): boolean {
  return user.role === 'administrator' && user.is_master === true
}

export function isAdmin(user: User): boolean {
  return user.role === 'administrator'
}

export function isGerente(user: User): boolean {
  return isAdmin(user) || user.is_gerente === true
}

export function canAccessLoja(user: User, lojaId: number): boolean {
  if (isAdmin(user)) return true
  return user.loja_ids.includes(lojaId)
}

export function canAccessLead(user: User, leadLojaId: number | null): boolean {
  if (isAdmin(user)) return true
  if (!leadLojaId) return false
  return user.loja_ids.includes(leadLojaId)
}

/** Apenas masters podem ver leads de origem 'proprio' */
export function canAccessProprioLeads(user: User): boolean {
  return isMaster(user)
}

export function getRedirectPath(user: User): string {
  return isAdmin(user) ? '/admin' : '/crm'
}
