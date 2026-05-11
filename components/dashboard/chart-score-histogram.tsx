"use client"

import {
  BarChart, Bar, XAxis, YAxis, Cell, ReferenceLine, Tooltip, ResponsiveContainer,
} from "recharts"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import type { ScoreDistribuicaoItem } from "@/lib/leads-service"

interface ChartScoreHistogramProps {
  data: ScoreDistribuicaoItem[]
}

const COLOR_MAP: Record<string, string> = {
  frio:   "#60a5fa",
  morno:  "#fb923c",
  quente: "#ef4444",
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { faixa, total, classificacao } = payload[0].payload
  const label = classificacao === "frio" ? "Frio" : classificacao === "morno" ? "Morno" : "Quente"
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-2 text-sm">
      <p className="font-semibold text-[#16255c]">Score {faixa}</p>
      <p className="text-slate-600">
        <span className="font-bold text-[#16255c]">{total}</span> leads — {label}
      </p>
    </div>
  )
}

export function ChartScoreHistogram({ data }: ChartScoreHistogramProps) {
  const total = data.reduce((s, i) => s + i.total, 0)
  const maxScore = data.reduce((p, c) => (c.total > p.total ? c : p), data[0] ?? { faixa: "—", total: 0 })

  if (!data.length || total === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[#16255c]">Distribuição de Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-slate-400 text-sm">Sem dados disponíveis</p>
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
            <CardTitle className="text-2xl font-bold text-[#16255c]">Distribuição de Score</CardTitle>
            <CardDescription className="text-slate-500 mt-1">
              Histograma de pontuação dos leads (0–100)
            </CardDescription>
          </div>
          <div className="text-right bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs text-[#16255c] font-semibold">Faixa pico</p>
            <p className="text-lg font-bold text-[#16255c]">{maxScore.faixa}</p>
            <p className="text-xs text-slate-500">{maxScore.total} leads</p>
          </div>
        </div>

        <div className="flex gap-4 text-xs">
          {(["frio", "morno", "quente"] as const).map((c) => (
            <div key={c} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLOR_MAP[c] }} />
              <span className="capitalize text-slate-600 font-medium">{c}</span>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="bg-white/50 rounded-xl p-4 shadow-inner">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <XAxis
                dataKey="faixa"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#16255c", fontSize: 11, fontWeight: 600 }}
              />
              <YAxis hide />
              {/* linha de fronteira frio → morno (score 20 = bucket index 2) */}
              <ReferenceLine x="20-29" stroke="#94a3b8" strokeDasharray="4 3" strokeWidth={1.5} />
              {/* linha de fronteira morno → quente (score 55 ≈ bucket 50-59 / 60-69) */}
              <ReferenceLine x="60-69" stroke="#94a3b8" strokeDasharray="4 3" strokeWidth={1.5} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.faixa} fill={COLOR_MAP[entry.classificacao]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {(["frio", "morno", "quente"] as const).map((c) => {
            const subtotal = data.filter((d) => d.classificacao === c).reduce((s, d) => s + d.total, 0)
            const pct = total > 0 ? ((subtotal / total) * 100).toFixed(1) : "0.0"
            return (
              <div key={c} className="bg-white/70 rounded-lg py-2 px-1 border border-slate-100">
                <p className="text-xs text-slate-500 capitalize font-medium">{c}</p>
                <p className="text-xl font-bold" style={{ color: COLOR_MAP[c] }}>{subtotal}</p>
                <p className="text-xs text-slate-400">{pct}%</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
