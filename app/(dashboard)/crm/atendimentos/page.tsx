import { requireAuth } from '@/lib/auth'
import { KanbanColumns } from '@/components/leads/kanban-columns'
import { ChartFunilKanban } from '@/components/dashboard/chart-funil-kanban'
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

  const funilData = {
    nao_atendido:        leads.filter(l => (l.status ?? 'nao_atendido') === 'nao_atendido').length,
    em_negociacao:       leads.filter(l => l.status === 'em_negociacao').length,
    venda_realizada:     leads.filter(l => l.status === 'venda_realizada').length,
    venda_nao_realizada: leads.filter(l => l.status === 'venda_nao_realizada').length,
  }

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

      <ChartFunilKanban {...funilData} />

      <KanbanColumns
        leads={leads}
        lojaIds={lojaIds}
        lojas={lojas}
        currentUser={{ id: user.id, nome: user.name }}
      />
    </div>
  )
}