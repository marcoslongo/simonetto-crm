'use server'

import { redirect } from 'next/navigation'
import { setSession, clearSession, getSession, getRedirectPath } from '@/lib/auth'
import type { Session, User } from '@/lib/types'

// Simula autenticação com WordPress
// Em produção, isso usaria a API real do WordPress
async function mockAuthenticate(email: string, password: string): Promise<Session | null> {
  // Usuários de demonstração
  const mockUsers: Record<string, { password: string; user: User }> = {
    'admin@empresa.com': {
      password: 'admin123',
      user: {
        id: 1,
        email: 'admin@empresa.com',
        name: 'Administrador',
        role: 'administrator',
        loja_id: null,
      },
    },
    'loja1@empresa.com': {
      password: 'loja123',
      user: {
        id: 2,
        email: 'loja1@empresa.com',
        name: 'Loja São Paulo',
        role: 'loja',
        loja_id: 101,
        loja_nome: 'Loja São Paulo - Centro',
      },
    },
    'loja2@empresa.com': {
      password: 'loja123',
      user: {
        id: 3,
        email: 'loja2@empresa.com',
        name: 'Loja Rio de Janeiro',
        role: 'loja',
        loja_id: 102,
        loja_nome: 'Loja Rio - Copacabana',
      },
    },
  }

  const userRecord = mockUsers[email]
  
  if (!userRecord || userRecord.password !== password) {
    return null
  }

  return {
    user: userRecord.user,
    token: `mock_token_${userRecord.user.id}_${Date.now()}`,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

export type LoginState = {
  error?: string
  success?: boolean
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email e senha são obrigatórios' }
  }

  try {
    // Em produção, usar: authenticateUser(email, password)
    const session = await mockAuthenticate(email, password)

    if (!session) {
      return { error: 'Email ou senha inválidos' }
    }

    await setSession(session)
    
    // Redireciona baseado no role
    const redirectPath = getRedirectPath(session.user)
    redirect(redirectPath)
  } catch (error) {
    // Se for um redirect, propaga
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    
    console.error('Erro no login:', error)
    return { error: 'Erro ao fazer login. Tente novamente.' }
  }
}

export async function logoutAction(): Promise<void> {
  await clearSession()
  redirect('/login')
}

export async function checkAuthAction(): Promise<Session | null> {
  return getSession()
}
