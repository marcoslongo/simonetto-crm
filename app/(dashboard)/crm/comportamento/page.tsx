import { requireAuth } from '@/lib/auth'
import { getLeadsTrackingDeviceServer, getLeadsTrackingHorarioServer } from '@/lib/server-leads-service'
import { ChartDeviceBreakdown } from '@/components/dashboard/chart-device-breakdown'
import { ChartHorarioLeads } from '@/components/dashboard/chart-horario-leads'

export const metadata = {
  title: 'Comportamento | Noxus - Lead Ops',
  description: 'Horários de captação e dispositivos dos leads da sua unidade',
}

export default async function ComportamentoPage() {
  const user = await requireAuth()

  const isLoja = user.role === 'loja'
  const lojaId = isLoja ? (user.loja_ids[0] ?? undefined) : undefined

  const [deviceData, horarioData] = await Promise.all([
    getLeadsTrackingDeviceServer(undefined, undefined, lojaId),
    getLeadsTrackingHorarioServer(undefined, undefined, lojaId),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Comportamento</h2>
        <p className="text-muted-foreground mt-1">
          Quando e como os leads chegam até a sua unidade
        </p>
      </div>

      <ChartHorarioLeads data={horarioData} />

      <ChartDeviceBreakdown data={deviceData} />
    </div>
  )
}
