import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth'
import { ChartCardSkeleton } from '@/components/dashboard/dashboard-skeletons'
import { DateFilterClient } from '@/components/ui/date-filter-client'
import { LeadsTemperatureSection, ScoreInvestSection } from '@/components/dashboard/dashboard-sections'

export const metadata = { title: 'Aquisição | Noxus' }

interface AquisicaoPageProps {
  searchParams: Promise<{ from?: string; to?: string }>
}

export default async function AquisicaoPage({ searchParams }: AquisicaoPageProps) {
  await requireAdmin()
  const { from, to } = await searchParams

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Aquisição</h2>
        <p className="text-muted-foreground mt-1">Origem dos leads e investimentos</p>
      </div>

      <DateFilterClient />

      <Suspense key={`temp-${from}-${to}`} fallback={<ChartCardSkeleton height="h-[200px]" />}>
        <LeadsTemperatureSection from={from} to={to} />
      </Suspense>

      <Suspense key={`score-${from}-${to}`} fallback={<ChartCardSkeleton height="h-[400px]" />}>
        <ScoreInvestSection from={from} to={to} />
      </Suspense>
    </div>
  )
}