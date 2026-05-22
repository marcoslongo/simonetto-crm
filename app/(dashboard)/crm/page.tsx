import { requireAuth } from '@/lib/auth'
import { getMultiLojaStats, getMultiLojaStatusFunil, getMultiLojaClassificacao } from '@/lib/api-loja'
import { getLojas } from '@/lib/api'
import { StatsCards } from '@/components/lojas/stats-cards'
import { KanbanStatsCards } from '@/components/dashboard/kanban-stats-cards'
import { LeadsTemperature } from '@/components/dashboard/leads-temperature'
import { FunilStatus } from '@/components/lojas/funil-status'
import { Store } from 'lucide-react'

export const metadata = {
  title: 'Resumo | Noxus - Lead Ops',
  description: 'Visão geral da sua unidade',
}

export default async function CrmDashboardPage() {
  const user = await requireAuth()

  const isLoja = user.role === 'loja'
  const lojaIds = isLoja ? user.loja_ids : []

  const [stats, statusFunil, classificacao, lojasData] = await Promise.all([
    getMultiLojaStats(lojaIds),
    getMultiLojaStatusFunil(lojaIds),
    getMultiLojaClassificacao(lojaIds),
    isLoja && lojaIds.length > 1
      ? getLojas().catch(() => ({ success: false, lojas: [] }))
      : Promise.resolve({ success: false, lojas: [] }),
  ])

  const lojasVinculadas = lojasData.lojas.filter(l => lojaIds.includes(Number(l.id)))

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

      {isLoja && lojaIds.length > 1 && (
        <div
          className="flex items-start gap-3 rounded-lg border px-4 py-3 text-sm"
          style={{ borderColor: '#c7cfe8', backgroundColor: '#eef0f8', color: '#16255c' }}
        >
          <Store className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <span className="font-medium">Lojas vinculadas ao seu usuário:</span>
            <span className="ml-1">
              {lojasVinculadas.length > 0
                ? lojasVinculadas.map(l => l.nome).join(' · ')
                : lojaIds.map(id => `#${id}`).join(' · ')}
            </span>
          </div>
        </div>
      )}

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
