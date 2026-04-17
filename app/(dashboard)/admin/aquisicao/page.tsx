import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth'
import { DualChartSkeleton } from '@/components/dashboard/dashboard-skeletons'
import { GeoInvestSection } from '@/components/dashboard/dashboard-sections'

export const metadata = {
  title: 'Aquisição | Noxus',
}

export default async function AquisicaoPage() {
  await requireAdmin()

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

      <Suspense fallback={<DualChartSkeleton />}>
        <GeoInvestSection />
      </Suspense>
    </div>
  )
}