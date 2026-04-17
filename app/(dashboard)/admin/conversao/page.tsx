import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth'
import { StatsCardsSkeleton } from '@/components/dashboard/dashboard-skeletons'
import { StatusStatsSection } from '@/components/dashboard/dashboard-sections'
import { DateFilterClient } from '@/components/ui/date-filter-client'

export const metadata = { title: 'Conversão | Noxus' }

interface ConversaoPageProps {
  searchParams: Promise<{ from?: string; to?: string }>
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
    </div>
  )
}