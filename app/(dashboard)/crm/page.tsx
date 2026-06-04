import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth'
import {
  getMultiLojaStats,
  getMultiLojaStatusFunil,
  getMultiLojaClassificacao,
  getMultiLojaKanbanColumns,
  getMultiLojaAtendanteStats,
  getMultiLojaFunilSaude,
} from '@/lib/api-loja'
import { getLojas } from '@/lib/api'
import { StatsCards } from '@/components/lojas/stats-cards'
import { KanbanStatsCards } from '@/components/dashboard/kanban-stats-cards'
import { LeadsTemperature } from '@/components/dashboard/leads-temperature'
import { AtendenteDashboard } from '@/components/dashboard/atendente-dashboard'
import {
  Store, AlertTriangle, ShieldCheck, Star, CheckCircle2,
  Activity, TrendingDown,
} from 'lucide-react'
import {
  StatsCardsSkeleton,
  KanbanStatsCardsSkeleton,
  ChartCardSkeleton,
} from '@/components/dashboard/dashboard-skeletons'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { SaudeFunilData } from '@/lib/api-loja'

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
  lojaIds, userId, userName,
}: { lojaIds: number[]; userId: number; userName: string }) {
  const [stats, colunas] = await Promise.all([
    getMultiLojaAtendanteStats(lojaIds, userId),
    getMultiLojaKanbanColumns(lojaIds),
  ])
  return <AtendenteDashboard stats={stats} userName={userName} colunas={colunas} />
}

async function SaudeOperacaoWrapper({ lojaIds }: { lojaIds: number[] }) {
  const saude = await getMultiLojaFunilSaude(lojaIds)
  return <SaudeOperacao saude={saude} />
}

function SaudeOperacao({ saude }: { saude: SaudeFunilData }) {
  const slaOk     = saude.sla_breach_pct < 10
  const slaWarn   = saude.sla_breach_pct >= 10 && saude.sla_breach_pct < 25
  const slaCrit   = saude.sla_breach_pct >= 25

  const compOk    = saude.followup_compliance !== null && saude.followup_compliance >= 80
  const compWarn  = saude.followup_compliance !== null && saude.followup_compliance >= 50 && saude.followup_compliance < 80
  const compCrit  = saude.followup_compliance !== null && saude.followup_compliance < 50

  const scoreOk   = saude.score_medio >= 35
  const scoreLow  = saude.score_medio > 0 && saude.score_medio < 20

  return (
    <div className="card-surface-elevated p-5 animate-section">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#16255c]/8">
          <Activity className="h-4 w-4 text-[#16255c]" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#16255c]">Saúde da Operação</h2>
          <p className="text-xs text-slate-500">{saude.active_leads} leads ativos · indicadores em tempo real</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* SLA */}
        <div className={cn(
          'rounded-xl border p-4',
          slaCrit ? 'bg-red-50 border-red-200' :
          slaWarn ? 'bg-amber-50 border-amber-200' :
          'bg-emerald-50 border-emerald-200',
        )}>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">SLA Breach</p>
            {slaCrit ? <AlertTriangle className="h-4 w-4 text-red-500" /> :
             slaWarn ? <AlertTriangle className="h-4 w-4 text-amber-500" /> :
             <ShieldCheck className="h-4 w-4 text-emerald-600" />}
          </div>
          <p className={cn(
            'text-3xl font-extrabold tabular-nums',
            slaCrit ? 'text-red-600' : slaWarn ? 'text-amber-600' : 'text-emerald-700',
          )}>
            {saude.sla_breach_pct}%
          </p>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            {saude.sla_breach_count} leads fora do prazo
          </p>
          <div className="mt-2 h-1 w-full rounded-full bg-white/60">
            <div
              className={cn('h-1 rounded-full transition-all duration-700',
                slaCrit ? 'bg-red-400' : slaWarn ? 'bg-amber-400' : 'bg-emerald-400')}
              style={{ width: `${Math.min(saude.sla_breach_pct * 2, 100)}%` }}
            />
          </div>
        </div>

        {/* Score médio */}
        <div className={cn(
          'rounded-xl border p-4',
          scoreOk   ? 'bg-blue-50 border-blue-200' :
          scoreLow  ? 'bg-orange-50 border-orange-200' :
          'bg-slate-50 border-slate-200',
        )}>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Score Médio</p>
            <Star className={cn('h-4 w-4', scoreOk ? 'text-blue-500' : scoreLow ? 'text-orange-400' : 'text-slate-400')} />
          </div>
          <p className={cn(
            'text-3xl font-extrabold tabular-nums',
            scoreOk ? 'text-blue-700' : scoreLow ? 'text-orange-600' : 'text-slate-500',
          )}>
            {saude.score_medio > 0 ? saude.score_medio : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {scoreOk ? 'carteira qualificada' : scoreLow ? 'leads de baixa intenção' : 'sem dados de score'}
          </p>
          <div className="mt-2 h-1 w-full rounded-full bg-white/60">
            <div
              className={cn('h-1 rounded-full transition-all duration-700',
                scoreOk ? 'bg-blue-400' : scoreLow ? 'bg-orange-400' : 'bg-slate-300')}
              style={{ width: `${Math.min(saude.score_medio, 100)}%` }}
            />
          </div>
        </div>

        {/* Follow-up compliance */}
        <div className={cn(
          'rounded-xl border p-4',
          compOk   ? 'bg-emerald-50 border-emerald-200' :
          compWarn ? 'bg-amber-50 border-amber-200' :
          compCrit ? 'bg-red-50 border-red-200' :
          'bg-slate-50 border-slate-200',
        )}>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Follow-up</p>
            {compOk   ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> :
             compCrit ? <TrendingDown className="h-4 w-4 text-red-500" /> :
             <AlertTriangle className="h-4 w-4 text-amber-500" />}
          </div>
          <p className={cn(
            'text-3xl font-extrabold tabular-nums',
            compOk ? 'text-emerald-700' : compCrit ? 'text-red-600' : compWarn ? 'text-amber-600' : 'text-slate-500',
          )}>
            {saude.followup_compliance !== null ? `${saude.followup_compliance}%` : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            {saude.followup_total > 0
              ? `${saude.followup_concluidos}/${saude.followup_total} concluídos`
              : 'sem follow-ups registrados'}
          </p>
          {saude.followup_compliance !== null && (
            <div className="mt-2 h-1 w-full rounded-full bg-white/60">
              <div
                className={cn('h-1 rounded-full transition-all duration-700',
                  compOk ? 'bg-emerald-400' : compCrit ? 'bg-red-400' : 'bg-amber-400')}
                style={{ width: `${saude.followup_compliance}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
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

  const isLoja    = user.role === 'loja'
  const lojaIds   = isLoja ? user.loja_ids : []
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

      {/* Saúde da Operação — só para gerentes */}
      {isLoja && isGerente && lojaIds.length > 0 && (
        <Suspense fallback={<Skeleton className="h-44 rounded-2xl" />}>
          <SaudeOperacaoWrapper lojaIds={lojaIds} />
        </Suspense>
      )}

      {/* Stats gerais da loja */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCardsWrapper lojaIds={lojaIds} />
      </Suspense>

      {/* Status do Funil */}
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
