"use client"

import {
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer, LabelList,
} from "recharts"
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card"
import { Tag } from "lucide-react"
import type { ConversaoPorEtiquetaItem } from "@/lib/api-loja"
import { EmptyState } from "@/components/ui/empty-state"

const COR_HEX: Record<string, string> = {
  purple:  "#a855f7",
  indigo:  "#6366f1",
  teal:    "#14b8a6",
  orange:  "#f97316",
  pink:    "#ec4899",
  gray:    "#6b7280",
  violet:  "#8b5cf6",
  cyan:    "#06b6d4",
  lime:    "#84cc16",
  yellow:  "#eab308",
  red:     "#ef4444",
  emerald: "#10b981",
  blue:    "#3b82f6",
  amber:   "#f59e0b",
}

function getHex(cor: string): string {
  return COR_HEX[cor] ?? "#6b7280"
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as ConversaoPorEtiquetaItem
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-sm min-w-44">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
          style={{ background: getHex(d.etiqueta_cor) }}
        />
        <p className="font-semibold text-[#16255c]">{d.etiqueta_nome}</p>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Total leads</span>
          <span className="font-medium">{d.total_leads}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-emerald-600">Venda realizada</span>
          <span className="font-medium text-emerald-600">{d.vendas_realizadas}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-red-500">Venda não realizada</span>
          <span className="font-medium text-red-500">{d.vendas_nao_realizadas}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-blue-600">Em negociação</span>
          <span className="font-medium text-blue-600">{d.em_negociacao}</span>
        </div>
        <div className="flex justify-between gap-4 border-t pt-1 mt-1">
          <span className="text-slate-700 font-semibold">Taxa de conversão</span>
          <span className="font-bold" style={{ color: getHex(d.etiqueta_cor) }}>
            {d.taxa_conversao}%
          </span>
        </div>
      </div>
    </div>
  )
}

export function ChartConversaoPorEtiqueta({ data }: { data: ConversaoPorEtiquetaItem[] }) {
  if (!data.length) {
    return (
      <Card className="border-0 card-surface-elevated">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#16255c]">Conversão por Etiqueta</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Tag}
            title="Nenhuma etiqueta com dados"
            description="Atribua etiquetas aos leads para visualizar a taxa de conversão por categoria."
            size="md"
          />
        </CardContent>
      </Card>
    )
  }

  const sorted = [...data].sort((a, b) => b.taxa_conversao - a.taxa_conversao)
  const avg = sorted.reduce((s, d) => s + d.taxa_conversao, 0) / sorted.length

  return (
    <Card className="border-0 card-surface-elevated">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
            <Tag className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-[#16255c]">Conversão por Etiqueta</CardTitle>
            <CardDescription className="text-slate-500 mt-0.5">
              {sorted.length} etiqueta{sorted.length !== 1 ? 's' : ''} · média{" "}
              <span className="font-semibold text-violet-600">{avg.toFixed(1)}%</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div style={{ height: sorted.length * 52 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sorted}
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
                dataKey="etiqueta_nome"
                width={120}
                tick={{ fontSize: 11, fill: "#475569" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="taxa_conversao" radius={[0, 4, 4, 0]} maxBarSize={32}>
                <LabelList
                  dataKey="taxa_conversao"
                  position="right"
                  formatter={(v: number) => `${v ?? 0}%`}
                  style={{ fontSize: 11, fontWeight: 600, fill: "#6b7280" }}
                />
                {sorted.map(entry => (
                  <Cell
                    key={entry.etiqueta_id}
                    fill={getHex(entry.etiqueta_cor)}
                    fillOpacity={entry.taxa_conversao >= avg ? 1 : 0.45}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 border-t pt-4 space-y-0.5">
          {sorted.map((row, i) => (
            <div key={row.etiqueta_id} className="grid grid-cols-5 gap-2 text-xs py-1.5 rounded-md px-1 hover:bg-slate-50 transition-colors">
              <span className="col-span-2 flex items-center gap-1.5 text-slate-700 font-medium truncate">
                <span className="text-slate-400 shrink-0">{i + 1}.</span>
                <span
                  className="inline-block h-2 w-2 rounded-full shrink-0"
                  style={{ background: getHex(row.etiqueta_cor) }}
                />
                {row.etiqueta_nome}
              </span>
              <span className="text-right text-slate-500 tabular-nums">{row.total_leads}</span>
              <span className="text-right text-emerald-600 font-medium tabular-nums">{row.vendas_realizadas}</span>
              <span
                className="text-right font-bold tabular-nums"
                style={{ color: row.taxa_conversao >= avg ? getHex(row.etiqueta_cor) : '#94a3b8' }}
              >
                {row.taxa_conversao}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
