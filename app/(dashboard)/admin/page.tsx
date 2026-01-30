import { requireAdmin } from '@/lib/auth'
import { LeadsTable } from '@/components/dashboard/leads-table'
import { LeadsPagination } from '@/components/dashboard/leads-pagination'
import { LojaFilter } from '@/components/dashboard/loja-filter'
import { getLeads, getLojas } from '@/lib/leads-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartLineInteractive } from '@/components/dashboard/chart-line'

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

  const [leadsResponse, lojasData] = await Promise.all([
    getLeads(page, 10, lojaId),
    getLojas().catch(() => ({ lojas: [] }))
  ])

  const selectedLoja = lojaId && leadsResponse.leads.length > 0
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

      <ChartLineInteractive />

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
            {lojasData.lojas && lojasData.lojas.length > 0 && (
              <LojaFilter lojas={lojasData.lojas} selectedLojaId={lojaId} />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {leadsResponse.leads.length > 0 ? (
            <>
              <LeadsTable
                leads={leadsResponse.leads}
                showLoja={true}
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