import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth'
import {
  StatsCardsSkeleton,
  ChartCardSkeleton,
  DualChartSkeleton,
} from '@/components/dashboard/dashboard-skeletons'
import { 
  ContatoRankingSection,
  Leads30DaysSection, 
  StatsSection,
  StatusStatsSection
} from '@/components/dashboard/dashboard-sections'

export const metadata = {
  title: 'Dashboard | Noxus',
}

export default async function AdminDashboardPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">
          Dashboard
        </h2>
        <p className="text-muted-foreground mt-1">
          Visão geral e saúde da operação
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
    </div>
  )
}