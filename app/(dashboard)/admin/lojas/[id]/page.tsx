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
  getLojaLeads,
  getVnrStats,
  getFunilPorAtendente,
  getTempoPorEtapa,
  getKanbanColumns,
} from '@/lib/api-loja'
import { ChartLeads12Months } from '@/components/dashboard/chart-leads-12-months'
import { ChartVnrMotivos } from '@/components/dashboard/chart-vnr-motivos'
import { ChartFunilPorAtendente } from '@/components/dashboard/chart-funil-por-atendente'
import { ChartTempoPorEtapa } from '@/components/dashboard/chart-tempo-por-etapa'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { StatsCards } from '@/components/lojas/stats-cards'
import { LojaInfoCard } from '@/components/lojas/loja-info-card'
import { ChartLeads30Days } from '@/components/lojas/chart-line-30-days'
import { FunilStatus } from '@/components/lojas/funil-status'
import { TemperaturaLeads } from '@/components/lojas/temperatura-leads'
import { MetricasAtendimento } from '@/components/lojas/metricas-atendimento'
import { LeadsRecentes } from '@/components/lojas/leads-recentes'
import { LojaPageTabs } from '@/components/lojas/loja-page-tabs'
import { IntegracaoLP } from '@/components/lojas/integracao-lp'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
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
  const [data, colunas] = await Promise.all([
    getLojaStatusFunil(id),
    getKanbanColumns(id),
  ])
  return <FunilStatus data={data} colunas={colunas} />
}
async function LojaTemperaturaWrapper({ id }: { id: string }) {
  const data = await getLojaClassificacao(id)
  return <TemperaturaLeads data={data} />
}
async function Leads30DaysWrapper({ id }: { id: string }) {
  const data = await getLojaLeads30Days(id)
  return <ChartLeads30Days data={data} lojaIds={[id]} />
}
async function Leads12MonthsWrapper({ id }: { id: string }) {
  const data = await getLojaLeads12Months(id)
  return <ChartLeads12Months data={data} />
}
async function IntegracaoWrapper({ id }: { id: string }) {
  const data = await getLojaIntegration(id)
  return <IntegracaoLP lojaId={id} initialData={data} isAdmin />
}
async function LeadsRecentesWrapper({ id, currentUserId }: { id: string; currentUserId: number }) {
  const { leads, total } = await getLojaLeads(id, 1, 10)
  return <LeadsRecentes leads={leads} total={total} lojaId={Number(id)} isAdmin currentUserId={currentUserId} />
}
async function VnrWrapper({ id }: { id: string }) {
  const data = await getVnrStats([Number(id)])
  return <ChartVnrMotivos initialData={data} isAdmin={false} lojaIds={[Number(id)]} />
}
async function FunilAtendenteWrapper({ id }: { id: string }) {
  const data = await getFunilPorAtendente([Number(id)])
  return <ChartFunilPorAtendente data={data} />
}
async function TempoPorEtapaWrapper({ id }: { id: string }) {
  const data = await getTempoPorEtapa([Number(id)])
  return <ChartTempoPorEtapa data={data} />
}

export default async function LojaPage({ params }: LojaPageProps) {
  const user = await requireAdmin()

  const { id } = await params

  const lojasResponse = await getLojas()
  if (!lojasResponse.success) throw new Error('Falha ao carregar lojas')

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
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin">Início</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/lojas">Lojas</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{loja.nome}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">{loja.nome}</h2>
          <p className="text-muted-foreground mt-1">Visualização detalhada da loja</p>
        </div>
        <Link href="/admin/lojas">
          <Button variant="outline" className="shadow-sm shrink-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>

      <LojaInfoCard loja={loja} />

      <LojaPageTabs
        visaoGeral={
          <>
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
          </>
        }
        leads={
          <>
            <Suspense fallback={<ChartCardSkeleton height="h-48" />}>
              <LeadsRecentesWrapper id={id} currentUserId={user.id} />
            </Suspense>
            <div className="grid gap-6 md:grid-cols-2">
              <Suspense fallback={<ChartCardSkeleton height="h-80" />}>
                <Leads30DaysWrapper id={id} />
              </Suspense>
              <Suspense fallback={<ChartCardSkeleton height="h-80" />}>
                <Leads12MonthsWrapper id={id} />
              </Suspense>
            </div>
          </>
        }
        relatorios={
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <Suspense fallback={<ChartCardSkeleton height="h-72" />}>
                <TempoPorEtapaWrapper id={id} />
              </Suspense>
              <Suspense fallback={<ChartCardSkeleton height="h-72" />}>
                <VnrWrapper id={id} />
              </Suspense>
            </div>
            <Suspense fallback={<ChartCardSkeleton height="h-80" />}>
              <FunilAtendenteWrapper id={id} />
            </Suspense>
          </>
        }
        configuracoes={
          <Suspense fallback={<ChartCardSkeleton height="h-40" />}>
            <IntegracaoWrapper id={id} />
          </Suspense>
        }
      />
    </div>
  )
}
