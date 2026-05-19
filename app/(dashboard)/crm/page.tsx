import { requireAuth } from '@/lib/auth'
import { getLojaStats, getLojaLeads30Days, getLojaLeads12Months, getLojaStatusFunil, getLojaClassificacao } from '@/lib/api-loja'
import { getLeadsTrackingDeviceServer, getLeadsTrackingHorarioServer } from '@/lib/server-leads-service'
import { ChartLeads12Months } from '@/components/dashboard/chart-leads-12-months'
import { StatsCards } from '@/components/lojas/stats-cards'
import { ChartLeads30Days } from '@/components/lojas/chart-line-30-days'
import { KanbanStatsCards } from '@/components/dashboard/kanban-stats-cards'
import { LeadsTemperature } from '@/components/dashboard/leads-temperature'
import { ChartDeviceBreakdown } from '@/components/dashboard/chart-device-breakdown'
import { ChartHorarioLeads } from '@/components/dashboard/chart-horario-leads'

export const metadata = {
  title: 'Dashboard | Noxus - Lead Ops',
  description: 'Dashboard da sua unidade',
}

export default async function CrmDashboardPage() {
  const user = await requireAuth()

  const isLoja = user.role === 'loja'
  const lojaId = isLoja ? (user.loja_id ?? undefined) : undefined

  const lojaIdNum = lojaId ? Number(lojaId) : undefined

  const [stats, leads30Days, leads12Months, statusFunil, classificacao, deviceData, horarioData] = await Promise.all([
    getLojaStats(String(lojaId)),
    getLojaLeads30Days(String(lojaId)),
    getLojaLeads12Months(String(lojaId)),
    getLojaStatusFunil(String(lojaId)),
    getLojaClassificacao(String(lojaId)),
    getLeadsTrackingDeviceServer(undefined, undefined, lojaIdNum),
    getLeadsTrackingHorarioServer(undefined, undefined, lojaIdNum),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          {isLoja
            ? `Visão geral da sua unidade: ${user.loja_nome || user.name}`
            : 'Visão geral de todas as unidades (Administrador)'}
        </p>
      </div>

      <StatsCards stats={stats} />

      <KanbanStatsCards
        data={statusFunil}
        description="Acompanhamento da jornada de vendas da sua unidade"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadsTemperature
          quentes={classificacao.quente}
          mornos={classificacao.morno}
          frios={classificacao.frio}
        />
        <ChartLeads30Days data={leads30Days} />
      </div>

      <ChartLeads12Months data={leads12Months} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartDeviceBreakdown data={deviceData} />
        <ChartHorarioLeads data={horarioData} />
      </div>
    </div>
  )
}