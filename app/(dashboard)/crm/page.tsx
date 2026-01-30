import { requireAuth } from '@/lib/auth'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { LeadsTable } from '@/components/dashboard/leads-table'
import { getFilteredLeads, getDashboardStats } from '@/lib/mock-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Dashboard | CRM Multi-Unidades',
  description: 'Dashboard da sua unidade',
}

export default async function CrmDashboardPage() {
  const user = await requireAuth()
  console.log(user);
  
  // Usuários de loja só veem seus próprios dados
  const lojaId = user.role ? user.loja_id : undefined
  
  // Busca estatísticas e últimos leads
  const stats = getDashboardStats(lojaId)
  const recentLeads = getFilteredLeads(lojaId, 1, 5)

  // Formata a última captura
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
          {user.role === 'loja'
            ? `Visão geral da sua unidade: ${user.loja_nome}`
            : 'Visão geral de todas as unidades'}
        </p>
      </div>

      <StatsCards
        totalLeads={stats.totalLeads}
        leadsHoje={stats.leadsHoje}
        ultimaCaptura={ultimaCaptura}
      />

      <Card>
        <CardHeader>
          <CardTitle>Leads Recentes</CardTitle>
          <CardDescription>
            Últimos leads capturados {user.role === 'loja' ? 'na sua unidade' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadsTable
            leads={recentLeads.leads}
            basePath="/crm"
            showLoja={user.role === 'administrator'}
          />
        </CardContent>
      </Card>
    </div>
  )
}
