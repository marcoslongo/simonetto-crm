"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine, ResponsiveContainer } from "recharts"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Clock } from "lucide-react"
import type { HorarioItem } from "@/lib/leads-service"

interface ChartHorarioLeadsProps {
  data: HorarioItem[]
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { hora, total } = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-2 text-sm">
      <p className="font-semibold text-[#16255c]">{hora}</p>
      <p className="text-slate-600">
        <span className="font-bold text-[#16255c]">{total}</span> leads
      </p>
    </div>
  )
}

function getBarColor(hora_int: number, maxHora: number, item: HorarioItem): string {
  if (item.hora_int === maxHora) return "#ef4444"
  if (hora_int >= 8 && hora_int <= 18) return "#2563eb"
  return "#93c5fd"
}

export function ChartHorarioLeads({ data }: ChartHorarioLeadsProps) {
  const total = data.reduce((s, d) => s + d.total, 0)
  const hasData = total > 0

  const maxItem = hasData
    ? data.reduce((p, c) => (c.total > p.total ? c : p))
    : null

  const periodos = [
    { label: "Manhã", range: "06h–11h", total: data.filter(d => d.hora_int >= 6  && d.hora_int <= 11).reduce((s, d) => s + d.total, 0) },
    { label: "Tarde", range: "12h–17h", total: data.filter(d => d.hora_int >= 12 && d.hora_int <= 17).reduce((s, d) => s + d.total, 0) },
    { label: "Noite", range: "18h–23h", total: data.filter(d => d.hora_int >= 18 && d.hora_int <= 23).reduce((s, d) => s + d.total, 0) },
    { label: "Madrugada", range: "00h–05h", total: data.filter(d => d.hora_int >= 0  && d.hora_int <= 5).reduce((s, d) => s + d.total, 0) },
  ]

  if (!hasData) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[#16255c]">Leads por Hora</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-slate-400 text-sm">Sem dados de horário disponíveis</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-[#16255c]">Leads por Hora</CardTitle>
            <CardDescription className="flex items-center gap-2 text-slate-500 mt-1">
              <Clock className="h-4 w-4" />
              Volume de leads por hora do dia
            </CardDescription>
          </div>
          {maxItem && (
            <div className="text-right bg-white/70 px-3 py-2 rounded-xl shadow-sm border border-slate-200">
              <p className="text-xs text-[#16255c] font-semibold">Pico</p>
              <p className="text-xl font-bold text-red-500">{maxItem.hora}</p>
              <p className="text-xs text-slate-500">{maxItem.total} leads</p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="bg-white/50 rounded-xl p-4 shadow-inner">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
              <XAxis
                dataKey="hora"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#16255c", fontSize: 9, fontWeight: 600 }}
                interval={1}
              />
              <YAxis hide />
              {/* Início do horário comercial */}
              <ReferenceLine x="08h" stroke="#94a3b8" strokeDasharray="3 3" strokeWidth={1} />
              <ReferenceLine x="18h" stroke="#94a3b8" strokeDasharray="3 3" strokeWidth={1} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" radius={[3, 3, 0, 0]}>
                {data.map((entry) => (
                  <Cell
                    key={entry.hora}
                    fill={getBarColor(entry.hora_int, maxItem?.hora_int ?? -1, entry)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {periodos.map((p) => (
            <div key={p.label} className="bg-white/70 rounded-lg p-2 text-center border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">{p.label}</p>
              <p className="text-lg font-bold text-[#16255c]">{p.total}</p>
              <p className="text-xs text-slate-400">{p.range}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-[#2563eb]" /> Horário comercial
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-[#93c5fd]" /> Fora do horário
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-red-500" /> Hora pico
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
