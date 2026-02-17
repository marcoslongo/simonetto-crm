import { requireAuth } from '@/lib/auth'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { LeadsTable } from '@/components/leads/leads-table'
import { getDashboardStats, getLeads } from '@/lib/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock } from 'lucide-react'
import { Lead } from '@/lib/types'

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

  const naoAtendidos = isLoja
    ? recentLeadsResponse.leads.filter((l: any) => !l.atendido)
    : []
  const atendidos = isLoja
    ? recentLeadsResponse.leads.filter((l: any) => l.atendido)
    : []

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

      {isLoja ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-base">Não Atendidos</CardTitle>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-700 hover:bg-amber-100"
                >
                  {naoAtendidos.length}
                </Badge>
              </div>
              <CardDescription>
                Leads aguardando primeiro contato
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {naoAtendidos.length === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                    Nenhum lead pendente 🎉
                  </p>
                ) : (
                  naoAtendidos.map((lead: any) => (
                    <LeadKanbanRow key={lead.id} lead={lead} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <CardTitle className="text-base">Atendidos</CardTitle>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                >
                  {atendidos.length}
                </Badge>
              </div>
              <CardDescription>Leads que já foram contactados</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {atendidos.length === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                    Nenhum lead atendido ainda
                  </p>
                ) : (
                  atendidos.map((lead: any) => (
                    <LeadKanbanRow key={lead.id} lead={lead} attended />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Leads Recentes</CardTitle>
            <CardDescription>
              Últimos leads capturados em todas as unidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadsTable
              leads={recentLeadsResponse.leads}
              showLoja={true}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}


function LeadKanbanRow({
  lead,
  attended = false,
}: {
  lead: Lead
  attended?: boolean
}) {
  const createdAt = new Date(lead.data_criacao).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })

  return (
    <div className="flex items-start justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/40">
      <div className="min-w-0 flex-1 space-y-1">
        <p
          className={`truncate text-sm font-medium ${
            attended ? 'text-muted-foreground' : 'text-foreground'
          }`}
        >
          {lead.nome}
        </p>

        {lead.email && (
          <p className="truncate text-xs text-muted-foreground">{lead.email}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {lead.cidade && (
            <span className="text-xs text-muted-foreground">
              {lead.cidade}
              {lead.estado ? `, ${lead.estado}` : ''}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        {lead.expectativa_investimento && (
          <span className="text-xs font-medium text-emerald-600">
            R$ {lead.expectativa_investimento}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground">{createdAt}</span>
      </div>
    </div>
  )
}