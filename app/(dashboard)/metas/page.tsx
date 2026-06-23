import { requireAuth, isGerente, isSupervisor } from '@/lib/auth'
import { MetasClient } from './metas-client'

export const metadata = {
  title: 'Metas Comerciais | Noxus - Lead Ops',
}

export default async function MetasPage() {
  const user = await requireAuth()

  const lojaId          = String(user.loja_ids?.[0] ?? '')
  const gerenteFlag     = isGerente(user)
  const supervisorFlag  = isSupervisor(user)

  return (
    <MetasClient
      lojaId={lojaId}
      isGerente={gerenteFlag}
      isSupervisor={supervisorFlag}
      userId={user.id}
    />
  )
}
