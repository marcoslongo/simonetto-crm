import { requireAuth, isGerente } from '@/lib/auth'
import { AgendaCompartilhadaView } from '@/components/crm/agenda-compartilhada-view'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Agenda da Loja | Noxus - Lead Ops',
}

export default async function AgendaCompartilhadaPage() {
  const user = await requireAuth()

  // Somente usuários vinculados a uma loja (ou admin) têm acesso
  const lojaId = user.loja_ids[0]
  if (!lojaId && user.role !== 'administrator') {
    redirect('/crm')
  }

  const primaryLojaId = user.role === 'administrator' ? null : lojaId

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#16255c]">
          Agenda da Loja
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Agenda compartilhada · todos da equipe visualizam e podem agendar
        </p>
      </div>

      <AgendaCompartilhadaView
        lojaId={primaryLojaId}
        lojaIds={user.loja_ids}
        isAdmin={user.role === 'administrator'}
        isGerente={isGerente(user)}
        currentUserId={user.id}
        currentUserName={user.name}
      />
    </div>
  )
}
