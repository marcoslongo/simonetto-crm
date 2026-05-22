import { requireAuth } from '@/lib/auth'
import { getLojaStats, getLojaStatusFunil, getLojaClassificacao } from '@/lib/api-loja'
import { StatsCards } from '@/components/lojas/stats-cards'
import { KanbanStatsCards } from '@/components/dashboard/kanban-stats-cards'
import { LeadsTemperature } from '@/components/dashboard/leads-temperature'
import { FunilStatus } from '@/components/lojas/funil-status'

export const metadata = {
  title: 'Resumo | Noxus - Lead Ops',
  description: 'Visão geral da sua unidade',
}

export default async function CrmDashboardPage() {
  const user = await requireAuth()

  const isLoja = user.role === 'loja'
  const lojaId = isLoja ? (user.loja_ids[0] ?? undefined) : undefined

  const [stats, statusFunil, classificacao] = await Promise.all([
    getLojaStats(String(lojaId)),
    getLojaStatusFunil(String(lojaId)),
    getLojaClassificacao(String(lojaId)),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Resumo</h2>
        <p className="text-muted-foreground mt-1">
          {isLoja
            ? `Visão geral da sua unidade: ${user.loja_nome || user.name}`
            : 'Visão geral de todas as unidades'}
        </p>
      </div>

      <StatsCards stats={stats} />

      <KanbanStatsCards
        data={statusFunil}
        description="Acompanhamento da jornada de vendas da sua unidade"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FunilStatus data={statusFunil} />
        <LeadsTemperature
          quentes={classificacao.quente}
          mornos={classificacao.morno}
          frios={classificacao.frio}
        />
      </div>
    </div>
  )
}
