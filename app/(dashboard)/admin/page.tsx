import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth'
import {
  StatsCardsSkeleton,
  DualChartSkeleton,
  ChartCardSkeleton,
} from '@/components/dashboard/dashboard-skeletons'
import { 
  ContatoRankingSection, 
  GeoInvestSection, 
  InteresseSection, 
  Leads30DaysSection, 
  StatsSection 
} from '@/components/dashboard/dashboard-sections'

export const metadata = {
  title: 'Todos os Leads | Noxus - Lead Ops',
  description: 'Gestão de leads de todas as unidades',
}

export default async function AdminLeadsPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          Visão geral do desempenho de leads e lojas
        </p>
      </div>

      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsSection />
      </Suspense>

      <Suspense fallback={<DualChartSkeleton />}>
        <ContatoRankingSection />
      </Suspense>

      <Suspense fallback={<ChartCardSkeleton height="h-[300px]" />}>
        <Leads30DaysSection />
      </Suspense>

      <Suspense fallback={<DualChartSkeleton />}>
        <GeoInvestSection />
      </Suspense>

      <Suspense fallback={<ChartCardSkeleton height="h-[350px]" />}>
        <InteresseSection />
      </Suspense>
    </div>
  )
}