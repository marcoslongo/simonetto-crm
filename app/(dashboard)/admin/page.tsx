import { requireAdmin } from '@/lib/auth'
import { getLeadsStats, getLeads, getLojas, getFaturamentoStats, getInteresseStats, getLojaStats, getLeadsLast30Days, getEstadoStats, getLeadsStatsService } from '@/lib/leads-service'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { formatLastCapture } from '@/lib/utils'
import { ChartBarInvest } from '@/components/dashboard/chart-bar-investment'
import { ChartPieInteresse } from '@/components/dashboard/chart-pie-interesse'
import { ChartLeads30Days } from '@/components/dashboard/chart-line-30-days'
import { ChartGeoBrasil } from '@/components/dashboard/chart-geo-brasil'
import ChartLeadsContato from '@/components/dashboard/chart-leads-contato'

export const metadata = {
  title: 'Todos os Leads | Noxus - Lead Ops',
  description: 'Gestão de leads de todas as unidades',
}

interface AdminLeadsPageProps {
  searchParams: Promise<{ page?: string; loja?: string }>
}

export default async function AdminLeadsPage({ searchParams }: AdminLeadsPageProps) {
  await requireAdmin()
  const params = await searchParams

  const page = Number(params.page) || 1
  const lojaId = params.loja ? Number(params.loja) : undefined

  const [
    leadsResponse,
    lojasData,
    stats,
    faturamentoPorFaixa,
    interessePorGrupo,
    lojasGroup,
    leads30Days,
    estadosGroup,
    contatoStats,
  ] = await Promise.all([
    getLeads(page, 10, lojaId),
    getLojas().catch(() => ({ lojas: [] })),
    getLeadsStats(lojaId),
    getFaturamentoStats(lojaId),
    getInteresseStats(lojaId),
    getLojaStats(lojaId),
    getLeadsLast30Days(lojaId),
    getEstadoStats(lojaId),
    getLeadsStatsService(),
  ])

  const faturamentoChartData = Object.entries(faturamentoPorFaixa).map(
    ([faixa, total]) => ({ faixa, total })
  )

  const interesseChartData = Object.entries(interessePorGrupo)
    .map(([interesse, total]) => ({ interesse, total }))
    .sort((a, b) => b.total - a.total)

  const lojaChartData = Object.entries(lojasGroup)
    .map(([loja, total]) => ({ loja, total }))
    .sort((a, b) => b.total - a.total)

  const estadoChartData = Object.entries(estadosGroup)
    .map(([estado, total]) => ({ estado, total }))
    .sort((a, b) => b.total - a.total)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Visão geral do desempenho de leads e lojas
        </p>
      </div>

      <StatsCards
        totalLeads={stats.total}
        leadsHoje={stats.today}
        ultimaCaptura={formatLastCapture(stats.ultimaCaptura)}
      />

      <ChartLeadsContato
        contatados={contatoStats.leadsContatados}
        naoContatados={contatoStats.leadsNaoContatados}
        tempoMedioAtendimentoMinutos={contatoStats.tempoMedioMinutos}
        percentContatados={contatoStats.percContatados}
        percentNaoContatados={contatoStats.percNaoContatados}
      />

      <div>
        <ChartLeads30Days data={leads30Days} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ChartGeoBrasil data={estadoChartData} />
        <ChartBarInvest data={faturamentoChartData} />
      </div>

      <div>
        <ChartPieInteresse data={interesseChartData} />
      </div>
    </div>
  )
}