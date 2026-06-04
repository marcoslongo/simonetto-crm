import { requireGerente } from '@/lib/auth'
import { getLojas } from '@/lib/api'
import { getLojaStats, getLojaStatusFunil } from '@/lib/api-loja'
import {
  Building2, MapPin, TrendingUp, TrendingDown, Trophy, AlertTriangle, Minus,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'Unidades | Noxus - Lead Ops',
  description: 'Comparativo de desempenho por unidade',
}

export default async function CrmUnidadesPage() {
  const user = await requireGerente()

  if (user.loja_ids.length <= 1) redirect('/crm')

  const lojasData = await getLojas().catch(() => ({ success: false, lojas: [] }))
  const lojasVinculadas = lojasData.lojas.filter(l => user.loja_ids.includes(Number(l.id)))

  const lojasComStats = await Promise.all(
    lojasVinculadas.map(async loja => {
      const [stats, funil] = await Promise.all([
        getLojaStats(loja.id).catch(() => ({ total: 0, hoje: 0, semana: 0, mes: 0, mes_anterior: undefined as number | undefined })),
        getLojaStatusFunil(loja.id).catch(() => ({} as Record<string, number>)),
      ])
      const vendas    = (funil['venda_realizada'] as number) ?? 0
      const total     = Object.values(funil).reduce((s: number, v) => s + (v as number), 0)
      const conversao = total > 0 ? Math.round(vendas / total * 1000) / 10 : 0
      const crescimento = stats.mes_anterior !== undefined && stats.mes_anterior > 0
        ? Math.round((stats.mes - stats.mes_anterior) / stats.mes_anterior * 100)
        : null
      return { ...loja, stats, conversao, crescimento, vendas, totalFunil: total }
    })
  )

  const sorted  = [...lojasComStats].sort((a, b) => b.conversao - a.conversao)
  const rankMap = new Map(sorted.map((l, i) => [l.id, i + 1]))
  const best    = sorted[0]
  const worst   = sorted[sorted.length - 1]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Unidades</h2>
        <p className="text-muted-foreground mt-1">
          Comparativo de desempenho — {lojasComStats.length} unidades vinculadas
        </p>
      </div>

      {/* Destaques rápidos */}
      {lojasComStats.length >= 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <Trophy className="h-5 w-5 shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Melhor conversão</p>
              <p className="font-bold text-emerald-800 truncate">{best.nome}</p>
              <p className="text-xs text-emerald-600 tabular-nums">{best.conversao}% de conversão</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Precisa de atenção</p>
              <p className="font-bold text-amber-800 truncate">{worst.nome}</p>
              <p className="text-xs text-amber-600 tabular-nums">{worst.conversao}% de conversão</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {lojasComStats.map(loja => {
          const rank    = rankMap.get(loja.id) ?? 0
          const isBest  = rank === 1 && lojasComStats.length > 1
          const isWorst = rank === sorted.length && lojasComStats.length > 1

          return (
            <div
              key={loja.id}
              className={cn(
                'group relative flex flex-col rounded-2xl border bg-white transition-all duration-200',
                'hover:shadow-lg hover:-translate-y-0.5',
                isBest  ? 'border-emerald-200 shadow-md shadow-emerald-100/60' :
                isWorst ? 'border-amber-200 shadow-sm' :
                'border-slate-200 shadow-sm',
              )}
            >
              {/* Rank badge */}
              <div className={cn(
                'absolute -top-2.5 right-4 flex h-6 items-center rounded-full px-2.5 text-[11px] font-bold shadow-sm',
                rank === 1 ? 'bg-amber-400 text-white' :
                rank === 2 ? 'bg-slate-400 text-white' :
                rank === 3 ? 'bg-orange-400 text-white' :
                'bg-slate-100 text-slate-500',
              )}>
                #{rank}
              </div>

              {/* Header */}
              <div className="flex items-start gap-3 p-5 pb-4">
                <div className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                  isBest  ? 'bg-emerald-100 text-emerald-700' :
                  isWorst ? 'bg-amber-50 text-amber-600' :
                  'bg-[#eef0f8] text-[#16255c]',
                )}>
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-[#16255c] leading-tight truncate">{loja.nome}</h3>
                  {loja.localizacao && (
                    <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{loja.localizacao}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* KPI grid — 3 colunas separadas por borda */}
              <div className="mx-5 grid grid-cols-3 divide-x divide-slate-100 rounded-xl border border-slate-100 overflow-hidden mb-4">
                {/* Volume */}
                <div className="bg-slate-50/70 px-3 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total</p>
                  <p className="text-xl font-extrabold text-[#16255c] tabular-nums leading-tight mt-0.5">
                    {loja.stats.total.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-[10px] text-slate-500 tabular-nums">+{loja.stats.hoje} hoje</p>
                </div>

                {/* Conversão */}
                <div className={cn(
                  'px-3 py-3',
                  loja.conversao >= 20 ? 'bg-emerald-50' :
                  loja.conversao >= 10 ? 'bg-amber-50' : 'bg-red-50/70',
                )}>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Conversão</p>
                  <p className={cn(
                    'text-xl font-extrabold tabular-nums leading-tight mt-0.5',
                    loja.conversao >= 20 ? 'text-emerald-700' :
                    loja.conversao >= 10 ? 'text-amber-700' : 'text-red-600',
                  )}>
                    {loja.conversao}%
                  </p>
                  <p className="text-[10px] text-slate-500 tabular-nums">{loja.vendas} vendas</p>
                </div>

                {/* Crescimento */}
                <div className="bg-slate-50/70 px-3 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">vs mês ant.</p>
                  {loja.crescimento !== null ? (
                    <>
                      <p className={cn(
                        'text-xl font-extrabold tabular-nums leading-tight mt-0.5',
                        loja.crescimento > 0 ? 'text-emerald-600' :
                        loja.crescimento < 0 ? 'text-red-500' : 'text-slate-400',
                      )}>
                        {loja.crescimento > 0 ? '+' : ''}{loja.crescimento}%
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {loja.crescimento > 0
                          ? <span className="flex items-center gap-0.5 text-emerald-600"><TrendingUp className="h-3 w-3" />alta</span>
                          : loja.crescimento < 0
                          ? <span className="flex items-center gap-0.5 text-red-500"><TrendingDown className="h-3 w-3" />queda</span>
                          : <span className="flex items-center gap-0.5 text-slate-400"><Minus className="h-3 w-3" />estável</span>}
                      </p>
                    </>
                  ) : (
                    <p className="text-base font-semibold text-slate-400 mt-0.5">—</p>
                  )}
                </div>
              </div>

              {/* Barra de conversão */}
              <div className="mx-5 mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Funil de conversão
                  </span>
                  <span className="text-[10px] text-slate-400 tabular-nums">{loja.totalFunil} leads</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100">
                  <div
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-700',
                      loja.conversao >= 20 ? 'bg-emerald-500' :
                      loja.conversao >= 10 ? 'bg-amber-400' : 'bg-red-400',
                    )}
                    style={{ width: `${Math.min(loja.conversao * 3.5, 100)}%` }}
                  />
                </div>
              </div>

              {/* CTA */}
              <Link
                href={`/crm/unidades/${loja.id}`}
                className="mt-auto mx-5 mb-5 block rounded-xl bg-[#16255c] px-4 py-2.5 text-center text-sm font-semibold text-white transition-all hover:bg-[#1e3380]"
              >
                Ver detalhes →
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
