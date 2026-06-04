import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth'
import {
  getMultiLojaStats,
  getMultiLojaStatusFunil,
  getMultiLojaClassificacao,
  getMultiLojaKanbanColumns,
  getMultiLojaAtendanteStats,
} from '@/lib/api-loja'
import { getLojas } from '@/lib/api'
import { StatsCards } from '@/components/lojas/stats-cards'
import { KanbanStatsCards } from '@/components/dashboard/kanban-stats-cards'
import { LeadsTemperature } from '@/components/dashboard/leads-temperature'
import { AtendenteDashboard } from '@/components/dashboard/atendente-dashboard'
import { Store } from 'lucide-react'
import {
  StatsCardsSkeleton,
  KanbanStatsCardsSkeleton,
  ChartCardSkeleton,
} from '@/components/dashboard/dashboard-skeletons'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Resumo | Noxus - Lead Ops',
  description: 'Visão geral da sua unidade',
}

async function StatsCardsWrapper({ lojaIds }: { lojaIds: number[] }) {
  const stats = await getMultiLojaStats(lojaIds)
  return <StatsCards stats={stats} />
}

async function KanbanStatsWrapper({ lojaIds }: { lojaIds: number[] }) {
  const [statusFunil, colunas] = await Promise.all([
    getMultiLojaStatusFunil(lojaIds),
    getMultiLojaKanbanColumns(lojaIds),
  ])
  return (
    <KanbanStatsCards
      data={statusFunil}
      colunas={colunas}
      description="Acompanhamento da jornada de vendas da sua unidade"
    />
  )
}

async function LeadsTemperatureWrapper({ lojaIds }: { lojaIds: number[] }) {
  const classificacao = await getMultiLojaClassificacao(lojaIds)
  return (
    <LeadsTemperature
      quentes={classificacao.quente}
      mornos={classificacao.morno}
      frios={classificacao.frio}
    />
  )
}

async function AtendenteDashboardWrapper({
  lojaIds,
  userId,
  userName,
}: {
  lojaIds: number[]
  userId: number
  userName: string
}) {
  const [stats, colunas] = await Promise.all([
    getMultiLojaAtendanteStats(lojaIds, userId),
    getMultiLojaKanbanColumns(lojaIds),
  ])
  return <AtendenteDashboard stats={stats} userName={userName} colunas={colunas} />
}

function AtendenteDashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

export default async function CrmDashboardPage() {
  const user = await requireAuth()

  const isLoja = user.role === 'loja'
  const lojaIds = isLoja ? user.loja_ids : []
  const isGerente = user.is_gerente

  const lojasVinculadas =
    isLoja && lojaIds.length > 1
      ? await getLojas()
          .then(r => r.lojas.filter(l => lojaIds.includes(Number(l.id))))
          .catch(() => [])
      : []

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

      {/* Dashboard pessoal — só para atendentes (não gerentes) */}
      {isLoja && !isGerente && (
        <div className="rounded-2xl border border-border/50 bg-white p-5 shadow-sm">
          <Suspense fallback={<AtendenteDashboardSkeleton />}>
            <AtendenteDashboardWrapper
              lojaIds={lojaIds}
              userId={user.id}
              userName={user.name}
            />
          </Suspense>
        </div>
      )}

      {/* Stats gerais da loja */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCardsWrapper lojaIds={lojaIds} />
      </Suspense>

      {/* Status do Funil — único bloco, sem redundância */}
      <Suspense fallback={<KanbanStatsCardsSkeleton />}>
        <KanbanStatsWrapper lojaIds={lojaIds} />
      </Suspense>

      {/* Temperatura */}
      <Suspense fallback={<ChartCardSkeleton height="h-56" />}>
        <LeadsTemperatureWrapper lojaIds={lojaIds} />
      </Suspense>
    </div>
  )
}
