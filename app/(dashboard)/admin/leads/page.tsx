import { requireAdmin } from '@/lib/auth'
import { LeadsPagination } from '@/components/leads/leads-pagination'
import { LojaFilter } from '@/components/lojas/loja-filter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getLeads, getLojas } from '@/lib/leads-service'
import { LeadsSearch } from '@/components/leads/leads-search'
import { DateRangeFilter } from '@/components/leads/date-range-filter'
import { LeadsTable } from '@/components/leads/leads-table'

export const metadata = {
  title: 'Todos os Leads | Noxus - Lead Ops',
  description: 'Gestão de leads de todas as unidades',
}

interface AdminLeadsPageProps {
  searchParams: Promise<{
    page?: string
    loja?: string
    search?: string
    from?: string
    to?: string
  }>
}

export default async function AdminLeadsPage({ searchParams }: AdminLeadsPageProps) {
  await requireAdmin()
  const params = await searchParams

  const page = Number(params.page) || 1
  const lojaId = params.loja ? Number(params.loja) : undefined
  const search = params.search || undefined
  const from = params.from || undefined
  const to = params.to || undefined

  const [leadsResponse, lojasData] = await Promise.all([
    getLeads(page, 10, lojaId, search, from, to),
    getLojas().catch(() => ({ lojas: [] })),
  ])

  const selectedLoja =
    lojaId && leadsResponse.leads.length > 0
      ? leadsResponse.leads[0].loja_nome
      : undefined

  const hasDateFilter = from || to
  const dateFilterLabel =
    from && to
      ? `${from} até ${to}`
      : from
      ? `A partir de ${from}`
      : to
      ? `Até ${to}`
      : null

  // Normaliza lojas para o formato { id, nome } esperado pelo LeadsTable/LeadDetailsModal
  const lojas = (lojasData.lojas ?? []).map((l: any) => ({
    id: Number(l.id),
    nome: l.nome ?? l.post_title ?? '',
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Todos os Leads</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie os leads de todas as unidades
        </p>
      </div>

      <Card className="bg-linear-to-br from-slate-50 to-slate-100">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Leads</CardTitle>
                <CardDescription>
                  {selectedLoja
                    ? `Filtrando por: ${selectedLoja}`
                    : search
                    ? `Resultados para: "${search}"`
                    : hasDateFilter
                    ? `Período: ${dateFilterLabel}`
                    : `Total de ${leadsResponse.total} leads`}
                </CardDescription>
              </div>

              {lojasData.lojas?.length > 0 && (
                <LojaFilter lojas={lojasData.lojas} selectedLojaId={lojaId} />
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <LeadsSearch />
              <DateRangeFilter />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {leadsResponse.leads.length > 0 ? (
            <>
              <LeadsTable
                leads={leadsResponse.leads}
                showLoja
                isAdmin
                lojas={lojas}
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
              {search
                ? `Nenhum lead encontrado para "${search}"`
                : hasDateFilter
                ? `Nenhum lead encontrado no período selecionado`
                : 'Nenhum lead encontrado'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}