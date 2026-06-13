import { requireAuth } from '@/lib/auth'
import { MetasClient } from './metas-client'

export const metadata = {
  title: 'Metas Comerciais | Noxus - Lead Ops',
}

export default async function MetasPage() {
  const user = await requireAuth()

  const lojaId    = String(user.loja_ids?.[0] ?? '')
  const isGerente = user.is_gerente || user.role === 'administrator'

  return (
    <MetasClient
      lojaId={lojaId}
      isGerente={isGerente}
      userId={user.id}
    />
  )
}
