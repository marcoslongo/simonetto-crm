import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth'
import { StatsCardsSkeleton, ChartCardSkeleton } from '@/components/dashboard/dashboard-skeletons'
import { StatusStatsSection } from '@/components/dashboard/dashboard-sections'
import { DateFilterClient } from '@/components/ui/date-filter-client'
import { getLojasServer } from '@/lib/server-lojas-service'
import { getVnrStats } from '@/lib/api-loja'
import { ChartVnrMotivos } from '@/components/dashboard/chart-vnr-motivos'

export const metadata = { title: 'Conversão | Noxus' }

interface ConversaoPageProps {
  searchParams: Promise<{ from?: string; to?: string }>
}

async function VnrMotivosWrapper() {
  const [vnrStats, lojas] = await Promise.all([getVnrStats(), getLojasServer()])
  return (
    <ChartVnrMotivos
      initialData={vnrStats}
      isAdmin={true}
      lojas={lojas.map(l => ({ id: Number(l.id), nome: l.nome }))}
    />
  )
}

export default async function ConversaoPage({ searchParams }: ConversaoPageProps) {
  await requireAdmin()
  const { from, to } = await searchParams

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Conversão</h2>
        <p className="text-muted-foreground mt-1">Análise do funil e taxas de conversão</p>
      </div>

      <DateFilterClient />

      <Suspense key={`${from}-${to}`} fallback={<StatsCardsSkeleton />}>
        <StatusStatsSection from={from} to={to} />
      </Suspense>

      <Suspense fallback={<ChartCardSkeleton height="h-80" />}>
        <VnrMotivosWrapper />
      </Suspense>
    </div>
  )
}
