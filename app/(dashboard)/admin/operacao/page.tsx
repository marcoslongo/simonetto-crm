import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth'
import { DualChartSkeleton } from '@/components/dashboard/dashboard-skeletons'
import { ContatoRankingSection } from '@/components/dashboard/dashboard-sections'

export const metadata = {
  title: 'Operação | Noxus',
}

export default async function OperacaoPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">
          Operação
        </h2>
        <p className="text-muted-foreground mt-1">
          Performance de atendimento das lojas
        </p>
      </div>

      <Suspense fallback={<DualChartSkeleton />}>
        <ContatoRankingSection />
      </Suspense>
    </div>
  )
}