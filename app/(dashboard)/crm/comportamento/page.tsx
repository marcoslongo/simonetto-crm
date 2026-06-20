import { Suspense } from 'react'
import { requireGerente } from '@/lib/auth'
import { getLeadsTrackingDeviceServer, getLeadsTrackingHorarioServer } from '@/lib/server-leads-service'
import { ChartDeviceBreakdown } from '@/components/dashboard/chart-device-breakdown'
import { ChartHorarioLeads } from '@/components/dashboard/chart-horario-leads'
import { ChartCardSkeleton } from '@/components/dashboard/dashboard-skeletons'
import { Skeleton } from '@/components/ui/skeleton'
import type { HorarioItem, DeviceItem } from '@/lib/leads-service'
import {
  Clock, Monitor, Smartphone, TrendingUp, TrendingDown,
  Lightbulb, AlertTriangle, CheckCircle2, Activity,
} from 'lucide-react'

export const metadata = {
  title: 'Comportamento | Noxus - Lead Ops',
  description: 'Inteligência comportamental dos seus leads',
}

// ─── helpers ────────────────────────────────────────────────────────────────

function periodoHora(h: number) {
  if (h >= 6  && h < 12) return 'Manhã'
  if (h >= 12 && h < 18) return 'Tarde'
  if (h >= 18 && h < 23) return 'Noite'
  return 'Madrugada'
}

function isHorarioComercial(h: number) { return h >= 8 && h < 18 }

function computeHorarioInsights(data: HorarioItem[]) {
  if (!data.length) return null

  const total       = data.reduce((s, d) => s + d.total, 0)
  const sorted      = [...data].sort((a, b) => b.total - a.total)
  const pico        = sorted[0]
  const comercial   = data.filter(d => isHorarioComercial(d.hora_int)).reduce((s, d) => s + d.total, 0)
  const foraCom     = total - comercial
  const pctComercial = total > 0 ? Math.round(comercial / total * 100) : 0

  const periodos: Record<string, number> = { Manhã: 0, Tarde: 0, Noite: 0, Madrugada: 0 }
  data.forEach(d => { periodos[periodoHora(d.hora_int)] += d.total })
  const melhorPeriodo = Object.entries(periodos).sort((a, b) => b[1] - a[1])[0]

  return { total, pico, comercial, foraCom, pctComercial, melhorPeriodo, periodos }
}

function computeDeviceInsights(data: DeviceItem[]) {
  if (!data.length) return null
  const total    = data.reduce((s, d) => s + d.total, 0)
  const mobile   = data.find(d => d.device_type.toLowerCase().includes('mobile'))
  const desktop  = data.find(d => d.device_type.toLowerCase().includes('desktop'))
  const mobileP  = mobile  ? Math.round(mobile.total  / total * 100) : 0
  const desktopP = desktop ? Math.round(desktop.total / total * 100) : 0
  return { total, mobile, desktop, mobileP, desktopP }
}

// ─── insight item ────────────────────────────────────────────────────────────

