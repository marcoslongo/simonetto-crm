import { requireAuth } from '@/lib/auth'
import { KanbanColumns } from '@/components/leads/kanban-columns'
import { getLojaLeads } from '@/lib/api-loja'
import { classificarLead } from '@/lib/lead-score' // 👈 IMPORTANTE

export const metadata = {
  title: 'Atendimentos | Noxus - Lead Ops',
  description: 'Gerencie os atendimentos da sua unidade',
}

export default async function CrmAtendimentoPage() {
  const user = await requireAuth()

  const lojaId = user.loja_id

  if (!lojaId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">
            Atendimentos
          </h2>
          <p className="text-muted-foreground mt-1">
            Nenhuma loja vinculada ao seu usuário.
          </p>
        </div>
      </div>
    )
  }

  const { leads } = await getLojaLeads(lojaId, 1, 200)

  const leadsComScore = leads.map((lead) => {
    const { score, classificacao } = classificarLead(lead)

    return {
      ...lead,
      score,
      classificacao,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">
          Atendimentos
        </h2>
        <p className="text-muted-foreground mt-1">
          Gerencie os leads da sua unidade: {user.loja_nome || user.name}
        </p>
      </div>

      <KanbanColumns leads={leadsComScore} />
    </div>
  )
}