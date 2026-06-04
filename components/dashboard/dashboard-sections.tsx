import {
  getLeadsStatsGeralServer,
  getLeadsStatsByOrigemServer,
  getLeadsStatsServiceServer,
  getTempoMedioPorLojaServer,
  getLeadsLast30DaysServer,
  getLeadsGeoStatsServer,
  getLeadsPorInvestimentoServer,
  getLeadsPorInteresseServer,
  getLeadsPorOrigemServer,
  getLeadsStatusTotalServer,
  getLeadsClassificacaoServer,
  getLeadsScoreDistribuicaoServer,
  getLeadsInvestimentoClassificacaoServer,
  getLeadsCampanhasUTMServer,
  getLeadsLandingPagesServer,
  getLeadsTrackingDeviceServer,
  getLeadsTrackingHorarioServer,
  getLeadsTrackingUtmContentServer,
  getLeadsTrackingMediumServer,
  getLeadsLast12MonthsServer,
} from '@/lib/server-leads-service'
import { getLojasServer } from '@/lib/server-lojas-service'
import { getMultiLojaFunilSaude } from '@/lib/api-loja'

import { StatsCards } from '@/components/dashboard/stats-cards'
import { StatsCardsOrigem } from '@/components/dashboard/stats-cards-origem'
import { KanbanStatsCards } from '@/components/dashboard/kanban-stats-cards'
import { formatLastCapture } from '@/lib/utils'
import ChartLeadsContato from '@/components/dashboard/chart-leads-contato'
import { ChartRankingLojas } from '@/components/dashboard/chart-ranking-lojas'
import { ChartLeads30Days } from '@/components/dashboard/chart-line-30-days'
import { ChartGeoBrasil } from '@/components/dashboard/chart-geo-brasil'
import { ChartBarInvest } from '@/components/dashboard/chart-bar-investment'
import { ChartPieInteresse } from '@/components/dashboard/chart-pie-interesse'
import { ChartPieOrigem } from './chart-pie-origem'
import { LeadsTemperature } from './leads-temperature'
import { ChartScoreHistogram } from './chart-score-histogram'
import { ChartInvestimentoClass } from './chart-investimento-class'
import { ChartCampanhasUTM } from './chart-campanhas-utm'
import { ChartLandingPages } from './chart-landing-pages'
import { ChartDeviceBreakdown } from './chart-device-breakdown'
import { ChartHorarioLeads } from './chart-horario-leads'
import { ChartUtmContentMedium } from './chart-utm-content-medium'
import { ChartLeads12Months } from './chart-leads-12-months'

export async function StatsSection() {
  const [statsGeral] = await Promise.all([
    getLeadsStatsGeralServer(),
  ])

  return (
    <StatsCards
      totalLeads={statsGeral.total}
      leadsHoje={statsGeral.today}
      ultimaCaptura={formatLastCapture(statsGeral.ultimaCaptura)}
    />
  )
}

export async function StatsByOrigemSection() {
  const { industria, proprio } = await getLeadsStatsByOrigemServer()

  return (
    <StatsCardsOrigem
      industria={{ total: industria.total, today: industria.today }}
      proprio={{ total: proprio.total, today: proprio.today }}
    />
  )
}

interface StatusStatsSectionProps {
  from?: string
  to?: string
}

