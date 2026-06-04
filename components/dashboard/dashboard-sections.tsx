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
import { getMultiLojaFunilSaude, getConversaoPorLoja, getTodasLojasSaude } from '@/lib/api-loja'
import Link from 'next/link'

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
  const lojasInput = lojas.map((l: any) => ({ id: Number(l.id), nome: l.nome })).filter((l: any) => l.id)

  const todasSaude = await getTodasLojasSaude(lojasInput)

  const saude = todasSaude.reduce(
    (acc, s) => ({
      active_leads:        acc.active_leads        + s.active_leads,
      sla_breach_count:    acc.sla_breach_count    + s.sla_breach_count,
      sla_nao_atendido:    acc.sla_nao_atendido    + s.sla_nao_atendido,
      sla_parados:         acc.sla_parados         + s.sla_parados,
      sla_breach_pct:      0,
      score_medio:         0,
      followup_total:      acc.followup_total      + s.followup_total,
      followup_concluidos: acc.followup_concluidos + s.followup_concluidos,
      followup_compliance: null,
    }),
    { active_leads: 0, sla_breach_count: 0, sla_nao_atendido: 0, sla_parados: 0, sla_breach_pct: 0, score_medio: 0, followup_total: 0, followup_concluidos: 0, followup_compliance: null as null }
  )
  saude.sla_breach_pct = saude.active_leads > 0
    ? Math.round(saude.sla_breach_count / saude.active_leads * 1000) / 10
    : 0

  if (saude.active_leads === 0) return null

  const isCritical = saude.sla_breach_pct >= 20
  const isWarning = !isCritical && saude.sla_breach_pct >= 10
  const colorKey = isCritical ? 'red' : isWarning ? 'amber' : 'emerald'
  const colorMap = {
    red:     { border: 'border-red-200',     bg: 'bg-red-50',     icon: 'bg-red-100',     text: 'text-red-800',     sub: 'text-red-600',     num: 'text-red-700',     title: 'Nível Crítico' },
    amber:   { border: 'border-amber-200',   bg: 'bg-amber-50',   icon: 'bg-amber-100',   text: 'text-amber-800',   sub: 'text-amber-600',   num: 'text-amber-700',   title: 'Atenção Necessária' },
    emerald: { border: 'border-emerald-200', bg: 'bg-emerald-50', icon: 'bg-emerald-100', text: 'text-emerald-800', sub: 'text-emerald-600', num: 'text-emerald-700', title: 'Dentro do Normal' },
  }
  const c = colorMap[colorKey]

  const criticas = todasSaude
    .filter(l => l.sla_breach_count > 0)
    .sort((a, b) => b.sla_breach_pct - a.sla_breach_pct)
    .slice(0, 5)

  return (
    <div className={`rounded-2xl border p-5 space-y-4 ${c.bg} ${c.border}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.icon}`}>
            <svg className={`h-5 w-5 ${c.sub}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <p className={`font-semibold text-sm ${c.text}`}>
              SLA da Rede — {c.title}
            </p>
            <p className={`text-xs mt-0.5 ${c.sub}`}>
              {saude.sla_breach_count} leads em breach de SLA ({saude.sla_breach_pct}% dos ativos)
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center">
            <p className={`text-2xl font-bold ${c.num}`}>{saude.active_leads}</p>
            <p className="text-xs text-slate-500 mt-0.5">Leads ativos</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${c.num}`}>{saude.sla_nao_atendido}</p>
            <p className="text-xs text-slate-500 mt-0.5">Sem contato</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${c.num}`}>{saude.sla_parados}</p>
            <p className="text-xs text-slate-500 mt-0.5">Parados</p>
          </div>
        </div>
      </div>

      {criticas.length > 0 && (isCritical || isWarning) && (
        <div className="border-t border-current/10 pt-4">
          <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${c.sub}`}>
            Lojas com maior SLA breach
          </p>
          <div className="flex flex-wrap gap-2">
            {criticas.map(l => (
              <Link
                key={l.loja_id}
                href={`/admin/lojas/${l.loja_id}`}
                className={`flex items-center gap-2 rounded-lg bg-white/70 border px-2.5 py-1.5 hover:bg-white transition-colors ${c.border}`}
              >
                <span className="text-xs font-medium text-slate-700 truncate max-w-28">{l.loja_nome}</span>
                <span className={`text-xs font-bold ${c.sub}`}>{l.sla_breach_pct}%</span>
                <span className="text-xs text-slate-400">({l.sla_breach_count} leads)</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export async function Leads12MonthsSection() {
  const data = await getLeadsLast12MonthsServer()

  return <ChartLeads12Months data={data} />
}

interface ConversaoRedeSectionProps {
  from?: string
  to?: string
}

export async function ConversaoRedeSection({ from, to }: ConversaoRedeSectionProps = {}) {
  const [statusTotal, conversaoPorLoja] = await Promise.all([
    getLeadsStatusTotalServer(from, to),
    getConversaoPorLoja([], from, to),
  ])

  const total =
    statusTotal.venda_realizada +
    statusTotal.venda_nao_realizada +
    statusTotal.em_negociacao +
    statusTotal.nao_atendido

  const taxaConversao = total > 0
    ? Math.round(statusTotal.venda_realizada / total * 1000) / 10
    : 0

  const lojasComDados = conversaoPorLoja.filter(l => l.total_leads > 0)
  const lojasAcimaMedia = lojasComDados.filter(l => l.taxa_conversao >= taxaConversao).length
  const lojasAbaixoMedia = lojasComDados.length - lojasAcimaMedia

  return (
    <div className="shadow-md bg-linear-to-br from-slate-50 to-slate-100 rounded-2xl border border-border/50">
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border/50">
        <div className="p-5">
          <p className="text-xs font-medium text-[#16255c]/70 uppercase tracking-wide mb-2">Taxa de Conversão</p>
          <p className="text-4xl font-bold text-[#16255c]">{taxaConversao}%</p>
          <p className="text-xs text-[#16255c]/60 mt-1">Média da rede</p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-[#16255c]/70 uppercase tracking-wide mb-2">Vendas Realizadas</p>
          <p className="text-4xl font-bold text-emerald-600">{statusTotal.venda_realizada.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-[#16255c]/60 mt-1">de {total.toLocaleString('pt-BR')} leads</p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-[#16255c]/70 uppercase tracking-wide mb-2">Em Negociação</p>
          <p className="text-4xl font-bold text-blue-600">{statusTotal.em_negociacao.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-[#16255c]/60 mt-1">Pipeline ativo</p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-[#16255c]/70 uppercase tracking-wide mb-2">Lojas vs Média</p>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-emerald-600">{lojasAcimaMedia}↑</p>
            <p className="text-2xl font-bold text-red-500">{lojasAbaixoMedia}↓</p>
          </div>
          <p className="text-xs text-[#16255c]/60 mt-1">acima / abaixo da média</p>
        </div>
      </div>
    </div>
  )
}

interface TopBottomConversoesSectionProps {
  from?: string
  to?: string
}

export async function TopBottomConversoesSection({ from, to }: TopBottomConversoesSectionProps = {}) {
  const conversaoPorLoja = await getConversaoPorLoja([], from, to)

  const comDados = conversaoPorLoja.filter(l => l.total_leads >= 3)
  if (comDados.length < 2) return null

  const sorted = [...comDados].sort((a, b) => b.taxa_conversao - a.taxa_conversao)
  const top5 = sorted.slice(0, 5)
  const bottom5 = sorted.slice(-5).reverse()
  const avg = comDados.reduce((s, l) => s + l.taxa_conversao, 0) / comDados.length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Top 5 */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          <p className="font-semibold text-emerald-800">Top 5 Conversores</p>
          <span className="ml-auto text-xs text-emerald-600">média: {avg.toFixed(1)}%</span>
        </div>
        <div className="space-y-2">
          {top5.map((loja, i) => (
            <Link key={loja.loja_id} href={`/admin/lojas/${loja.loja_id}`} className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-2.5 hover:bg-white transition-colors">
              <span className="text-xs font-bold text-emerald-600 w-5">{i + 1}º</span>
              <span className="flex-1 text-sm font-medium text-slate-700 truncate">{loja.loja_nome}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-400">{loja.vendas_realizadas}/{loja.total_leads}</span>
                <span className="text-sm font-bold text-emerald-600 w-12 text-right">{loja.taxa_conversao}%</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom 5 */}
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          <p className="font-semibold text-red-700">Precisam de Atenção</p>
          <span className="ml-auto text-xs text-red-500">abaixo de {avg.toFixed(1)}%</span>
        </div>
        <div className="space-y-2">
          {bottom5.map((loja, i) => (
            <Link key={loja.loja_id} href={`/admin/lojas/${loja.loja_id}`} className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-2.5 hover:bg-white transition-colors">
              <span className="text-xs font-bold text-red-500 w-5">{sorted.length - bottom5.length + i + 1}º</span>
              <span className="flex-1 text-sm font-medium text-slate-700 truncate">{loja.loja_nome}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-400">{loja.vendas_realizadas}/{loja.total_leads}</span>
                <span className="text-sm font-bold text-red-500 w-12 text-right">{loja.taxa_conversao}%</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
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

interface OrigemConversaoSectionProps {
  from?: string
  to?: string
}

export async function OrigemConversaoSection({ from, to }: OrigemConversaoSectionProps = {}) {
  const [industria, proprio, statusIndustria, statusProprio] = await Promise.all([
    getLeadsStatsGeralServer('industria'),
    getLeadsStatsGeralServer('proprio'),
    getLeadsStatusTotalServer(from, to, undefined, 'industria'),
    getLeadsStatusTotalServer(from, to, undefined, 'proprio'),
  ])

  const calcTaxa = (status: typeof statusIndustria) => {
    const total = status.venda_realizada + status.venda_nao_realizada + status.em_negociacao + status.nao_atendido
    return total > 0 ? Math.round(status.venda_realizada / total * 1000) / 10 : null
  }

  const taxaIndustria = calcTaxa(statusIndustria)
  const taxaProprio = calcTaxa(statusProprio)
  const totalLeads = (industria.total || 0) + (proprio.total || 0)

  const pctIndustria = totalLeads > 0 ? Math.round((industria.total || 0) / totalLeads * 100) : 0
  const pctProprio = totalLeads > 0 ? Math.round((proprio.total || 0) / totalLeads * 100) : 0

  const melhorOrigem =
    taxaIndustria !== null && taxaProprio !== null
      ? taxaIndustria >= taxaProprio ? 'industria' : 'proprio'
      : null

  return (
    <div className="rounded-2xl border border-border/50 bg-linear-to-br from-slate-50 to-slate-100 shadow-md overflow-hidden">
      <div className="p-5 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
            <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-[#16255c]">ROI por Origem de Lead</p>
            <p className="text-xs text-slate-500 mt-0.5">Indústria vs Próprio — volume e conversão</p>
          </div>
          {melhorOrigem && (
            <span className="ml-auto text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
              {melhorOrigem === 'industria' ? 'Indústria' : 'Próprio'} converte mais
            </span>
          )}
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Indústria', total: industria.total || 0, pct: pctIndustria, taxa: taxaIndustria, status: statusIndustria, color: 'blue', melhor: melhorOrigem === 'industria' },
            { label: 'Próprio',   total: proprio.total || 0,   pct: pctProprio,   taxa: taxaProprio,   status: statusProprio,   color: 'purple', melhor: melhorOrigem === 'proprio' },
          ].map(({ label, total, pct, taxa, status, color, melhor }) => (
            <div key={label} className={`rounded-xl border p-4 ${melhor ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 bg-white/60'}`}>
              <div className="flex items-center justify-between mb-3">
                <p className={`font-semibold text-sm text-${color}-700`}>{label}</p>
                {melhor && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Melhor ROI</span>}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Total leads</p>
                  <p className="text-2xl font-bold text-slate-800">{total.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-slate-400">{pct}% do total</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Conversão</p>
                  {taxa !== null ? (
                    <p className={`text-2xl font-bold ${melhor ? 'text-emerald-600' : 'text-slate-600'}`}>{taxa}%</p>
                  ) : (
                    <p className="text-lg font-medium text-slate-400">—</p>
                  )}
                  <p className="text-xs text-slate-400">{status.venda_realizada} vendas</p>
                </div>
              </div>
              {taxa === null && total > 0 && (
                <p className="text-xs text-slate-400 mt-2 pt-2 border-t">Conversão por origem disponível após atualização do backend</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}