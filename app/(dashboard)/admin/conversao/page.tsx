import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth'
import { ChartCardSkeleton } from '@/components/dashboard/dashboard-skeletons'

export const metadata = {
  title: 'Conversão | Noxus',
}

export default async function ConversaoPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">
          Conversão
        </h2>
        <p className="text-muted-foreground mt-1">
          Análise do funil e taxas de conversão
        </p>
      </div>

      <Suspense fallback={<ChartCardSkeleton height="h-[350px]" />}>
        <div>EM DESENVOLVIMENTO</div>
      </Suspense>
    </div>
  )
}