import { Suspense } from 'react'
import { requireAdmin, isMaster } from '@/lib/auth'
import {
  StatsCardsSkeleton,
  ChartCardSkeleton,
} from '@/components/dashboard/dashboard-skeletons'
import {
  Leads30DaysSection,
  Leads12MonthsSection,
  StatsSection,
  StatsByOrigemSection,
  ComparativoSemanalSection,
  SlaRedeSection,
  ConversaoRedeSection,
  TopBottomConversoesSection,
} from '@/components/dashboard/dashboard-sections'
import { DateFilterClient } from '@/components/ui/date-filter-client'
import { OnlineUsers } from '@/components/dashboard/online-users'

export const metadata = {
  title: 'Dashboard | Noxus',
}

interface AdminDashboardPageProps {
  searchParams: Promise<{ from?: string; to?: string }>
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const user = await requireAdmin()
  const master = isMaster(user)
  const { from, to } = await searchParams

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

      {/* Suspense obrigatório: DateFilterClient usa useSearchParams() */}
      <Suspense fallback={null}>
        <DateFilterClient />
      </Suspense>

      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsSection />
      </Suspense>

      {master && (
        <Suspense fallback={<StatsCardsSkeleton />}>
          <StatsByOrigemSection />
        </Suspense>
      )}

      {master && <OnlineUsers />}

      <Suspense fallback={<StatsCardsSkeleton />}>
        <ComparativoSemanalSection />
      </Suspense>

      <Suspense fallback={<ChartCardSkeleton height="h-20" />}>
        <SlaRedeSection />
      </Suspense>

      <Suspense key={`conversao-${from}-${to}`} fallback={<StatsCardsSkeleton />}>
        <ConversaoRedeSection from={from} to={to} />
      </Suspense>

      <Suspense key={`topbottom-${from}-${to}`} fallback={<ChartCardSkeleton height="h-64" />}>
        <TopBottomConversoesSection from={from} to={to} />
      </Suspense>

      <Suspense key={`30dias-${from}-${to}`} fallback={<ChartCardSkeleton height="h-[300px]" />}>
        <Leads30DaysSection from={from} to={to} showProprio={master} />
      </Suspense>

      <Suspense fallback={<ChartCardSkeleton height="h-[500px]" />}>
        <Leads12MonthsSection showProprio={master} />
      </Suspense>
    </div>
  )
}