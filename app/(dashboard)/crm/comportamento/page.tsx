import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth'
import { getLeadsTrackingDeviceServer, getLeadsTrackingHorarioServer } from '@/lib/server-leads-service'
import { ChartDeviceBreakdown } from '@/components/dashboard/chart-device-breakdown'
import { ChartHorarioLeads } from '@/components/dashboard/chart-horario-leads'
import { ChartCardSkeleton } from '@/components/dashboard/dashboard-skeletons'

export const metadata = {
  title: 'Comportamento | Noxus - Lead Ops',
  description: 'Horários de captação e dispositivos dos leads da sua unidade',
}

async function HorarioChart({ lojaId }: { lojaId?: number }) {
  const data = await getLeadsTrackingHorarioServer(undefined, undefined, lojaId)
  return <ChartHorarioLeads data={data} />
}

async function DeviceChart({ lojaId }: { lojaId?: number }) {
  const data = await getLeadsTrackingDeviceServer(undefined, undefined, lojaId)
  return <ChartDeviceBreakdown data={data} />
}

export default async function ComportamentoPage() {
  const user = await requireAuth()

  const isLoja = user.role === 'loja'
  const lojaId = isLoja ? (user.loja_ids[0] ?? undefined) : undefined

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Comportamento</h2>
        <p className="text-muted-foreground mt-1">
          Quando e como os leads chegam até a sua unidade
        </p>
      </div>

      <Suspense fallback={<ChartCardSkeleton height="h-80" />}>
        <HorarioChart lojaId={lojaId} />
      </Suspense>

      <Suspense fallback={<ChartCardSkeleton height="h-72" />}>
        <DeviceChart lojaId={lojaId} />
      </Suspense>
    </div>
  )
}
