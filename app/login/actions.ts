'use server'

import { redirect } from 'next/navigation'
import { setSession, getRedirectPath } from '@/lib/auth'
import type { Session } from '@/lib/types'
import { authenticateUser } from '@/lib/api'
import { clearSession } from '@/lib/auth'

export type LoginState = {
  error?: string
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
    const session: Session | null = await authenticateUser(email, password)

    if (!session) {
      return { error: 'Email ou senha inválidos' }
    }

    await setSession(session)

    const redirectPath = getRedirectPath(session.user)
    redirect(redirectPath)
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    console.error('Erro no login:', error)
    return { error: 'Erro ao fazer login. Tente novamente.' }
  }
}

export async function logoutAction() {
  await clearSession()
  redirect('/login')
}