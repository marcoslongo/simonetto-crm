import { isAdmin, requireAuth } from '@/lib/auth'
import { getLojaStats, getLojaLeads30Days, getLojaLeads12Months } from '@/lib/api-loja'
import { ChartLeads30Days } from '@/components/dashboard/chart-line-30-days'
import { ChartLeads12Months } from '@/components/dashboard/chart-leads-12-months'
import { StatsCards } from '@/components/lojas/stats-cards'

export const metadata = {
  title: 'Dashboard | Noxus - Lead Ops',
  description: 'Dashboard da sua unidade',
}

export default async function CrmDashboardPage() {
  const user = await requireAuth()

  const isLoja = user.role === 'loja'
  const lojaId = isLoja ? (user.loja_id ?? undefined) : undefined

  const [stats, leads30Days, leads12Months] = await Promise.all([
    getLojaStats(String(lojaId)),
    getLojaLeads30Days(String(lojaId)),
    getLojaLeads12Months(String(lojaId)),
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
      <div>
        <StatsCards stats={stats} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <ChartLeads30Days data={leads30Days} />
        <ChartLeads12Months data={leads12Months} />
      </div>
    </div>
  )
}