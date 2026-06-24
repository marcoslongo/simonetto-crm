import { requireAdmin } from '@/lib/auth'
import { buscarLojasServer } from '@/lib/server-lojas-service'
import type { SortBy } from '@/lib/lojas-service'
import { getLojaFunilSaude, getConversaoPorLoja } from '@/lib/api-loja'
import {
  Building2, Mail, MapPin, Search, ArrowUpDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { LeadsPagination } from '@/components/leads/leads-pagination'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'Lojas | Admin',
  description: 'Gerenciamento de unidades',
}

type HealthStatus = 'verde' | 'amarelo' | 'vermelho' | 'neutro'

function getHealthStatus(
  slaBreachPct: number,
  activeLeads: number,
  taxaConversao?: number,
  avgConversao?: number,
): HealthStatus {
  if (activeLeads === 0 && !taxaConversao) return 'neutro'
  const slaCritico        = slaBreachPct >= 30
  const slaAtencao        = slaBreachPct >= 15
  const conversaoCritica  = avgConversao !== undefined && taxaConversao !== undefined && taxaConversao < avgConversao * 0.5
  const conversaoAtencao  = avgConversao !== undefined && taxaConversao !== undefined && taxaConversao < avgConversao * 0.75
  if (slaCritico || conversaoCritica) return 'vermelho'
  if (slaAtencao || conversaoAtencao) return 'amarelo'
  return 'verde'
}

