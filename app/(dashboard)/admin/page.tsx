import { requireAdmin } from '@/lib/auth'
import { LeadsTable } from '@/components/dashboard/leads-table'
import { LeadsPagination } from '@/components/dashboard/leads-pagination'
import { LojaFilter } from '@/components/dashboard/loja-filter'
import { getLeadsStats, getLeads, getLojas, groupLeadsByFaturamento, getFaturamentoStats } from '@/lib/leads-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartLineInteractive } from '@/components/dashboard/chart-line'
import { ChartPieSeparatorNone } from '@/components/dashboard/pie-chart'
import { ChartBarLabel } from '@/components/dashboard/bar-chart'
import { ChartBarMixed } from '@/components/dashboard/bar-chart-mixed'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { formatLastCapture } from '@/lib/utils'

export const metadata = {
  title: 'Todos os Leads | CRM Multi-Unidades',
  description: 'Gestão de leads de todas as unidades',
}

interface AdminLeadsPageProps {
  searchParams: Promise<{ page?: string; loja?: string }>
}

export default async function AdminLeadsPage({ searchParams }: AdminLeadsPageProps) {
  await requireAdmin()
  const params = await searchParams

  const page = Number(params.page) || 1
  const lojaId = params.loja ? Number(params.loja) : undefined

  const [leadsResponse, lojasData, stats, faturamentoPorFaixa] = await Promise.all([
    getLeads(page, 10, lojaId),
    getLojas().catch(() => ({ lojas: [] })),
    getLeadsStats(lojaId),
    getFaturamentoStats(lojaId),
  ])

  const faturamentoChartData = Object.entries(faturamentoPorFaixa).map(
    ([faixa, total], index) => ({
      faixa,
      total,
      fill: `var(--chart-${index + 1})`,
    })
  )


  const selectedLoja =
    lojaId && leadsResponse.leads.length > 0
      ? leadsResponse.leads[0].loja_nome
      : undefined

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Todos os Leads</h2>
        <p className="text-muted-foreground">
          Gerencie os leads de todas as unidades
        </p>
      </div>

      <StatsCards
        totalLeads={stats.total}
        leadsHoje={stats.today}
        ultimaCaptura={formatLastCapture(stats.ultimaCaptura)}
      />

      <div className="grid grid-cols-2 gap-4">
        <ChartLineInteractive />
        <ChartPieSeparatorNone data={faturamentoChartData} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ChartBarLabel />
        <ChartBarMixed />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Leads</CardTitle>
              <CardDescription>
                {selectedLoja
                  ? `Filtrando por: ${selectedLoja}`
                  : `Total de ${leadsResponse.total} leads`}
              </CardDescription>
            </div>

            {lojasData.lojas?.length > 0 && (
              <LojaFilter lojas={lojasData.lojas} selectedLojaId={lojaId} />
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {leadsResponse.leads.length > 0 ? (
            <>
              <LeadsTable
                leads={leadsResponse.leads}
                showLoja
              />

              <LeadsPagination
                currentPage={leadsResponse.page}
                totalPages={leadsResponse.total_pages}
                total={leadsResponse.total}
                perPage={leadsResponse.per_page}
              />
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum lead encontrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}