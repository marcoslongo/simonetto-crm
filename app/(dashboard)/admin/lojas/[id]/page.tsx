import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth'
import { getLojas } from '@/lib/api'
import {
  getLojaStats,
  getLojaLeads30Days,
  getLojaLeads12Months,
  getLojaStatusFunil,
  getLojaClassificacao,
  getLojaServiceStats,
  getLojaIntegration,
} from '@/lib/api-loja'
import { ChartLeads12Months } from '@/components/dashboard/chart-leads-12-months'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { StatsCards } from '@/components/lojas/stats-cards'
import { LojaInfoCard } from '@/components/lojas/loja-info-card'
import { ChartLeads30Days } from '@/components/lojas/chart-line-30-days'
import { FunilStatus } from '@/components/lojas/funil-status'
import { TemperaturaLeads } from '@/components/lojas/temperatura-leads'
import { MetricasAtendimento } from '@/components/lojas/metricas-atendimento'
import { IntegracaoLP } from '@/components/lojas/integracao-lp'
import { WhatsAppConfig } from '@/components/lojas/whatsapp-config'
import {
  StatsCardsSkeleton,
  ChartCardSkeleton,
  TripleChartSkeleton,
} from '@/components/dashboard/dashboard-skeletons'

interface LojaPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: 'Loja | Admin CRM',
  description: 'Detalhes da loja',
}

async function LojaStatsWrapper({ id }: { id: string }) {
  const stats = await getLojaStats(id)
  return <StatsCards stats={stats} />
}

async function LojaMetricasWrapper({ id }: { id: string }) {
  const data = await getLojaServiceStats(id)
  return <MetricasAtendimento data={data} />
}

async function LojaFunilWrapper({ id }: { id: string }) {
  const data = await getLojaStatusFunil(id)
  return <FunilStatus data={data} />
}

async function LojaTemperaturaWrapper({ id }: { id: string }) {
  const data = await getLojaClassificacao(id)
  return <TemperaturaLeads data={data} />
}

async function Leads30DaysWrapper({ id }: { id: string }) {
  const data = await getLojaLeads30Days(id)
  return <ChartLeads30Days data={data} />
}

async function Leads12MonthsWrapper({ id }: { id: string }) {
  const data = await getLojaLeads12Months(id)
  return <ChartLeads12Months data={data} />
}

async function IntegracaoWrapper({ id }: { id: string }) {
  const data = await getLojaIntegration(id)
  return <IntegracaoLP lojaId={id} initialData={data} isAdmin />
}

export default async function LojaPage({ params }: LojaPageProps) {
  await requireAdmin()

  const { id } = await params

  const lojasResponse = await getLojas()
  if (!lojasResponse.success) {
    throw new Error('Falha ao carregar lojas')
  }

  const loja = lojasResponse.lojas.find((l) => l.id === id)

  if (!loja) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Loja não encontrada</h2>
        <Link href="/admin/lojas">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">{loja.nome}</h2>
          <p className="text-muted-foreground mt-1">
            Visualização detalhada da loja
          </p>
        </div>
        <Link href="/admin/lojas">
          <Button variant="outline" className="shadow-sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>

      <LojaInfoCard loja={loja} />

      <Suspense fallback={<StatsCardsSkeleton />}>
        <LojaStatsWrapper id={id} />
      </Suspense>

      <Suspense fallback={<TripleChartSkeleton height="h-56" />}>
        <div className="grid gap-6 md:grid-cols-3">
          <Suspense fallback={<ChartCardSkeleton height="h-56" />}>
            <LojaMetricasWrapper id={id} />
          </Suspense>
          <Suspense fallback={<ChartCardSkeleton height="h-56" />}>
            <LojaFunilWrapper id={id} />
          </Suspense>
          <Suspense fallback={<ChartCardSkeleton height="h-56" />}>
            <LojaTemperaturaWrapper id={id} />
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

      <Suspense fallback={<ChartCardSkeleton height="h-40" />}>
        <IntegracaoWrapper id={id} />
      </Suspense>

      <WhatsAppConfig lojaId={id} isAdmin siteUrl={process.env.NEXT_PUBLIC_SITE_URL} />
    </div>
  )
}
