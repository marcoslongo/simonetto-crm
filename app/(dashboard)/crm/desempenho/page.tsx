import { Suspense } from 'react'
import { requireGerente } from '@/lib/auth'
import {
  getMultiLojaLeads30Days,
  getMultiLojaLeads12Months,
  getVnrStats,
  getMultiLojaStatusFunil,
  getConversaoPorLoja,
  getFunilPorAtendente,
  getTempoPorEtapa,
  getMultiLojaKanbanColumns,
} from '@/lib/api-loja'
import { ChartLeads12Months } from '@/components/dashboard/chart-leads-12-months'
import { ChartLeads30Days } from '@/components/lojas/chart-line-30-days'
import { ChartVnrMotivos } from '@/components/dashboard/chart-vnr-motivos'
import { ChartFunilKanban } from '@/components/dashboard/chart-funil-kanban'
import { ChartConversaoPorLoja } from '@/components/dashboard/chart-conversao-por-loja'
import { ChartFunilPorAtendente } from '@/components/dashboard/chart-funil-por-atendente'
import { ChartTempoPorEtapa } from '@/components/dashboard/chart-tempo-por-etapa'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertTriangle,
  BarChart2,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react'

export const metadata = {
  title: 'Desempenho | Noxus - Lead Ops',
  description: 'Análise guiada do funil de vendas',
}

function ChartSkeleton({ height = 'h-80' }: { height?: string }) {
  return <Skeleton className={`w-full ${height} rounded-xl`} />
}

function SectionHeader({
  step,
  title,
  description,
}: {
  step: string
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#16255c] text-white text-xs font-bold">
        {step}
      </div>
      <div>
        <h3 className="text-lg font-bold text-[#16255c] leading-tight">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
  )
}

// ─── Data wrappers ───────────────────────────────────────────────────────────

async function FunilChart({ lojaIds }: { lojaIds: number[] }) {
  const [counts, colunas] = await Promise.all([
    getMultiLojaStatusFunil(lojaIds),
    getMultiLojaKanbanColumns(lojaIds),
  ])
  return <ChartFunilKanban counts={counts} colunas={colunas} />
}

async function Leads30DaysChart({ lojaIds }: { lojaIds: number[] }) {
  const data = await getMultiLojaLeads30Days(lojaIds)
  return <ChartLeads30Days data={data} lojaIds={lojaIds} />
}

async function Leads12MonthsChart({ lojaIds }: { lojaIds: number[] }) {
  const data = await getMultiLojaLeads12Months(lojaIds)
  return <ChartLeads12Months data={data} lojaId={lojaIds[0]} />
}

async function VnrChart({ lojaIds }: { lojaIds: number[] }) {
  const data = await getVnrStats(lojaIds)
  return <ChartVnrMotivos initialData={data} isAdmin={false} lojaIds={lojaIds} />
}

async function ConversaoChart({ lojaIds }: { lojaIds: number[] }) {
  const data = await getConversaoPorLoja(lojaIds)
  return <ChartConversaoPorLoja data={data} />
}

async function TempoPorEtapaChart({ lojaIds }: { lojaIds: number[] }) {
  const data = await getTempoPorEtapa(lojaIds)
  return <ChartTempoPorEtapa data={data} />
}

async function FunilAtendenteChart({ lojaIds }: { lojaIds: number[] }) {
  const data = await getFunilPorAtendente(lojaIds)
  return <ChartFunilPorAtendente data={data} />
}

// ─── Insights automáticos ────────────────────────────────────────────────────

