import {
  getLeadsStatsGeralServer,
  getLeadsStatsServiceServer,
  getTempoMedioPorLojaServer,
  getLeadsLast30DaysServer,
  getLeadsGeoStatsServer,
  getLeadsPorInvestimentoServer,
  getLeadsPorInteresseServer,
  getLeadsPorOrigemServer,
} from '@/lib/server-leads-service'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { formatLastCapture } from '@/lib/utils'
import ChartLeadsContato from '@/components/dashboard/chart-leads-contato'
import { ChartRankingLojas } from '@/components/dashboard/chart-ranking-lojas'
import { ChartLeads30Days } from '@/components/dashboard/chart-line-30-days'
import { ChartGeoBrasil } from '@/components/dashboard/chart-geo-brasil'
import { ChartBarInvest } from '@/components/dashboard/chart-bar-investment'
import { ChartPieInteresse } from '@/components/dashboard/chart-pie-interesse'
import { ChartPieOrigem } from './chart-pie-origem'

export async function StatsSection() {
  const statsGeral = await getLeadsStatsGeralServer()

  return (
    <StatsCards
      totalLeads={statsGeral.total}
      leadsHoje={statsGeral.today}
      ultimaCaptura={formatLastCapture(statsGeral.ultimaCaptura)}
    />
  )
}

export async function ContatoRankingSection() {
  const [contatoStats, tempoPorLoja] = await Promise.all([
    getLeadsStatsServiceServer(),
    getTempoMedioPorLojaServer(),
  ])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartLeadsContato
        contatados={contatoStats.leadsContatados}
        naoContatados={contatoStats.leadsNaoContatados}
        tempoMedioAtendimentoMinutos={contatoStats.tempoMedioMinutos}
        percentContatados={contatoStats.percContatados}
        percentNaoContatados={contatoStats.percNaoContatados}
      />
      <ChartRankingLojas data={tempoPorLoja.data} />
    </div>
  )
}

export async function Leads30DaysSection() {
  const leads30Days = await getLeadsLast30DaysServer()

  return <ChartLeads30Days data={leads30Days} />
}

export async function GeoInvestSection() {
  const [estadosGroup, faturamentoPorFaixa] = await Promise.all([
    getLeadsGeoStatsServer(),
    getLeadsPorInvestimentoServer(),
  ])

  const estadoChartData = Object.entries(estadosGroup)
    .map(([estado, info]: any) => ({
      estado,
      total: info.total,
      lojas: info.lojas || [],
    }))
    .sort((a, b) => b.total - a.total)

  const faturamentoChartData = Object.entries(faturamentoPorFaixa).map(
    ([faixa, total]) => ({ faixa, total })
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartGeoBrasil data={estadoChartData} />
      <ChartBarInvest data={faturamentoChartData} />
    </div>
  )
}

export async function InteresseSection() {
  const [interessePorGrupo, origemData] = await Promise.all([
    getLeadsPorInteresseServer(),
    getLeadsPorOrigemServer(),
  ])

  const interesseChartData = Object.entries(interessePorGrupo)
    .map(([interesse, total]) => ({ interesse, total }))
    .sort((a, b) => b.total - a.total)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartPieInteresse data={interesseChartData} />
      <ChartPieOrigem data={origemData} />
    </div>
  )
}