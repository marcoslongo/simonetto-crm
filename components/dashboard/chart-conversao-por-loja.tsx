"use client"

import { useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer, LabelList,
} from "recharts"
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card"
import { TrendingUp, Store, ChevronLeft, ChevronRight, Trophy, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ConversaoPorLojaItem } from "@/lib/api-loja"
import { EmptyState } from "@/components/ui/empty-state"

const PAGE_SIZE = 10
const RANKING_SIZE = 10

type OrigemView = 'geral' | 'industria' | 'proprio'
type RankingView = 'top' | 'bottom' | 'all'

const ORIGEM_LABELS: Record<OrigemView, string> = {
  geral:     'Geral',
  industria: 'Indústria',
  proprio:   'Próprio',
}

function getTaxa(row: ConversaoPorLojaItem, origem: OrigemView): number {
  if (origem === 'industria') return row.taxa_conversao_industria
  if (origem === 'proprio')   return row.taxa_conversao_proprio
  return row.taxa_conversao
}

function getTotal(row: ConversaoPorLojaItem, origem: OrigemView): number {
  if (origem === 'industria') return row.total_industria
  if (origem === 'proprio')   return row.total_proprio
  return row.total_leads
}

function CustomTooltip({ active, payload, origem }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as ConversaoPorLojaItem
  const taxa = getTaxa(d, origem)
  const total = getTotal(d, origem)
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-sm min-w-48">
      <p className="font-semibold text-[#16255c] mb-1">{d.loja_nome}</p>
      <p className="text-xs text-slate-400 mb-2">{ORIGEM_LABELS[origem as OrigemView]}</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Total leads</span>
          <span className="font-medium">{total}</span>
        </div>
        {origem === 'geral' && (<>
          <div className="flex justify-between gap-4">
            <span className="text-emerald-600">Venda realizada</span>
            <span className="font-medium text-emerald-600">{d.vendas_realizadas}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-blue-600">Em negociação</span>
            <span className="font-medium text-blue-600">{d.em_negociacao}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-red-500">Venda não realizada</span>
            <span className="font-medium text-red-500">{d.vendas_nao_realizadas}</span>
          </div>
        </>)}
        <div className="flex justify-between gap-4 border-t pt-1 mt-1">
          <span className="text-slate-700 font-semibold">Taxa de conversão</span>
          <span className="font-bold text-emerald-600">{taxa}%</span>
        </div>
      </div>
    </div>
  )
}