async function InsightsBlock({ lojaIds }: { lojaIds: number[] }) {
  const [counts, colunas, vnr, conversao, etapas] = await Promise.all([
    getMultiLojaStatusFunil(lojaIds),
    getMultiLojaKanbanColumns(lojaIds),
    getVnrStats(lojaIds),
    getConversaoPorLoja(lojaIds),
    getTempoPorEtapa(lojaIds),
  ])

  const insights: { icon: typeof TrendingUp; color: string; text: string }[] = []

  // Conversão geral
  const totalAll = Object.values(counts).reduce((s, v) => s + v, 0)
  const vendas = counts['venda_realizada'] ?? 0
  const convRate = totalAll > 0 ? Math.round(vendas / totalAll * 100) : 0

  if (convRate < 10 && totalAll > 10) {
    insights.push({
      icon: TrendingDown,
      color: 'text-red-600 bg-red-50 border-red-200',
      text: `Taxa de conversão em ${convRate}% — abaixo do esperado. Revise o processo de abordagem.`,
    })
  } else if (convRate >= 20) {
    insights.push({
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      text: `Ótima conversão: ${convRate}% dos leads se tornaram vendas.`,
    })
  }

  // Gargalo no funil — etapa com mais tempo
  const etapasAtivas = etapas.filter(e => e.tipo === 'ativo' && e.tempo_medio_horas > 0)
  if (etapasAtivas.length > 0) {
    const gargalo = etapasAtivas.reduce((max, e) =>
      e.tempo_medio_horas > max.tempo_medio_horas ? e : max
    )
    const dias = Math.round(gargalo.tempo_medio_horas / 24)
    if (dias >= 2) {
      insights.push({
        icon: AlertTriangle,
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        text: `Gargalo detectado: leads ficam em média ${dias} dia${dias > 1 ? 's' : ''} na etapa "${gargalo.label}".`,
      })
    }
  }

  // Principal motivo de VNR
  if (vnr.motivos.length > 0) {
    const top = vnr.motivos[0]
    insights.push({
      icon: BarChart2,
      color: 'text-slate-700 bg-slate-50 border-slate-200',
      text: `Principal motivo de perda: "${top.label}" (${top.pct}% das vendas não realizadas).`,
    })
  }

  // Melhor loja
  if (conversao.length > 1) {
    const sorted = [...conversao].sort((a, b) => b.taxa_conversao - a.taxa_conversao)
    const best = sorted[0]
    if (best.taxa_conversao > 0) {
      insights.push({
        icon: TrendingUp,
        color: 'text-blue-700 bg-blue-50 border-blue-200',
        text: `Melhor unidade: ${best.loja_nome} com ${best.taxa_conversao.toFixed(1)}% de conversão.`,
      })
    }
  }

  // Nao atendidos represados
  const naoAtendidos = counts['nao_atendido'] ?? 0
  if (naoAtendidos > 20) {
    insights.push({
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50 border-red-200',
      text: `${naoAtendidos} leads não atendidos acumulados. Risco alto de perda por demora no primeiro contato.`,
    })
  }

  if (insights.length === 0) {
    insights.push({
      icon: TrendingUp,
      color: 'text-slate-500 bg-slate-50 border-slate-200',
      text: 'Dados insuficientes para gerar insights. Continue alimentando o funil.',
    })
  }

  return (
    <div className="rounded-2xl border border-[#16255c]/20 bg-[#16255c]/3 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#16255c]">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#16255c]">Insights automáticos</h4>
          <p className="text-[11px] text-slate-500">Gerados a partir dos dados do período</p>
        </div>
      </div>
      <div className="space-y-2">
        {insights.map((item, i) => (
          <div key={i} className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm ${item.color}`}>
            <item.icon className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-snug">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function DesempenhoPage() {
  const user = await requireGerente()
  const isLoja = user.role === 'loja'
  const lojaIds = isLoja ? user.loja_ids : []

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Desempenho</h2>
        <p className="text-muted-foreground mt-1">Análise guiada do funil de vendas da sua unidade</p>
      </div>

      {/* ── Seção 1: O que aconteceu? ─────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          step="1"
          title="O que aconteceu?"
          description="Volume de leads, conversão geral e evolução no tempo"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Suspense fallback={<ChartSkeleton />}>
            <FunilChart lojaIds={lojaIds} />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <Leads30DaysChart lojaIds={lojaIds} />
          </Suspense>
        </div>
        <Suspense fallback={<ChartSkeleton height="h-64" />}>
          <Leads12MonthsChart lojaIds={lojaIds} />
        </Suspense>
      </section>

      {/* ── Seção 2: Por que aconteceu? ──────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          step="2"
          title="Por que aconteceu?"
          description="Causas de perda, origens e desempenho por unidade"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Suspense fallback={<ChartSkeleton />}>
            <VnrChart lojaIds={lojaIds} />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <ConversaoChart lojaIds={lojaIds} />
          </Suspense>
        </div>
      </section>

      {/* ── Seção 3: Onde está o gargalo? ────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          step="3"
          title="Onde está o gargalo?"
          description="Tempo por etapa, SLA e desempenho individual da equipe"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Suspense fallback={<ChartSkeleton />}>
            <TempoPorEtapaChart lojaIds={lojaIds} />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <FunilAtendenteChart lojaIds={lojaIds} />
          </Suspense>
        </div>
      </section>

      {/* ── Seção 4: O que fazer agora? ─────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          step="4"
          title="O que fazer agora?"
          description="Insights gerados automaticamente a partir dos seus dados"
        />
        <Suspense fallback={<ChartSkeleton height="h-48" />}>
          <InsightsBlock lojaIds={lojaIds} />
        </Suspense>
      </section>
    </div>
  )
}
