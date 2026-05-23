import { requireAuth } from '@/lib/auth'
import { KanbanColumns } from '@/components/leads/kanban-columns'
import { getMultiLojaLeads } from '@/lib/api-loja'
import { getLojas } from '@/lib/api'

export const metadata = {
  title: 'Atendimentos | Noxus - Lead Ops',
  description: 'Gerencie os atendimentos da sua unidade',
}

export default async function CrmAtendimentoPage() {
  const user = await requireAuth()

  const lojaIds = user.loja_ids

  if (!lojaIds.length) {
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

  const [{ leads }, lojasData] = await Promise.all([
    getMultiLojaLeads(lojaIds, 200),
    getLojas().catch(() => ({ success: false, lojas: [] })),
  ])

  const lojas = lojasData.lojas
    .filter(l => lojaIds.includes(Number(l.id)))
    .map(l => ({ id: Number(l.id), nome: l.nome }))

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

      <KanbanColumns
        leads={leads}
        lojaIds={lojaIds}
        lojas={lojas}
        currentUser={{ id: user.id, nome: user.name }}
      />
    </div>
  )
}