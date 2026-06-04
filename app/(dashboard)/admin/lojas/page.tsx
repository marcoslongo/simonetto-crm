import { requireAdmin } from '@/lib/auth'
import { buscarLojasServer } from '@/lib/server-lojas-service'
import type { SortBy } from '@/lib/lojas-service'
import { getLojaFunilSaude, getConversaoPorLoja } from '@/lib/api-loja'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2, Mail, MapPin, Search, TrendingUp, ArrowUpDown } from 'lucide-react'
import { LeadsPagination } from '@/components/leads/leads-pagination'
import Link from 'next/link'
import { Input } from '@/components/ui/input'

type HealthStatus = 'verde' | 'amarelo' | 'vermelho' | 'neutro'

function getHealthStatus(
  slaBreachPct: number,
  activeLeads: number,
  taxaConversao?: number,
  avgConversao?: number,
): HealthStatus {
  if (activeLeads === 0 && !taxaConversao) return 'neutro'
  const slaCritico = slaBreachPct >= 30
  const slaAtencao = slaBreachPct >= 15
  const conversaoCritica = avgConversao !== undefined && taxaConversao !== undefined && taxaConversao < avgConversao * 0.5
  const conversaoAtencao = avgConversao !== undefined && taxaConversao !== undefined && taxaConversao < avgConversao * 0.75
  if (slaCritico || conversaoCritica) return 'vermelho'
  if (slaAtencao || conversaoAtencao) return 'amarelo'
  return 'verde'
}

function getHealthLabel(
  slaBreachPct: number,
  taxaConversao?: number,
  avgConversao?: number,
): string {
  if (slaBreachPct >= 30) return 'SLA Crítico'
  if (avgConversao && taxaConversao !== undefined && taxaConversao < avgConversao * 0.5) return 'Conv. Crítica'
  if (slaBreachPct >= 15) return 'SLA Atenção'
  if (avgConversao && taxaConversao !== undefined && taxaConversao < avgConversao * 0.75) return 'Conv. Atenção'
  return 'Saudável'
}