function InsightItem({
  icon: Icon, text, color, type,
}: {
  icon: typeof TrendingUp; text: string; color: string; type: 'alert' | 'success' | 'info' | 'warn'
}) {
  const styles = {
    alert:   'border-red-200 bg-red-50 text-red-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    info:    'border-blue-200 bg-blue-50 text-blue-700',
    warn:    'border-amber-200 bg-amber-50 text-amber-700',
  }
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm ${styles[type]}`}>
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <p className="leading-snug">{text}</p>
    </div>
  )
}

// ─── Executive summary server component ─────────────────────────────────────

async function ExecutiveSummary({ lojaIds }: { lojaIds?: number[] }) {
  const ids = lojaIds && lojaIds.length > 0 ? lojaIds : undefined
  const [horarioData, deviceData] = await Promise.all([
    getLeadsTrackingHorarioServer(undefined, undefined, ids),
    getLeadsTrackingDeviceServer(undefined, undefined, ids),
  ])

  const hi = computeHorarioInsights(horarioData)
  const di = computeDeviceInsights(deviceData)

  if (!hi && !di) return null

  // Build insights list
  const insights: { icon: typeof TrendingUp; text: string; type: 'alert' | 'success' | 'info' | 'warn' }[] = []

  if (hi) {
    insights.push({
      icon: Clock,
      text: `Pico de captação às ${hi.pico.hora} com ${hi.pico.total} leads — concentre atendimento nesse horário.`,
      type: 'info',
    })

    if (hi.pctComercial < 60) {
      insights.push({
        icon: AlertTriangle,
        text: `${100 - hi.pctComercial}% dos leads chegam fora do horário comercial. Considere atendimento estendido.`,
        type: 'warn',
      })
    } else {
      insights.push({
        icon: CheckCircle2,
        text: `${hi.pctComercial}% dos leads chegam no horário comercial (08h–18h). Boa cobertura da equipe.`,
        type: 'success',
      })
    }

    const [nomePeriodo, qtdPeriodo] = hi.melhorPeriodo
    const pctPeriodo = hi.total > 0 ? Math.round(qtdPeriodo / hi.total * 100) : 0
    insights.push({
      icon: Activity,
      text: `Período mais ativo: ${nomePeriodo} (${pctPeriodo}% dos leads). Priorize equipe disponível nesse bloco.`,
      type: 'info',
    })
  }

  if (di) {
    if (di.mobileP > 65) {
      insights.push({
        icon: Smartphone,
        text: `${di.mobileP}% dos leads vêm de mobile. Garanta que formulários e landing pages sejam mobile-first.`,
        type: di.mobileP > 80 ? 'warn' : 'info',
      })
    } else if (di.desktopP > 60) {
      insights.push({
        icon: Monitor,
        text: `${di.desktopP}% dos leads acessam via desktop. Público possivelmente mais engajado e deliberativo.`,
        type: 'info',
      })
    }
  }

  // Recomendações
  const recomendacoes: string[] = []
  if (hi?.pico && !isHorarioComercial(hi.pico.hora_int)) {
    recomendacoes.push(`Escale atendentes para cobrir ${hi.pico.hora} — fora do horário padrão mas é o pico de entrada.`)
  }
  if (di && di.mobileP > 70) {
    recomendacoes.push('Revise a experiência mobile do formulário de captação para reduzir abandono.')
  }
  if (hi && hi.pctComercial < 50) {
    recomendacoes.push('Crie régua de atendimento automático para leads que chegam à noite.')
  }

  return (
    <div className="space-y-6">
      {/* Métricas do resumo executivo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {hi && (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total de leads</p>
              <p className="text-3xl font-extrabold text-[#16255c] tabular-nums mt-1">{hi.total.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-slate-500 mt-0.5">no período analisado</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pico de captação</p>
              <p className="text-3xl font-extrabold text-[#16255c] mt-1">{hi.pico.hora}</p>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">{hi.pico.total} leads nesse horário</p>
            </div>
            <div className={`rounded-2xl border p-4 ${hi.pctComercial >= 60 ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Horário comercial</p>
              <p className={`text-3xl font-extrabold mt-1 tabular-nums ${hi.pctComercial >= 60 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {hi.pctComercial}%
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{hi.comercial} leads dentro do horário</p>
            </div>
          </>
        )}
        {di && (
          <div className={`rounded-2xl border p-4 ${di.mobileP > 60 ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Acesso mobile</p>
            <p className={`text-3xl font-extrabold mt-1 tabular-nums ${di.mobileP > 60 ? 'text-blue-700' : 'text-[#16255c]'}`}>
              {di.mobileP}%
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{di.mobile?.total ?? 0} leads via celular</p>
          </div>
        )}
      </div>

      {/* Insights automáticos */}
      {insights.length > 0 && (
        <div className="rounded-2xl border border-[#16255c]/20 bg-[#16255c]/3 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#16255c]">
              <Lightbulb className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#16255c]">Insights automáticos</h4>
              <p className="text-[11px] text-slate-500">Padrões detectados nos dados de captação</p>
            </div>
          </div>
          <div className="space-y-2">
            {insights.map((ins, i) => (
              <InsightItem key={i} icon={ins.icon} text={ins.text} color="" type={ins.type} />
            ))}
          </div>
        </div>
      )}

      {/* Recomendações */}
      {recomendacoes.length > 0 && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <h4 className="text-sm font-bold text-indigo-800">Recomendações</h4>
          </div>
          <ul className="space-y-2">
            {recomendacoes.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-indigo-700">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-200 text-[10px] font-bold text-indigo-700">
                  {i + 1}
                </span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-2 mb-4">
      <div className="mt-1 h-4 w-1 rounded-full bg-[#16255c]" />
      <div>
        <h3 className="text-base font-bold text-[#16255c] leading-tight">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

async function HorarioChart({ lojaIds }: { lojaIds?: number[] }) {
  const ids = lojaIds && lojaIds.length > 0 ? lojaIds : undefined
  const data = await getLeadsTrackingHorarioServer(undefined, undefined, ids)
  return <ChartHorarioLeads data={data} />
}

async function DeviceChart({ lojaIds }: { lojaIds?: number[] }) {
  const ids = lojaIds && lojaIds.length > 0 ? lojaIds : undefined
  const data = await getLeadsTrackingDeviceServer(undefined, undefined, ids)
  return <ChartDeviceBreakdown data={data} />
}

function SummarySkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  )
}

export default async function ComportamentoPage() {
  const user    = await requireGerente()
  const lojaIds = user.role === 'loja' && user.loja_ids.length > 0 ? user.loja_ids : undefined

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Comportamento</h2>
        <p className="text-muted-foreground mt-1">
          Centro de inteligência — como e quando seus leads chegam
        </p>
      </div>

      {/* Seção 1: Resumo executivo + insights */}
      <section className="space-y-1">
        <SectionHeader
          title="Resumo executivo"
          description="Padrões detectados, insights automáticos e recomendações de ação"
        />
        <Suspense fallback={<SummarySkeleton />}>
          <ExecutiveSummary lojaIds={lojaIds} />
        </Suspense>
      </section>

      {/* Seção 2: Distribuição por horário */}
      <section className="space-y-1">
        <SectionHeader
          title="Distribuição por horário"
          description="Volume de captação por hora do dia — identifique picos e janelas de baixo volume"
        />
        <Suspense fallback={<ChartCardSkeleton height="h-80" />}>
          <HorarioChart lojaIds={lojaIds} />
        </Suspense>
      </section>

      {/* Seção 3: Dispositivos */}
      <section className="space-y-1">
        <SectionHeader
          title="Dispositivos de acesso"
          description="De onde seus leads preenchem o formulário — mobile, desktop ou tablet"
        />
        <Suspense fallback={<ChartCardSkeleton height="h-72" />}>
          <DeviceChart lojaIds={lojaIds} />
        </Suspense>
      </section>
    </div>
  )
}
