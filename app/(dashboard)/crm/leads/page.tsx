import { requireAuth } from '@/lib/auth'
import { LeadsTable } from '@/components/dashboard/leads-table'
import { LeadsPagination } from '@/components/dashboard/leads-pagination'
import { getFilteredLeads } from '@/lib/mock-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Leads | CRM Multi-Unidades',
  description: 'Lista de leads da sua unidade',
}

interface CrmLeadsPageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function CrmLeadsPage({ searchParams }: CrmLeadsPageProps) {
  const user = await requireAuth()
  const params = await searchParams
  
  // Usuários de loja só veem seus próprios dados
  const lojaId = user.role === 'loja' ? user.loja_id : undefined
  const page = Number(params.page) || 1
  
  // Busca leads
  const leadsResponse = getFilteredLeads(lojaId, page, 10)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Leads</h2>
        <p className="text-muted-foreground">
          {user.role === 'loja'
            ? `Gerencie os leads da sua unidade: ${user.loja_nome}`
            : 'Gerencie todos os leads do sistema'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Leads</CardTitle>
          <CardDescription>
            Total de {leadsResponse.total} leads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LeadsTable
            leads={leadsResponse.leads}
            basePath="/crm"
            showLoja={user.role === 'administrator'}
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
