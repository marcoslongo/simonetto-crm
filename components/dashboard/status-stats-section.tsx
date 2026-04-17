import { getLeadsStatusTotalServer } from '@/lib/server-leads-service'
import { KanbanStatsCards } from './kanban-stats-cards'

interface StatusStatsSectionProps {
  from?: string
  to?: string
  lojaId?: number
}

export async function StatusStatsSection({ from, to, lojaId }: StatusStatsSectionProps) {
  const statusTotal = await getLeadsStatusTotalServer(from, to, lojaId)

  return (
    <KanbanStatsCards
      data={{
        nao_atendido: statusTotal.nao_atendido,
        em_negociacao: statusTotal.em_negociacao,
        venda_realizada: statusTotal.venda_realizada,
        venda_nao_realizada: statusTotal.venda_nao_realizada,
      }}
    />
  )
}