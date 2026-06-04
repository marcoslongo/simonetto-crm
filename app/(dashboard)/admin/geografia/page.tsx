import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth'
import { DualChartSkeleton, ChartCardSkeleton } from '@/components/dashboard/dashboard-skeletons'
import { GeoInvestSection, CoberturaFranqueadosSection } from '@/components/dashboard/dashboard-sections'

export const metadata = {
  title: 'Geografia | Noxus',
}

export default async function GeografiaPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">
          Geografia
        </h2>
        <p className="text-muted-foreground mt-1">
          Distribuição geográfica dos leads e cobertura de franqueados
        </p>
      </div>

      <Suspense fallback={<DualChartSkeleton />}>
        <GeoInvestSection />
      </Suspense>

      <Suspense fallback={<ChartCardSkeleton height="h-[400px]" />}>
        <CoberturaFranqueadosSection />
      </Suspense>
    </div>
  )
}