export async function StatusStatsSection({ from, to }: StatusStatsSectionProps) {
  const statusTotal = await getLeadsStatusTotalServer(from, to)

  return (
    <KanbanStatsCards
      data={{
        venda_realizada: statusTotal.venda_realizada,
        venda_nao_realizada: statusTotal.venda_nao_realizada,
      }}
      colunas={[
        { id: 0, loja_id: 0, slug: 'venda_realizada',     label: 'Vendas Realizadas', cor: 'emerald', ordem: 0, fixo: 1 },
        { id: 0, loja_id: 0, slug: 'venda_nao_realizada', label: 'Vendas Perdidas',   cor: 'rose',    ordem: 1, fixo: 1 },
      ]}
      from={from}
      to={to}
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

interface LeadsTemperatureSectionProps {
  from?: string
  to?: string
}

export async function LeadsTemperatureSection({ from, to }: LeadsTemperatureSectionProps) {
  const statsClassificacao = await getLeadsClassificacaoServer(from, to)

  return (
    <LeadsTemperature
      quentes={statsClassificacao.quente}
      mornos={statsClassificacao.morno}
      frios={statsClassificacao.frio}
    />
  )
}

interface Leads30DaysSectionProps {
  from?: string
  to?: string
}

export async function Leads30DaysSection({ from, to }: Leads30DaysSectionProps = {}) {
  const leads30Days = await getLeadsLast30DaysServer(from, to)

  return <ChartLeads30Days data={leads30Days} />
}

export async function ComparativoSemanalSection() {
  const leads30Days = await getLeadsLast30DaysServer()

  const now = new Date()
  let thisWeek = 0, lastWeek = 0
  for (const { date, total } of leads30Days) {
    const d = new Date(date + 'T12:00:00')
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 7) thisWeek += total
    else if (diffDays < 14) lastWeek += total
  }

  const delta = lastWeek > 0 ? Math.round((thisWeek - lastWeek) / lastWeek * 100) : null
  const isPositive = delta !== null && delta >= 0

  return (
    <div className="shadow-md bg-linear-to-br from-slate-50 to-slate-100 rounded-2xl border border-border/50">
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/50">
        <div className="p-6">
          <p className="text-sm font-medium text-[#16255c] mb-1">Esta semana</p>
          <p className="text-4xl font-bold text-[#16255c]">{thisWeek.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-[#16255c]/60 mt-1">Leads nos últimos 7 dias</p>
        </div>
        <div className="p-6">
          <p className="text-sm font-medium text-[#16255c] mb-1">Semana passada</p>
          <p className="text-4xl font-bold text-[#16255c]">{lastWeek.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-[#16255c]/60 mt-1">Leads de 8–14 dias atrás</p>
        </div>
        <div className="p-6">
          <p className="text-sm font-medium text-[#16255c] mb-1">Variação semanal</p>
          {delta !== null ? (
            <p className={`text-4xl font-bold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{delta}%
            </p>
          ) : (
            <p className="text-4xl font-bold text-slate-400">—</p>
          )}
          <p className="text-xs text-[#16255c]/60 mt-1">vs semana anterior</p>
        </div>
      </div>
    </div>
  )
}

export async function SlaRedeSection() {
  const lojas = await getLojasServer()
  const lojaIds = lojas.map((l: any) => Number(l.id)).filter(Boolean)
  const saude = await getMultiLojaFunilSaude(lojaIds)

  if (saude.active_leads === 0) return null

  const isCritical = saude.sla_breach_pct >= 20
  const isWarning = !isCritical && saude.sla_breach_pct >= 10

  return (
    <div className={`rounded-2xl border p-5 ${
      isCritical
        ? 'bg-red-50 border-red-200'
        : isWarning
        ? 'bg-amber-50 border-amber-200'
        : 'bg-emerald-50 border-emerald-200'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            isCritical ? 'bg-red-100' : isWarning ? 'bg-amber-100' : 'bg-emerald-100'
          }`}>
            <svg className={`h-5 w-5 ${isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <p className={`font-semibold text-sm ${isCritical ? 'text-red-800' : isWarning ? 'text-amber-800' : 'text-emerald-800'}`}>
              SLA da Rede — {isCritical ? 'Nível Crítico' : isWarning ? 'Atenção Necessária' : 'Dentro do Normal'}
            </p>
            <p className={`text-xs mt-0.5 ${isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}`}>
              {saude.sla_breach_count} leads em breach de SLA ({saude.sla_breach_pct}% dos ativos)
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center">
            <p className={`text-2xl font-bold ${isCritical ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-emerald-700'}`}>{saude.active_leads}</p>
            <p className="text-xs text-slate-500 mt-0.5">Leads ativos</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${isCritical ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-emerald-700'}`}>{saude.sla_nao_atendido}</p>
            <p className="text-xs text-slate-500 mt-0.5">Sem contato</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${isCritical ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-emerald-700'}`}>{saude.sla_parados}</p>
            <p className="text-xs text-slate-500 mt-0.5">Parados</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function Leads12MonthsSection() {
  const data = await getLeadsLast12MonthsServer()

  return <ChartLeads12Months data={data} />
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
      <ChartPieOrigem initialData={origemData} />
    </div>
  )
}

interface ScoreInvestSectionProps {
  from?: string
  to?: string
}

export async function ScoreInvestSection({ from, to }: ScoreInvestSectionProps = {}) {
  const [scoreData, investData] = await Promise.all([
    getLeadsScoreDistribuicaoServer(from, to),
    getLeadsInvestimentoClassificacaoServer(from, to),
  ])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartScoreHistogram data={scoreData} />
      <ChartInvestimentoClass data={investData} />
    </div>
  )
}

export async function CampanhasLandingSection() {
  const [campanhas, landingPages, referrers] = await Promise.all([
    getLeadsCampanhasUTMServer(),
    getLeadsLandingPagesServer(),
    getLeadsLandingPagesServer(undefined, undefined, 'referrer'),
  ])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCampanhasUTM data={campanhas} />
      <ChartLandingPages landingPages={landingPages} referrers={referrers} />
    </div>
  )
}

export async function TrackingDetalheSection() {
  const [device, horario, utmContent, utmMedium] = await Promise.all([
    getLeadsTrackingDeviceServer(),
    getLeadsTrackingHorarioServer(),
    getLeadsTrackingUtmContentServer(),
    getLeadsTrackingMediumServer(),
  ])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartDeviceBreakdown data={device} />
        <ChartHorarioLeads data={horario} />
      </div>
      <ChartUtmContentMedium contentData={utmContent} mediumData={utmMedium} />
    </div>
  )
}

interface ScoreCampanhasSectionProps {
  from?: string
  to?: string
}

export async function ScoreCampanhasSection({ from, to }: ScoreCampanhasSectionProps = {}) {
  const campanhas = await getLeadsCampanhasUTMServer(from, to, 20)

  const comScore = campanhas.filter(c => c.score_medio != null && c.score_medio > 0)

  if (!campanhas.length) return null

  const avgScore = comScore.length
    ? Math.round(comScore.reduce((s, c) => s + (c.score_medio ?? 0), 0) / comScore.length * 10) / 10
    : null

  const sortedByScore = comScore.length >= 2
    ? [...comScore].sort((a, b) => (b.score_medio ?? 0) - (a.score_medio ?? 0))
    : null

  return (
    <div className="rounded-2xl border border-border/50 bg-linear-to-br from-slate-50 to-slate-100 shadow-md overflow-hidden">
      <div className="p-5 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
            <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-[#16255c]">Score Médio por Campanha</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Qualidade dos leads por origem de campanha
              {avgScore && <> · score médio da rede: <span className="font-semibold text-blue-600">{avgScore}</span></>}
            </p>
          </div>
        </div>
      </div>
      <div className="p-5">
        {sortedByScore ? (
          <>
            <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 border-b mb-1">
              <span className="col-span-2">Campanha</span>
              <span className="text-right">Leads</span>
              <span className="text-right">Score médio</span>
            </div>
            <div className="space-y-0.5">
              {sortedByScore.map((row) => {
                const scoreBar = Math.min(100, Math.round((row.score_medio ?? 0) / 100 * 100))
                const scoreColor = (row.score_medio ?? 0) >= (avgScore ?? 50) ? 'text-emerald-600' : 'text-amber-600'
                return (
                  <div key={row.utm_campaign} className="grid grid-cols-4 gap-2 text-xs py-2 rounded-md px-1 hover:bg-white/60 transition-colors">
                    <span className="col-span-2 text-slate-700 font-medium truncate" title={row.utm_campaign}>
                      {row.utm_campaign}
                    </span>
                    <span className="text-right text-slate-500 tabular-nums">{row.total}</span>
                    <span className={`text-right font-bold tabular-nums ${scoreColor}`}>
                      {row.score_medio?.toFixed(1) ?? '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="space-y-0.5">
            <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 border-b mb-1">
              <span className="col-span-2">Campanha</span>
              <span className="text-right">Leads</span>
            </div>
            {campanhas.map((row) => (
              <div key={row.utm_campaign} className="grid grid-cols-3 gap-2 text-xs py-2 rounded-md px-1 hover:bg-white/60 transition-colors">
                <span className="col-span-2 text-slate-700 font-medium truncate" title={row.utm_campaign}>
                  {row.utm_campaign}
                </span>
                <span className="text-right text-slate-500 tabular-nums">{row.total}</span>
              </div>
            ))}
            <p className="text-xs text-slate-400 text-center pt-3 pb-1">
              Score médio por campanha disponível após atualização do backend
            </p>
          </div>
        )}
      </div>
    </div>
  )
}