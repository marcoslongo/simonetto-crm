"use client"

import {
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer, LabelList,
} from "recharts"
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card"
import { Clock } from "lucide-react"
import type { TempoPorEtapaItem } from "@/lib/api-loja"

interface Props {
  data: TempoPorEtapaItem[]
}

const STATUS_COLORS: Record<string, string> = {
  nao_atendido:        "#f59e0b",
  em_negociacao:       "#3b82f6",
  venda_realizada:     "#10b981",
  venda_nao_realizada: "#ef4444",
}

function formatHoras(h: number) {
  if (h < 1) return `${Math.round(h * 60)}min`
  if (h < 24) return `${h.toFixed(1)}h`
  const days = Math.floor(h / 24)
  const remH = Math.round(h % 24)
  return remH > 0 ? `${days}d ${remH}h` : `${days}d`
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-[#16255c] mb-1">{d.label}</p>
      <p className="text-[11px] text-slate-400 mb-2">
        {d.tipo === 'ativo' ? 'Tempo médio aguardando na etapa' : 'Ciclo total até fechamento'}
      </p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Tempo médio</span>
          <span className="font-bold" style={{ color: STATUS_COLORS[d.status] }}>
            {formatHoras(d.tempo_medio_horas)}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Leads</span>
          <span className="font-medium">{d.total}</span>
        </div>
      </div>
    </div>
  )
}

export function ChartTempoPorEtapa({ data }: Props) {
  if (!data.length) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#16255c]">Tempo Médio por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex flex-col items-center justify-center gap-2">
            <Clock className="h-8 w-8 text-slate-300" />
            <p className="text-slate-400 text-sm">Nenhum dado disponível</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-[#16255c]">Tempo Médio por Etapa</CardTitle>
            <CardDescription className="text-slate-500 mt-0.5">
              Quanto tempo um lead fica em cada etapa antes de avançar
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 96, left: 8, bottom: 4 }}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => formatHoras(v)}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={148}
                tick={{ fontSize: 11, fill: "#475569" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="tempo_medio_horas" radius={[0, 4, 4, 0]} maxBarSize={36}>
                <LabelList
                  dataKey="tempo_medio_horas"
                  position="right"
                  formatter={(v: number) => formatHoras(v)}
                  style={{ fontSize: 11, fontWeight: 600, fill: "#475569" }}
                />
                {data.map(entry => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status] ?? "#94a3b8"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 border-t pt-4">
          {data.map(item => (
            <div
              key={item.status}
              className="flex items-center gap-3 rounded-xl border bg-white px-3 py-2.5 shadow-sm"
            >
              <div
                className="h-9 w-1.5 rounded-full shrink-0"
                style={{ backgroundColor: STATUS_COLORS[item.status] ?? "#94a3b8" }}
              />
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500 leading-tight truncate">{item.label}</p>
                <p className="text-lg font-bold text-slate-800 tabular-nums leading-tight">
                  {formatHoras(item.tempo_medio_horas)}
                </p>
                <p className="text-[10px] text-slate-400">{item.total} leads</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
