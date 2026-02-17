import { isAdmin, requireAuth } from '@/lib/auth'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { getDashboardStats, getLeads } from '@/lib/api'

export const metadata = {
  title: 'Dashboard | Noxus - Lead Ops',
  description: 'Dashboard da sua unidade',
}

export default async function CrmDashboardPage() {
  const user = await requireAuth()

  const isLoja = user.role === 'loja'
  const lojaId = isLoja ? (user.loja_id ?? undefined) : undefined

  const [stats, recentLeadsResponse] = await Promise.all([
    getDashboardStats(lojaId),
    getLeads({ page: 1, per_page: 50, loja_id: lojaId }),
  ])

  const ultimaCaptura = stats.ultimoLead
    ? new Date(stats.ultimoLead.data_criacao).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : undefined

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          {isLoja
            ? `Visão geral da sua unidade: ${user.loja_nome || user.name}`
            : 'Visão geral de todas as unidades (Administrador)'}
        </p>
      </div>

      <StatsCards
        totalLeads={stats.totalLeads}
        leadsHoje={stats.leadsHoje}
        ultimaCaptura={ultimaCaptura}
      />
    </div>
  )
}