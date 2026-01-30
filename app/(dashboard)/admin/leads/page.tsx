import { requireAdmin } from '@/lib/auth'
import { LeadsTable } from '@/components/dashboard/leads-table'
import { LeadsPagination } from '@/components/dashboard/leads-pagination'
import { LojaFilter } from '@/components/dashboard/loja-filter'
import { getFilteredLeads, mockLojas } from '@/lib/mock-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
  
  const leadsResponse = getFilteredLeads(lojaId, page, 10)

  const selectedLoja = lojaId
    ? mockLojas.find((l) => l.id === lojaId)?.nome
    : undefined

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Todos os Leads</h2>
        <p className="text-muted-foreground">
          Gerencie os leads de todas as unidades
        </p>
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
            <LojaFilter lojas={mockLojas} selectedLojaId={lojaId} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>
    </div>
  )
}
