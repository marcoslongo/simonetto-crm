import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth'
import { ChartCardSkeleton } from '@/components/dashboard/dashboard-skeletons'
import { InteresseSection } from '@/components/dashboard/dashboard-sections'

export const metadata = {
  title: 'Perfil dos Leads | Noxus',
}

export default async function PerfilPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">
          Perfil dos Leads
        </h2>
        <p className="text-muted-foreground mt-1">
          Interesses e comportamento dos leads
        </p>
      </div>

      <Suspense fallback={<ChartCardSkeleton height="h-[350px]" />}>
        <InteresseSection />
      </Suspense>
    </div>
  )
}