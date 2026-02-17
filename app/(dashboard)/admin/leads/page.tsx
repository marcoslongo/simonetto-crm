import { requireAdmin } from '@/lib/auth'
import { LeadsPagination } from '@/components/leads/leads-pagination'
import { LojaFilter } from '@/components/lojas/loja-filter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getLeads, getLojas } from '@/lib/leads-service'
import { LeadsViewSwitcher } from '@/components/leads/leads-view-switcher'
import { LeadsSearch } from '@/components/leads/leads-search'

export const metadata = {
  title: 'Todos os Leads | Noxus - Lead Ops',
  description: 'Gestão de leads de todas as unidades',
}

interface AdminLeadsPageProps {
  searchParams: Promise<{ page?: string; loja?: string; search?: string }>
}

export default async function AdminLeadsPage({ searchParams }: AdminLeadsPageProps) {
  await requireAdmin()
  const params = await searchParams

  const page = Number(params.page) || 1
  const lojaId = params.loja ? Number(params.loja) : undefined
  const search = params.search || undefined

  const [
    leadsResponse,
    lojasData,
  ] = await Promise.all([
    getLeads(page, 10, lojaId, search),
    getLojas().catch(() => ({ lojas: [] })),
  ])

  const selectedLoja =
    lojaId && leadsResponse.leads.length > 0
      ? leadsResponse.leads[0].loja_nome
      : undefined

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Todos os Leads</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie os leads de todas as unidades
        </p>
      </div>

      <Card className='bg-linear-to-br from-slate-50 to-slate-100'>
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
                    : `Total de ${leadsResponse.total} leads`}
                </CardDescription>
              </div>

              {lojasData.lojas?.length > 0 && (
                <LojaFilter lojas={lojasData.lojas} selectedLojaId={lojaId} />
              )}
            </div>

            <LeadsSearch />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {leadsResponse.leads.length > 0 ? (
            <>
              <LeadsViewSwitcher leads={leadsResponse.leads} showLoja isAdmin />

              <LeadsPagination
                currentPage={leadsResponse.page}
                totalPages={leadsResponse.total_pages}
                total={leadsResponse.total}
                perPage={leadsResponse.per_page}
              />
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {search ? `Nenhum lead encontrado para "${search}"` : 'Nenhum lead encontrado'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}