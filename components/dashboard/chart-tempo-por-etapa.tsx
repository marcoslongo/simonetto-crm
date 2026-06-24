"use client"

import {
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer, LabelList,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Clock } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import type { TempoPorEtapaItem } from "@/lib/api-loja"

interface Props {
  data: TempoPorEtapaItem[]
}

const PALETTE = [
  "#3b82f6", "#f59e0b", "#8b5cf6", "#10b981",
  "#ef4444", "#06b6d4", "#f97316", "#ec4899",
  "#84cc16", "#6366f1",
]

function statusColor(status: string, index: number): string {
  // Deterministic: hash do slug para índice fixo na paleta
  let h = 0
  for (let i = 0; i < status.length; i++) h = (h * 31 + status.charCodeAt(i)) >>> 0
  return PALETTE[(h + index) % PALETTE.length]
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
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-[#16255c] mb-1">{d.label}</p>
      <p className="text-[11px] text-slate-400 mb-2">
        {d.tipo === 'ativo' ? 'Tempo médio aguardando na etapa' : 'Ciclo total até fechamento'}
      </p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Tempo médio</span>
          <span className="font-bold tabular-nums" style={{ color: d._color ?? '#64748b' }}>
            {formatHoras(d.tempo_medio_horas)}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Leads</span>
          <span className="font-semibold tabular-nums">{d.total}</span>
        </div>
      </div>
    </div>
  )
}

export function ChartTempoPorEtapa({ data: rawData }: Props) {
  const data = rawData
    .filter(d => d.status !== 'venda_nao_realizada' && d.status !== 'venda_realizada')
    .map((d, i) => ({ ...d, _color: statusColor(d.status, i) }))

  if (!data.length) {
    return (
      <Card className="border-0 card-surface-elevated">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <CardTitle className="text-xl font-bold text-[#16255c]">Tempo Médio por Etapa</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Clock}
            title="Sem dados de tempo"
            description="O tempo médio por etapa será calculado conforme os leads avançarem no funil."
            size="md"
          />
        </CardContent>
      </Card>
    )
  }

  // Dynamic height: 48px per row, minimum 220px
  const chartHeight = Math.max(220, data.length * 48)

  return (
    <Card className="border-0 card-surface-elevated">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
            <Clock className="h-4 w-4 text-amber-500" />
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
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 96, left: 8, bottom: 4 }}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => formatHoras(v)}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={152}
                tick={{ fontSize: 11, fill: "#475569", fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="tempo_medio_horas" radius={[0, 6, 6, 0]} maxBarSize={32}>
                <LabelList
                  dataKey="tempo_medio_horas"
                  position="right"
                  formatter={(v: number) => formatHoras(v)}
                  style={{ fontSize: 11, fontWeight: 700, fill: "#475569" }}
                />
                {data.map(entry => (
                  <Cell key={entry.status} fill={entry._color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary cards — dynamic columns */}
        <div className={`mt-4 border-t pt-4 grid gap-2 ${
          data.length <= 4 ? 'grid-cols-2' :
          data.length <= 6 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'
        }`}>
          {data.map(item => (
            <div
              key={item.status}
              className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"
            >
              <div
                className="h-8 w-1 rounded-full shrink-0"
                style={{ backgroundColor: item._color }}
              />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide leading-tight truncate">
                  {item.label}
                </p>
                <p className="text-base font-extrabold text-slate-800 tabular-nums leading-tight">
                  {formatHoras(item.tempo_medio_horas)}
                </p>
                <p className="text-[10px] text-slate-400 tabular-nums">{item.total} leads</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