const healthConfig: Record<HealthStatus, { dot: string; badge: string }> = {
  verde:    { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  amarelo:  { dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200'       },
  vermelho: { dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200'             },
  neutro:   { dot: 'bg-slate-300',   badge: 'bg-slate-50 text-slate-500 border-slate-200'       },
}

export const metadata = {
  title: 'Lojas | Admin',
  description: 'Gerenciamento de unidades',
}

interface AdminLojasPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    sortBy?: string
  }>
}

const PER_PAGE = 9

export default async function AdminLojasPage({
  searchParams,
}: AdminLojasPageProps) {
  await requireAdmin()

  const params = await searchParams
  const page = Number(params.page) || 1
  const searchQuery = params.search || ''
  const sortBy = (params.sortBy as SortBy) || 'nome'

  const resultado = await buscarLojasServer({
    search: searchQuery,
    sortBy,
    page,
    perPage: PER_PAGE,
  })

  const { items: lojasPaginadas, total, totalPages } = resultado

  const [saudeResults, conversaoData] = await Promise.all([
    Promise.all(lojasPaginadas.map(async (loja) => [loja.id, await getLojaFunilSaude(loja.id)] as const)),
    getConversaoPorLoja(),
  ])

  const saudeMap = Object.fromEntries(saudeResults)
  const conversaoMap = Object.fromEntries(conversaoData.map(c => [c.loja_id, c]))
  const avgConversao = conversaoData.length
    ? conversaoData.reduce((s, c) => s + c.taxa_conversao, 0) / conversaoData.length
    : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Unidades</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie todas as lojas do sistema
          </p>
        </div>
      </div>

      <Card className='bg-linear-to-br from-slate-50 to-slate-100'>
        <CardContent>
          <div className='flex flex-col gap-4'>
            <div>
              <CardTitle>Lojas</CardTitle>
              <CardDescription>
                {total} {total === 1 ? 'unidade' : 'unidades'}
              </CardDescription>
            </div>
            <form className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  name="search"
                  placeholder="Buscar por nome, localização ou email..."
                  defaultValue={searchQuery}
                  className="pl-10 h-11 bg-white"
                />
              </div>
              <div className="flex gap-2">
                <Select name="sortBy" defaultValue={sortBy}>
                  <SelectTrigger className="w-55 h-11 bg-white">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nome">Nome (A-Z)</SelectItem>
                    <SelectItem value="nome-desc">Nome (Z-A)</SelectItem>
                    <SelectItem value="leads-desc">Mais leads</SelectItem>
                    <SelectItem value="leads-asc">Menos leads</SelectItem>
                    <SelectItem value="hoje-desc">Mais leads hoje</SelectItem>
                    <SelectItem value="hoje-asc">Menos leads hoje</SelectItem>
                    <SelectItem value="localizacao">Localização (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" size="lg" className="h-11 px-6 bg-[#16255c] cursor-pointer hover:bg-[#16255c] hover:opacity-90">
                  <Search className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Buscar</span>
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>

      {lojasPaginadas.length > 0 ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lojasPaginadas.map((loja) => {
              const saude = saudeMap[loja.id]
              const conv = conversaoMap[Number(loja.id)]
              const taxaConversao = conv?.taxa_conversao
              const health = getHealthStatus(saude?.sla_breach_pct ?? 0, saude?.active_leads ?? 0, taxaConversao, avgConversao)
              const hc = healthConfig[health]
              const label = getHealthLabel(saude?.sla_breach_pct ?? 0, taxaConversao, avgConversao)
              const vsMedia = taxaConversao !== undefined && avgConversao > 0
                ? Math.round((taxaConversao - avgConversao) * 10) / 10
                : null
              return (
                <Card
                  key={loja.id}
                  className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-linear-to-br from-slate-50 to-slate-100"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg leading-tight">
                            {loja.nome}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            ID: {loja.id}
                          </p>
                        </div>
                      </div>
                      <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border ${hc.badge}`}>
                        <span className={`h-2 w-2 rounded-full ${hc.dot}`} />
                        {label}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="line-clamp-1">{loja.localizacao}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      {loja.emails && loja.emails[0] ? (
                        <a
                          href={`mailto:${loja.emails[0].email}`}
                          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          <Mail className="h-4 w-4 shrink-0" />
                          <span className="truncate">{loja.emails[0].email}</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4 shrink-0" />
                          <span>Sem email</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Total / Hoje</p>
                        <p className="text-xl font-bold">
                          {loja.totalLeads}
                          {loja.leadsHoje > 0 && (
                            <span className="text-sm font-medium text-green-600 ml-1.5">+{loja.leadsHoje}</span>
                          )}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Ativos</p>
                        <p className={`text-xl font-bold ${saude?.active_leads ? 'text-blue-600' : 'text-muted-foreground'}`}>
                          {saude?.active_leads ?? '—'}
                        </p>
                      </div>
                    </div>

                    {taxaConversao !== undefined && (
                      <div className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 border border-border/40">
                        <div>
                          <p className="text-xs text-muted-foreground">Conversão</p>
                          <p className={`text-lg font-bold ${taxaConversao >= avgConversao ? 'text-emerald-600' : 'text-red-500'}`}>
                            {taxaConversao}%
                          </p>
                        </div>
                        {vsMedia !== null && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">vs. rede</p>
                            <p className={`text-sm font-semibold ${vsMedia >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {vsMedia >= 0 ? '+' : ''}{vsMedia}%
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <Link
                      href={`/admin/lojas/${loja.id}`}
                      className="block w-full rounded-lg bg-[#16255c] hover:bg-[#16255c] hover:opacity-90 px-4 py-2.5 text-center text-sm font-medium text-white transition-all"
                    >
                      Ver detalhes
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <LeadsPagination
            currentPage={page}
            totalPages={totalPages}
            total={total}
            perPage={PER_PAGE}
          />
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma loja encontrada
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchQuery
                ? `Não encontramos lojas com "${searchQuery}". Tente buscar por outro termo.`
                : 'Não há lojas cadastradas no sistema.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}