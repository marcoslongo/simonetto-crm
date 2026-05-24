"use client"

import {
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer, LabelList,
} from "recharts"
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card"
import { TrendingUp, Store } from "lucide-react"
import type { ConversaoPorLojaItem } from "@/lib/api-loja"

interface Props {
  data: ConversaoPorLojaItem[]
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-sm min-w-48">
      <p className="font-semibold text-[#16255c] mb-2">{d.loja_nome}</p>
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
          <span className="text-blue-600">Em negociação</span>
          <span className="font-medium text-blue-600">{d.em_negociacao}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-red-500">Venda não realizada</span>
          <span className="font-medium text-red-500">{d.vendas_nao_realizadas}</span>
        </div>
        <div className="flex justify-between gap-4 border-t pt-1 mt-1">
          <span className="text-slate-700 font-semibold">Taxa de conversão</span>
          <span className="font-bold text-emerald-600">{d.taxa_conversao}%</span>
        </div>
      </div>
    </div>
  )
}

export function ChartConversaoPorLoja({ data }: Props) {
  if (!data.length) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#16255c]">Taxa de Conversão por Loja</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex flex-col items-center justify-center gap-2">
            <Store className="h-8 w-8 text-slate-300" />
            <p className="text-slate-400 text-sm">Nenhum dado disponível</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const sorted = [...data].sort((a, b) => b.taxa_conversao - a.taxa_conversao)
  const avg = data.reduce((s, d) => s + d.taxa_conversao, 0) / data.length

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-[#16255c]">Taxa de Conversão por Loja</CardTitle>
            <CardDescription className="text-slate-500 mt-0.5">
              {data.length} loja{data.length !== 1 ? 's' : ''} · média{" "}
              <span className="font-semibold text-emerald-600">{avg.toFixed(1)}%</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div style={{ height: Math.max(200, sorted.length * 52) }}>
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
                dataKey="loja_nome"
                width={130}
                tick={{ fontSize: 11, fill: "#475569" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="taxa_conversao" radius={[0, 4, 4, 0]} maxBarSize={32}>
                <LabelList
                  dataKey="taxa_conversao"
                  position="right"
                  formatter={(v: number) => `${v}%`}
                  style={{ fontSize: 11, fontWeight: 600, fill: "#059669" }}
                />
                {sorted.map(entry => (
                  <Cell
                    key={entry.loja_id}
                    fill={entry.taxa_conversao >= avg ? "#10b981" : "#94a3b8"}
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
            {sorted.map(row => (
              <div key={row.loja_id} className="grid grid-cols-5 gap-2 text-xs py-1.5 rounded-md px-1 hover:bg-slate-100 transition-colors">
                <span className="col-span-2 text-slate-700 font-medium truncate">{row.loja_nome}</span>
                <span className="text-right text-slate-500 tabular-nums">{row.total_leads}</span>
                <span className="text-right text-emerald-600 font-medium tabular-nums">{row.vendas_realizadas}</span>
                <span
                  className="text-right font-bold tabular-nums"
                  style={{ color: row.taxa_conversao >= avg ? '#059669' : '#94a3b8' }}
                >
                  {row.taxa_conversao}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
