import { requireAuth } from '@/lib/auth'
import { getLeads } from '@/lib/api'
import { KanbanColumns } from '@/components/leads/kanban-columns'

export const metadata = {
  title: 'Atendimentos | Noxus - Lead Ops',
  description: 'Gerencie os atendimentos da sua unidade',
}

export default async function CrmAtendimentoPage() {
  const user = await requireAuth()

  const lojaId = user.loja_id ?? undefined

  const { leads } = await getLeads({ page: 1, per_page: 100, loja_id: lojaId })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Atendimentos</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie os leads da sua unidade: {user.loja_nome || user.name}
        </p>
      </div>

      <KanbanColumns leads={leads} />
    </div>
  )
}