function RankingTable({ items, avg, offset = 0, type, origem }: {
  items: ConversaoPorLojaItem[]
  avg: number
  offset?: number
  type: 'top' | 'bottom'
  origem: OrigemView
}) {
  return (
    <div className="space-y-1">
      {items.map((row, i) => {
        const taxa = getTaxa(row, origem)
        const isAbove = taxa >= avg
        return (
          <div key={row.loja_id} className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
            type === 'top' ? 'hover:bg-emerald-50' : 'hover:bg-red-50'
          }`}>
            <span className={`text-xs font-bold w-6 text-center shrink-0 ${
              type === 'top' ? 'text-emerald-600' : 'text-red-500'
            }`}>
              {offset + i + 1}º
            </span>
            <span className="flex-1 text-sm text-slate-700 truncate">{row.loja_nome}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-400 tabular-nums">{getTotal(row, origem)}</span>
              <span className={`text-sm font-bold tabular-nums w-14 text-right ${
                isAbove ? 'text-emerald-600' : 'text-slate-400'
              }`}>
                {taxa}%
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ChartConversaoPorLoja({ data }: { data: ConversaoPorLojaItem[] }) {
  const [page, setPage] = useState(0)
  const [rankingView, setRankingView] = useState<RankingView>('all')
  const [origem, setOrigem] = useState<OrigemView>('geral')

  if (!data.length) {
    return (
      <Card className="border-0 card-surface-elevated">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#16255c]">Taxa de Conversão por Loja</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Store}
            title="Nenhum dado de conversão"
            description="Os dados de conversão por unidade aparecerão aqui após o primeiro fechamento."
            size="md"
          />
        </CardContent>
      </Card>
    )
  }

  const hasProprio = data.some(d => d.total_proprio > 0)

  const sorted = [...data].sort((a, b) => getTaxa(b, origem) - getTaxa(a, origem))
  const avg = sorted.reduce((s, d) => s + getTaxa(d, origem), 0) / sorted.length
  const top10 = sorted.slice(0, RANKING_SIZE)
  const bottom10 = [...sorted].slice(-RANKING_SIZE).reverse()
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleOrigemChange = (v: OrigemView) => {
    setOrigem(v)
    setPage(0)
  }

  return (
    <Card className="border-0 card-surface-elevated">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-[#16255c]">Taxa de Conversão por Loja</CardTitle>
              <CardDescription className="text-slate-500 mt-0.5">
                {data.length} loja{data.length !== 1 ? 's' : ''} · média{" "}
                <span className="font-semibold text-emerald-600">{avg.toFixed(1)}%</span>
                {" · "}<span className="text-slate-400">{ORIGEM_LABELS[origem]}</span>
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-col gap-2 items-end">
            {/* Filtro de origem */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
              {(['geral', 'industria', ...(hasProprio ? ['proprio'] : [])] as OrigemView[]).map(v => (
                <button
                  key={v}
                  onClick={() => handleOrigemChange(v)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    origem === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {ORIGEM_LABELS[v]}
                </button>
              ))}
            </div>

            {/* Filtro de ranking */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
              {([['all', 'Ranking'], ['top', 'Top 10'], ['bottom', 'Bottom 10']] as [RankingView, string][]).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setRankingView(v)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    rankingView === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {rankingView === 'top' && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-700">Melhores conversores da rede</p>
            </div>
            <RankingTable items={top10} avg={avg} offset={0} type="top" origem={origem} />
          </div>
        )}
        {rankingView === 'bottom' && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-sm font-semibold text-red-600">Precisam de atenção</p>
            </div>
            <RankingTable items={bottom10} avg={avg} offset={sorted.length - RANKING_SIZE} type="bottom" origem={origem} />
          </div>
        )}
        {rankingView === 'all' && (<>
        <div style={{ height: pageData.length * 52 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={pageData}
              layout="vertical"
              margin={{ top: 4, right: 80, left: 8, bottom: 4 }}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="loja_nome"
                width={130}
                tick={{ fontSize: 11, fill: "#475569" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip origem={origem} />} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey={origem === 'geral' ? 'taxa_conversao' : origem === 'industria' ? 'taxa_conversao_industria' : 'taxa_conversao_proprio'} radius={[0, 4, 4, 0]} maxBarSize={32}>
                <LabelList
                  dataKey={origem === 'geral' ? 'taxa_conversao' : origem === 'industria' ? 'taxa_conversao_industria' : 'taxa_conversao_proprio'}
                  position="right"
                  formatter={(v: number) => `${v ?? 0}%`}
                  style={{ fontSize: 11, fontWeight: 600, fill: "#059669" }}
                />
                {pageData.map(entry => (
                  <Cell
                    key={entry.loja_id}
                    fill={getTaxa(entry, origem) >= avg ? "#10b981" : "#94a3b8"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 border-t pt-4">
          <div className="grid grid-cols-5 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 border-b">
            <span className="col-span-2">Loja</span>
            <span className="text-right">Leads</span>
            <span className="text-right">Vendas</span>
            <span className="text-right">Taxa</span>
          </div>
          <div className="space-y-0.5 mt-2">
            {pageData.map((row, i) => {
              const taxa = getTaxa(row, origem)
              return (
                <div key={row.loja_id} className="grid grid-cols-5 gap-2 text-xs py-1.5 rounded-md px-1 hover:bg-slate-100 transition-colors">
                  <span className="col-span-2 text-slate-700 font-medium truncate">
                    <span className="text-slate-400 mr-1">{page * PAGE_SIZE + i + 1}.</span>
                    {row.loja_nome}
                  </span>
                  <span className="text-right text-slate-500 tabular-nums">{getTotal(row, origem)}</span>
                  <span className="text-right text-emerald-600 font-medium tabular-nums">
                    {origem === 'geral' ? row.vendas_realizadas : '—'}
                  </span>
                  <span
                    className="text-right font-bold tabular-nums"
                    style={{ color: taxa >= avg ? '#059669' : '#94a3b8' }}
                  >
                    {taxa}%
                  </span>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <span className="text-xs text-slate-400">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} de {sorted.length} lojas
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="h-3 w-3 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page === totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                >
                  Próxima
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
        </>)}
      </CardContent>
    </Card>
  )
}
