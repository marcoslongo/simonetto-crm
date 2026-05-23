import { Suspense } from 'react'
import { requireLoja, canAccessLoja } from '@/lib/auth'
import { getLojas } from '@/lib/api'
import {
  getLojaStats,
  getLojaLeads30Days,
  getLojaLeads12Months,
  getLojaStatusFunil,
  getLojaClassificacao,
  getLojaServiceStats,
} from '@/lib/api-loja'
import { ChartLeads12Months } from '@/components/dashboard/chart-leads-12-months'
import { ChartLeads30Days } from '@/components/lojas/chart-line-30-days'
import { StatsCards } from '@/components/lojas/stats-cards'
import { LojaInfoCard } from '@/components/lojas/loja-info-card'
import { FunilStatus } from '@/components/lojas/funil-status'
import { TemperaturaLeads } from '@/components/lojas/temperatura-leads'
import { MetricasAtendimento } from '@/components/lojas/metricas-atendimento'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import {
  StatsCardsSkeleton,
  ChartCardSkeleton,
  TripleChartSkeleton,
} from '@/components/dashboard/dashboard-skeletons'

interface UnidadePageProps {
  params: Promise<{ id: string }>
}

async function UnidadeStatsWrapper({ id }: { id: string }) {
  const stats = await getLojaStats(id)
  return <StatsCards stats={stats} />
}

async function UnidadeMetricasWrapper({ id }: { id: string }) {
  const data = await getLojaServiceStats(id)
  return <MetricasAtendimento data={data} />
}

async function UnidadeFunilWrapper({ id }: { id: string }) {
  const data = await getLojaStatusFunil(id)
  return <FunilStatus data={data} />
}

async function UnidadeTemperaturaWrapper({ id }: { id: string }) {
  const data = await getLojaClassificacao(id)
  return <TemperaturaLeads data={data} />
}

async function Leads30DaysWrapper({ id }: { id: string }) {
  const data = await getLojaLeads30Days(id)
  return <ChartLeads30Days data={data} lojaIds={[id]} />
}

async function Leads12MonthsWrapper({ id }: { id: string }) {
  const data = await getLojaLeads12Months(id)
  return <ChartLeads12Months data={data} lojaId={id} />
}

export default async function CrmUnidadePage({ params }: UnidadePageProps) {
  const user = await requireLoja()

  if (user.loja_ids.length <= 1) redirect('/crm')

  const { id } = await params

  if (!canAccessLoja(user, Number(id))) redirect('/crm/unidades')

  const lojasData = await getLojas().catch(() => ({ success: false, lojas: [] }))
  const loja = lojasData.lojas.find(l => l.id === id)

  if (!loja) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">{loja.nome}</h2>
          <p className="text-muted-foreground mt-1">Visualização detalhada da unidade</p>
        </div>
        <Link href="/crm/unidades">
          <Button variant="outline" className="shadow-sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>

      <LojaInfoCard loja={loja} />

      <Suspense fallback={<StatsCardsSkeleton />}>
        <UnidadeStatsWrapper id={id} />
      </Suspense>

      <Suspense fallback={<TripleChartSkeleton height="h-56" />}>
        <div className="grid gap-6 md:grid-cols-3">
          <Suspense fallback={<ChartCardSkeleton height="h-56" />}>
            <UnidadeMetricasWrapper id={id} />
          </Suspense>
          <Suspense fallback={<ChartCardSkeleton height="h-56" />}>
            <UnidadeFunilWrapper id={id} />
          </Suspense>
          <Suspense fallback={<ChartCardSkeleton height="h-56" />}>
            <UnidadeTemperaturaWrapper id={id} />
          </Suspense>
        </div>
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<ChartCardSkeleton height="h-80" />}>
          <Leads30DaysWrapper id={id} />
        </Suspense>
        <Suspense fallback={<ChartCardSkeleton height="h-80" />}>
          <Leads12MonthsWrapper id={id} />
        </Suspense>
      </div>
    </div>
  )
}