function getHealthLabel(slaBreachPct: number, taxaConversao?: number, avgConversao?: number): string {
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

interface AdminLojasPageProps {
  searchParams: Promise<{ page?: string; search?: string; sortBy?: string }>
}

const PER_PAGE = 9

export default async function AdminLojasPage({ searchParams }: AdminLojasPageProps) {
  await requireAdmin()

  const params      = await searchParams
  const page        = Number(params.page) || 1
  const searchQuery = params.search || ''
  const sortBy      = (params.sortBy as SortBy) || 'nome'

  const resultado = await buscarLojasServer({ search: searchQuery, sortBy, page, perPage: PER_PAGE })
  const { items: lojasPaginadas, total, totalPages } = resultado

  const [saudeResults, conversaoData] = await Promise.all([
    Promise.all(lojasPaginadas.map(async (loja) => [loja.id, await getLojaFunilSaude(loja.id)] as const)),
    getConversaoPorLoja(),
  ])

  const saudeMap     = Object.fromEntries(saudeResults)
  const conversaoMap = Object.fromEntries(conversaoData.map(c => [c.loja_id, c]))
  const avgConversao = conversaoData.length
    ? conversaoData.reduce((s, c) => s + c.taxa_conversao, 0) / conversaoData.length
    : 0

  const sorted  = [...lojasPaginadas]
    .map(l => ({ id: l.id, conv: conversaoMap[Number(l.id)]?.taxa_conversao ?? 0 }))
    .sort((a, b) => b.conv - a.conv)
  const rankMap = new Map(sorted.map((l, i) => [l.id, i + 1]))
  const best    = sorted[0]
  const worst   = sorted[sorted.length - 1]

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .loja-card { animation: fadeUp 0.3s ease both; }
      `}</style>

      <div className="space-y-5 sm:space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#16255c]">Unidades</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie todas as lojas do sistema — {total} {total === 1 ? 'unidade' : 'unidades'}
          </p>
        </div>

        {/* Filtros */}
        <form className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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
              <SelectTrigger className="flex-1 sm:w-48 sm:flex-none h-11! bg-white min-w-0">
                <ArrowUpDown className="h-4 w-4 mr-1.5 shrink-0" />
                <SelectValue placeholder="Ordenar" />
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
            <Button
              type="submit"
              size="lg"
              className="shrink-0 h-11 px-4 sm:px-6 bg-[#16255c] hover:bg-[#16255c] hover:opacity-90 cursor-pointer"
            >
              <Search className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Buscar</span>
            </Button>
          </div>
        </form>

        {/* Cards */}
        {lojasPaginadas.length > 0 ? (
          <>
            <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {lojasPaginadas.map((loja, index) => {
                const saude         = saudeMap[loja.id]
                const conv          = conversaoMap[Number(loja.id)]
                const taxaConversao = conv?.taxa_conversao
                const health        = getHealthStatus(saude?.sla_breach_pct ?? 0, saude?.active_leads ?? 0, taxaConversao, avgConversao)
                const hc            = healthConfig[health]
                const label         = getHealthLabel(saude?.sla_breach_pct ?? 0, taxaConversao, avgConversao)
                const vsMedia       = taxaConversao !== undefined && avgConversao > 0
                  ? Math.round((taxaConversao - avgConversao) * 10) / 10
                  : null
                const rank    = rankMap.get(loja.id) ?? 0
                const isBest  = loja.id === best?.id && lojasPaginadas.length > 1
                const isWorst = loja.id === worst?.id && lojasPaginadas.length > 1 && best?.id !== worst?.id

                return (
                  <div
                    key={loja.id}
                    className="loja-card group relative flex flex-col rounded-2xl border bg-white transition-shadow duration-200 hover:shadow-lg hover:-translate-y-0.5 border-slate-200 shadow-sm"
                    style={{ animationDelay: `${index * 45}ms` }}
                  >

                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 p-4 sm:p-5 pb-3 sm:pb-4">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef0f8] text-[#16255c]">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-bold text-[#16255c] leading-tight truncate">
                            {loja.nome}
                          </h3>
                          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">ID: {loja.id}</p>
                        </div>
                      </div>
                      {/* Health badge */}
                      <span className={cn(
                        'flex items-center gap-1 text-[10px] sm:text-[11px] font-medium px-1.5 sm:px-2 py-0.5 rounded-full border shrink-0',
                        hc.badge,
                      )}>
                        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', hc.dot)} />
                        <span className="truncate max-w-[70px] sm:max-w-none">{label}</span>
                      </span>
                    </div>

                    {/* Localização + email */}
                    <div className="px-4 sm:px-5 pb-3 space-y-1.5">
                      {loja.localizacao && (
                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{loja.localizacao}</span>
                        </p>
                      )}
                      {loja.emails?.[0] ? (
                        <a
                          href={`mailto:${loja.emails[0].email}`}
                          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#16255c] transition-colors"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{loja.emails[0].email}</span>
                        </a>
                      ) : (
                        <p className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          Sem email
                        </p>
                      )}
                    </div>

                    {/* KPI grid — 3 colunas */}
                    <div className="mx-4 sm:mx-5 grid grid-cols-3 divide-x divide-slate-100 rounded-xl border border-slate-100 overflow-hidden mb-3 sm:mb-4">
                      {/* Total */}
                      <div className="bg-slate-50/70 px-2 sm:px-3 py-2.5 sm:py-3">
                        <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-400">Total</p>
                        <p className="text-base sm:text-xl font-extrabold text-[#16255c] tabular-nums leading-tight mt-0.5">
                          {loja.totalLeads.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-[10px] text-slate-400 tabular-nums">
                          {loja.leadsHoje > 0 ? `+${loja.leadsHoje} hoje` : '0 hoje'}
                        </p>
                      </div>

                      {/* Conversão */}
                      <div className="bg-slate-50/70 px-2 sm:px-3 py-2.5 sm:py-3">
                        <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-400">Conv.</p>
                        {taxaConversao !== undefined ? (
                          <>
                            <p className="text-base sm:text-xl font-extrabold text-[#16255c] tabular-nums leading-tight mt-0.5">
                              {taxaConversao}%
                            </p>
                            <p className="text-[10px] text-slate-400 leading-tight tabular-nums">
                              {vsMedia !== null && `${vsMedia >= 0 ? '+' : ''}${vsMedia}%`}
                            </p>
                          </>
                        ) : (
                          <p className="text-base sm:text-xl font-extrabold text-slate-400 mt-0.5">—</p>
                        )}
                      </div>

                      {/* Ativos */}
                      <div className="bg-slate-50/70 px-2 sm:px-3 py-2.5 sm:py-3">
                        <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-400">Ativos</p>
                        <p className="text-base sm:text-xl font-extrabold text-[#16255c] tabular-nums leading-tight mt-0.5">
                          {saude?.active_leads ?? '—'}
                        </p>
                        {saude?.sla_breach_pct !== undefined && saude.sla_breach_pct > 0 && (
                          <p className="text-[10px] text-slate-400 leading-tight">{saude.sla_breach_pct}% SLA</p>
                        )}
                      </div>
                    </div>

                    {/* Barra de conversão */}
                    {taxaConversao !== undefined && (
                      <div className="mx-4 sm:mx-5 mb-3 sm:mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            vs rede
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-slate-400 tabular-nums">
                            {avgConversao.toFixed(1)}% média
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100">
                          <div
                            className="h-1.5 rounded-full bg-emerald-500 transition-all duration-700"
                            style={{ width: `${Math.min(taxaConversao * 3.5, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* CTA */}
                    <Link
                      href={`/admin/lojas/${loja.id}`}
                      className="mt-auto mx-4 sm:mx-5 mb-4 sm:mb-5 block rounded-md bg-[#16255c] px-4 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-[#1e3380] active:scale-[0.98]"
                    >
                      Ver detalhes →
                    </Link>
                  </div>
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
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 sm:py-20 gap-4 px-4">
            <div className="rounded-full bg-slate-100 p-5 sm:p-6">
              <Search className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-[#16255c] text-center">
              Nenhuma loja encontrada
            </h3>
            <p className="text-muted-foreground text-center max-w-sm text-sm">
              {searchQuery
                ? `Não encontramos lojas com "${searchQuery}". Tente outro termo.`
                : 'Não há lojas cadastradas no sistema.'}
            </p>
          </div>
        )}
      </div>
    </>
  )
}
