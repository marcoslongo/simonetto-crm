"use client"

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card"
import { Users } from "lucide-react"
import type { FunilPorAtendenteItem } from "@/lib/api-loja"
import { EmptyState } from "@/components/ui/empty-state"

interface Props {
  data: FunilPorAtendenteItem[]
}

function formatHoras(h: number | null) {
  if (h === null || h === undefined) return "—"
  if (h < 1) return `${Math.round(h * 60)}min`
  if (h < 24) return `${h.toFixed(1)}h`
  return `${(h / 24).toFixed(1)}d`
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-sm min-w-48">
      <p className="font-semibold text-[#16255c] mb-2">{d?.atendente_nome}</p>
      <div className="space-y-1 text-xs">
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex justify-between gap-4">
            <span style={{ color: p.fill }}>{p.name}</span>
            <span className="font-medium">{p.value}</span>
          </div>
        ))}
        <div className="flex justify-between gap-4 border-t pt-1 mt-1">
          <span className="text-slate-500">Taxa de conversão</span>
          <span className="font-bold text-emerald-600">{d?.taxa_conversao ?? 0}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Ciclo médio</span>
          <span className="font-medium">{formatHoras(d?.ciclo_medio_horas)}</span>
        </div>
      </div>
    </div>
  )
}

export function ChartFunilPorAtendente({ data }: Props) {
  if (!data.length) {
    return (
      <Card className="border-0 card-surface-elevated">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#16255c]">Funil por Atendente</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Users}
            title="Nenhum atendente com leads"
            description="Atribua responsáveis aos leads no Kanban para ver o desempenho individual."
            size="md"
          />
        </CardContent>
      </Card>
    )
  }

  const sorted = [...data].sort((a, b) => b.vendas_realizadas - a.vendas_realizadas)
  const top = sorted[0]

  return (
    <Card className="border-0 card-surface-elevated">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-[#16255c]">Funil por Atendente</CardTitle>
            <CardDescription className="text-slate-500 mt-0.5">
              {data.length} atendente{data.length !== 1 ? 's' : ''} com leads atribuídos
              {top && (
                <> · destaque{" "}
                  <span className="font-semibold text-blue-600">{top.atendente_nome}</span>
                  {" "}({top.vendas_realizadas} venda{top.vendas_realizadas !== 1 ? 's' : ''})
                </>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div style={{ height: Math.max(280, sorted.length * 44 + 100) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sorted}
              margin={{ top: 8, right: 16, left: 8, bottom: sorted.length > 4 ? 64 : 40 }}
              barCategoryGap="28%"
            >
              <XAxis
                dataKey="atendente_nome"
                tick={{ fontSize: 11, fill: "#475569" }}
                tickLine={false}
                axisLine={false}
                angle={sorted.length > 3 ? -35 : 0}
                textAnchor={sorted.length > 3 ? "end" : "middle"}
                interval={0}
              />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="vendas_realizadas"     name="Venda realizada"      fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={40} stackId="s" />
              <Bar dataKey="em_negociacao"          name="Em negociação"        fill="#3b82f6" radius={[0, 0, 0, 0]} maxBarSize={40} stackId="s" />
              <Bar dataKey="nao_atendido"           name="Não atendido"         fill="#f59e0b" radius={[0, 0, 0, 0]} maxBarSize={40} stackId="s" />
              <Bar dataKey="vendas_nao_realizadas"  name="Venda não realizada"  fill="#ef4444" radius={[0, 0, 3, 3]} maxBarSize={40} stackId="s" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 border-t pt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 uppercase tracking-wider border-b">
                <th className="text-left pb-2 font-semibold w-6">#</th>
                <th className="text-left pb-2 font-semibold px-3">Atendente</th>
                <th className="text-right pb-2 font-semibold">Leads</th>
                <th className="text-right pb-2 font-semibold">Vendas</th>
                <th className="text-right pb-2 font-semibold">Perdidos</th>
                <th className="text-right pb-2 font-semibold">Taxa</th>
                <th className="text-right pb-2 font-semibold">Ciclo médio</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, idx) => {
                const rank = idx + 1
                const rankStyles = [
                  'bg-amber-400 text-white',   // 1º - ouro
                  'bg-slate-400 text-white',   // 2º - prata
                  'bg-orange-400 text-white',  // 3º - bronze
                ]
                const rankClass = rank <= 3 ? rankStyles[rank - 1] : 'bg-slate-100 text-slate-500'
                const avgTaxa = sorted.reduce((s, r) => s + (r.taxa_conversao ?? 0), 0) / sorted.length
                const isAboveAvg = (row.taxa_conversao ?? 0) > avgTaxa

                return (
                  <tr
                    key={row.responsavel_id}
                    className={`border-b border-slate-100 transition-colors ${rank === 1 ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-slate-50'}`}
                  >
                    <td className="py-2">
                      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${rankClass}`}>
                        {rank}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`font-medium ${rank === 1 ? 'text-amber-700' : 'text-slate-700'}`}>
                        {row.atendente_nome}
                      </span>
                    </td>
                    <td className="py-2 text-right tabular-nums text-slate-500">{row.total_leads}</td>
                    <td className="py-2 text-right tabular-nums text-emerald-600 font-semibold">{row.vendas_realizadas}</td>
                    <td className="py-2 text-right tabular-nums text-red-500 font-semibold">{row.vendas_nao_realizadas}</td>
                    <td className="py-2 text-right tabular-nums font-bold">
                      <span className={`inline-flex items-center gap-0.5 ${isAboveAvg ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {row.taxa_conversao ?? 0}%
                        {isAboveAvg && <span className="text-[8px]">▲</span>}
                      </span>
                    </td>
                    <td className="py-2 text-right tabular-nums text-slate-500">{formatHoras(row.ciclo_medio_horas)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {sorted.length > 1 && (
            <p className="mt-2 text-[10px] text-slate-400">
              ▲ acima da média · Média da equipe: {(sorted.reduce((s, r) => s + (r.taxa_conversao ?? 0), 0) / sorted.length).toFixed(1)}%
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
