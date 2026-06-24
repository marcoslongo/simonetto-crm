import { Suspense } from 'react'
import { requireAdmin, isMaster, isAdmin } from '@/lib/auth'
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
  ConversaoRedeSection,
  TopBottomConversoesSection,
} from '@/components/dashboard/dashboard-sections'
import { OnlineUsers } from '@/components/dashboard/online-users'

export const metadata = {
  title: 'Dashboard | Noxus',
}

export default async function AdminDashboardPage() {
  const user = await requireAdmin()
  const master = isMaster(user)
  const origemFilter = isAdmin(user) && !master ? 'industria' as const : undefined

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
        <StatsSection origem={origemFilter} />
      </Suspense>

      {master && (
        <Suspense fallback={<StatsCardsSkeleton />}>
          <StatsByOrigemSection />
        </Suspense>
      )}

      {master && <OnlineUsers />}

      <Suspense fallback={<StatsCardsSkeleton />}>
        <ComparativoSemanalSection origem={origemFilter} />
      </Suspense>

      <Suspense fallback={<StatsCardsSkeleton />}>
        <ConversaoRedeSection origem={origemFilter} />
      </Suspense>

      <Suspense fallback={<ChartCardSkeleton height="h-64" />}>
        <TopBottomConversoesSection />
      </Suspense>

      <Suspense fallback={<ChartCardSkeleton height="h-[300px]" />}>
        <Leads30DaysSection showProprio={master} origem={origemFilter} />
      </Suspense>

      <Suspense fallback={<ChartCardSkeleton height="h-[500px]" />}>
        <Leads12MonthsSection showProprio={master} origem={origemFilter} />
      </Suspense>
    </div>
  )
}
