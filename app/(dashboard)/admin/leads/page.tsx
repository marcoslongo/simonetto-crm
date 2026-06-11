import { requireAdmin, isMaster } from '@/lib/auth'
import { LeadsPagination } from '@/components/leads/leads-pagination'
import { LojaFilter } from '@/components/lojas/loja-filter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getLeadsServer, getLojasServer } from '@/lib/server-leads-service'
import { LeadsSearch } from '@/components/leads/leads-search'
import { DateRangeFilter } from '@/components/leads/date-range-filter'
import { LeadsTable } from '@/components/leads/leads-table'
import { OrigemFilter } from '@/components/leads/origem-filter'
import { getKanbanColumns } from '@/lib/api-loja'
import type { LeadOrigem } from '@/lib/types'

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
    origem?: string
  }>
}

export default async function AdminLeadsPage({ searchParams }: AdminLeadsPageProps) {
  const user = await requireAdmin()
  const master = isMaster(user)
  const params = await searchParams

  const page = Number(params.page) || 1
  const lojaId = params.loja ? Number(params.loja) : undefined
  const search = params.search || undefined
  const from = params.from || undefined
  const to = params.to || undefined
  const origemRaw = params.origem
  // Admin não-master não pode ver leads 'proprio' — ignora o filtro se vier na URL
  const origem = (origemRaw === 'industria' || (origemRaw === 'proprio' && master))
    ? origemRaw as LeadOrigem
    : undefined

  const [leadsResponse, lojasData] = await Promise.all([
    getLeadsServer(page, 10, lojaId, search, from, to, origem),
    getLojasServer().catch(() => ({ lojas: [] })),
  ])

  // Busca as colunas Kanban das lojas presentes nesta página para montar o mapa slug→label
  const lojaIdsNaPagina = [...new Set(
    leadsResponse.leads.map(l => l.loja_id).filter(Boolean).map(Number)
  )]
  const colunasArrays = await Promise.all(lojaIdsNaPagina.map(id => getKanbanColumns(id).catch(() => [])))
  const statusLabels: Record<string, string> = {}
  for (const colunas of colunasArrays) {
    for (const col of colunas) {
      // Não sobrescreve um label já encontrado (primeira loja ganha para slugs fixos)
      if (!statusLabels[col.slug]) statusLabels[col.slug] = col.label
    }
  }

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

  const origemLabel =
    origem === 'industria' ? 'Indústria' : origem === 'proprio' ? 'Próprio' : undefined

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
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <CardTitle>Leads</CardTitle>
                <CardDescription>
                  {origemLabel
                    ? `Origem: ${origemLabel} — ${leadsResponse.total} lead${leadsResponse.total !== 1 ? 's' : ''}`
                    : selectedLoja
                    ? `Filtrando por: ${selectedLoja}`
                    : search
                    ? `Resultados para: "${search}"`
                    : hasDateFilter
                    ? `Período: ${dateFilterLabel}`
                    : `Total de ${leadsResponse.total} leads`}
                </CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <OrigemFilter showProprio={master} />
                {lojasData.lojas?.length > 0 && (
                  <LojaFilter lojas={lojasData.lojas} selectedLojaId={lojaId} />
                )}
              </div>
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
                statusLabels={statusLabels}
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
              {origemLabel
                ? `Nenhum lead de origem "${origemLabel}" encontrado`
                : search
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
