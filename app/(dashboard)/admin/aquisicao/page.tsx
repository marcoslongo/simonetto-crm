import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth'
import {
  DualChartSkeleton,
  ChartCardSkeleton
} from '@/components/dashboard/dashboard-skeletons'
import { GeoInvestSection } from '@/components/dashboard/dashboard-sections'
import { LeadsTemperature } from '@/components/dashboard/leads-temperature'
import { getLeadsClassificacaoServer } from '@/lib/server-leads-service'

export const metadata = {
  title: 'Aquisição | Noxus',
}

export default async function AquisicaoPage() {
  await requireAdmin()

  const [statsClassificacao] = await Promise.all([
    getLeadsClassificacaoServer(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">
          Aquisição
        </h2>
        <p className="text-muted-foreground mt-1">
          Origem dos leads e investimentos
        </p>
      </div>

      <Suspense fallback={<ChartCardSkeleton height="h-[200px]" />}>
        <LeadsTemperature
          quentes={statsClassificacao.quente}
          mornos={statsClassificacao.morno}
          frios={statsClassificacao.frio}
        />
      </Suspense>

      <Suspense fallback={<DualChartSkeleton />}>
        <GeoInvestSection />
      </Suspense>
    </div>
  )
}