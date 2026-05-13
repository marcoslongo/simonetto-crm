'use server'

import { requireAuth } from '@/lib/auth'
import { authenticateUser, changePassword } from '@/lib/api'

export type ConfigState = {
  error?: string
  success?: boolean
}

export async function changePasswordAction(
  _prevState: ConfigState,
  formData: FormData
): Promise<ConfigState> {
  const user = await requireAuth()

  const senhaAtual = formData.get('senha_atual') as string
  const novaSenha = formData.get('nova_senha') as string
  const confirmarSenha = formData.get('confirmar_senha') as string

  if (!senhaAtual || !novaSenha || !confirmarSenha) {
    return { error: 'Todos os campos são obrigatórios' }
  }

  if (novaSenha.length < 8) {
    return { error: 'A nova senha deve ter no mínimo 8 caracteres' }
  }

  if (novaSenha !== confirmarSenha) {
    return { error: 'A nova senha e a confirmação não coincidem' }
  }

  try {
    await authenticateUser(user.email, senhaAtual)
  } catch {
    return { error: 'Senha atual incorreta' }
  }

  try {
    await changePassword(user.id, novaSenha)
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Erro ao alterar a senha. Tente novamente.' }
  }
}
