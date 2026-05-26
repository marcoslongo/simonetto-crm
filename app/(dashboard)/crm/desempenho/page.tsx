import { Suspense } from 'react'
import { requireGerente } from '@/lib/auth'
import {
  getMultiLojaLeads30Days, getMultiLojaLeads12Months, getVnrStats, getMultiLojaStatusFunil,
  getConversaoPorLoja, getFunilPorAtendente, getTempoPorEtapa,
} from '@/lib/api-loja'
import { ChartLeads12Months } from '@/components/dashboard/chart-leads-12-months'
import { ChartLeads30Days } from '@/components/lojas/chart-line-30-days'
import { ChartVnrMotivos } from '@/components/dashboard/chart-vnr-motivos'
import { ChartFunilKanban } from '@/components/dashboard/chart-funil-kanban'
import { ChartConversaoPorLoja } from '@/components/dashboard/chart-conversao-por-loja'
import { ChartFunilPorAtendente } from '@/components/dashboard/chart-funil-por-atendente'
import { ChartTempoPorEtapa } from '@/components/dashboard/chart-tempo-por-etapa'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Desempenho | Noxus - Lead Ops',
  description: 'Evolução e métricas de atendimento da sua unidade',
}

function ChartSkeleton() {
  return <Skeleton className="w-full h-80 rounded-xl" />
}

async function FunilChart({ lojaIds }: { lojaIds: number[] }) {
  const data = await getMultiLojaStatusFunil(lojaIds)
  return <ChartFunilKanban {...data} />
}

async function VnrChart({ lojaIds }: { lojaIds: number[] }) {
  const data = await getVnrStats(lojaIds)
  return <ChartVnrMotivos initialData={data} isAdmin={false} lojaIds={lojaIds} />
}

async function Leads30DaysChart({ lojaIds }: { lojaIds: number[] }) {
  const data = await getMultiLojaLeads30Days(lojaIds)
  return <ChartLeads30Days data={data} lojaIds={lojaIds} />
}

async function Leads12MonthsChart({ lojaIds }: { lojaIds: number[] }) {
  const data = await getMultiLojaLeads12Months(lojaIds)
  return <ChartLeads12Months data={data} lojaId={lojaIds[0]} />
}

async function ConversaoChart({ lojaIds }: { lojaIds: number[] }) {
  const data = await getConversaoPorLoja(lojaIds)
  return <ChartConversaoPorLoja data={data} />
}

async function FunilAtendenteChart({ lojaIds }: { lojaIds: number[] }) {
  const data = await getFunilPorAtendente(lojaIds)
  return <ChartFunilPorAtendente data={data} />
}

async function TempoPorEtapaChart({ lojaIds }: { lojaIds: number[] }) {
  const data = await getTempoPorEtapa(lojaIds)
  return <ChartTempoPorEtapa data={data} />
}

export default async function DesempenhoPage() {
  const user = await requireGerente()

  const isLoja = user.role === 'loja'
  const lojaIds = isLoja ? user.loja_ids : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Desempenho</h2>
        <p className="text-muted-foreground mt-1">
          Evolução de captação da sua unidade
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Suspense fallback={<ChartSkeleton />}>
          <FunilChart lojaIds={lojaIds} />
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <VnrChart lojaIds={lojaIds} />
        </Suspense>
      </div>

      <Suspense fallback={<ChartSkeleton />}>
        <Leads30DaysChart lojaIds={lojaIds} />
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <Leads12MonthsChart lojaIds={lojaIds} />
      </Suspense>

      <div>
        <h3 className="text-xl font-bold tracking-tight text-[#16255c] mb-4">Relatórios</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Suspense fallback={<ChartSkeleton />}>
            <TempoPorEtapaChart lojaIds={lojaIds} />
          </Suspense>

          <Suspense fallback={<ChartSkeleton />}>
            <ConversaoChart lojaIds={lojaIds} />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<ChartSkeleton />}>
        <FunilAtendenteChart lojaIds={lojaIds} />
      </Suspense>
    </div>
  )
}
