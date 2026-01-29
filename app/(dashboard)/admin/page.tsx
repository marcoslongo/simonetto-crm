import { requireAdmin } from '@/lib/auth'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { LeadsTable } from '@/components/dashboard/leads-table'
import { getFilteredLeads, getDashboardStats, mockLojas } from '@/lib/mock-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Store } from 'lucide-react'

export const metadata = {
  title: 'Admin Dashboard | CRM Multi-Unidades',
  description: 'Painel administrativo',
}

export default async function AdminDashboardPage() {
  const user = await requireAdmin()
  
  // Admin vê todos os dados
  const stats = getDashboardStats()
  const recentLeads = getFilteredLeads(undefined, 1, 5)

  // Formata a última captura
  const ultimaCaptura = stats.ultimoLead
    ? new Date(stats.ultimoLead.data_criacao).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : undefined

  // Estatísticas por loja
  const statsByLoja = mockLojas.map((loja) => {
    const lojaStats = getDashboardStats(loja.id)
    return {
      ...loja,
      totalLeads: lojaStats.totalLeads,
      leadsHoje: lojaStats.leadsHoje,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Painel Administrativo</h2>
        <p className="text-muted-foreground">
          Visão geral de todas as unidades do sistema
        </p>
      </div>

      <StatsCards
        totalLeads={stats.totalLeads}
        leadsHoje={stats.leadsHoje}
        ultimaCaptura={ultimaCaptura}
      />

      {/* Estatísticas por Loja */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Leads por Unidade
          </CardTitle>
          <CardDescription>
            Distribuição de leads entre as unidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statsByLoja.map((loja) => (
              <div
                key={loja.id}
                className="rounded-lg border p-4 space-y-2"
              >
                <p className="font-medium truncate">{loja.nome}</p>
                <p className="text-sm text-muted-foreground">{loja.localizacao}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {loja.totalLeads} leads
                  </Badge>
                  {loja.leadsHoje > 0 && (
                    <Badge variant="default">
                      +{loja.leadsHoje} hoje
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leads Recentes</CardTitle>
          <CardDescription>
            Últimos leads de todas as unidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadsTable
            leads={recentLeads.leads}
            basePath="/admin"
            showLoja={true}
          />
        </CardContent>
      </Card>
    </div>
  )
}
