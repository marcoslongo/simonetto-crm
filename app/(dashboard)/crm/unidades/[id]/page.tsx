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
  getLojaLeads,
  getVnrStats,
  getFunilPorAtendente,
  getTempoPorEtapa,
} from '@/lib/api-loja'
import { ChartLeads12Months } from '@/components/dashboard/chart-leads-12-months'
import { ChartLeads30Days } from '@/components/lojas/chart-line-30-days'
import { ChartVnrMotivos } from '@/components/dashboard/chart-vnr-motivos'
import { ChartFunilPorAtendente } from '@/components/dashboard/chart-funil-por-atendente'
import { ChartTempoPorEtapa } from '@/components/dashboard/chart-tempo-por-etapa'
import { StatsCards } from '@/components/lojas/stats-cards'
import { LojaInfoCard } from '@/components/lojas/loja-info-card'
import { FunilStatus } from '@/components/lojas/funil-status'
import { TemperaturaLeads } from '@/components/lojas/temperatura-leads'
import { MetricasAtendimento } from '@/components/lojas/metricas-atendimento'
import { LeadsRecentes } from '@/components/lojas/leads-recentes'
import { LojaPageTabs } from '@/components/lojas/loja-page-tabs'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { ArrowLeft, Kanban } from 'lucide-react'
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
async function LeadsRecentesWrapper({ id, currentUserId, isGerente }: { id: string; currentUserId: number; isGerente?: boolean }) {
  const { leads, total } = await getLojaLeads(id, 1, 10)
  return <LeadsRecentes leads={leads} total={total} lojaId={Number(id)} isAdmin={false} isGerente={isGerente} currentUserId={currentUserId} />
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
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/crm">Início</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/crm/unidades">Unidades</Link>
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
          <p className="text-muted-foreground mt-1">Visualização detalhada da unidade</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/crm/atendimentos?loja_id=${id}`}>
            <Button variant="default" className="bg-[#16255c] hover:bg-[#16255c]/90 shadow-sm gap-2">
              <Kanban className="h-4 w-4" />
              Ver no kanban
            </Button>
          </Link>
          <Link href="/crm/unidades">
            <Button variant="outline" className="shadow-sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>
      </div>

      <LojaInfoCard loja={loja} />

      <LojaPageTabs
        visaoGeral={
          <>
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
          </>
        }
        leads={
          <>
            <Suspense fallback={<ChartCardSkeleton height="h-48" />}>
              <LeadsRecentesWrapper id={id} currentUserId={user.id} isGerente={user.is_gerente} />
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
      />
    </div>
  )
}
