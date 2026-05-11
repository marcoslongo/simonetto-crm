"use client"

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import type { InvestimentoClassificacaoItem } from "@/lib/leads-service"

interface ChartInvestimentoClassProps {
  data: InvestimentoClassificacaoItem[]
}

const LABEL_MAP: Record<string, string> = {
  "35-50k":      "R$ 35–50k",
  "50-100k":     "R$ 50–100k",
  "100-150k":    "R$ 100–150k",
  "150-200k":    "R$ 150–200k",
  "acima-250k":  "Acima R$ 250k",
  "Não informado": "Não informado",
}

function friendlyLabel(faixa: string) {
  return LABEL_MAP[faixa] ?? faixa
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-[#16255c] mb-1">{friendlyLabel(label)}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-slate-600">
          <span className="font-bold" style={{ color: p.fill }}>{p.value}</span>{" "}
          <span className="capitalize">{p.dataKey}</span>
        </p>
      ))}
    </div>
  )
}

export function ChartInvestimentoClass({ data }: ChartInvestimentoClassProps) {
  const hasData = data.some((d) => d.frio + d.morno + d.quente > 0)

  const chartData = data.map((d) => ({ ...d, faixaLabel: friendlyLabel(d.faixa) }))

  if (!hasData) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[#16255c]">
            Temperatura por Investimento
          </CardTitle>
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
        <CardTitle className="text-2xl font-bold text-[#16255c]">
          Temperatura por Investimento
        </CardTitle>
        <CardDescription className="text-slate-500">
          Distribuição de frio / morno / quente por faixa de investimento
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="bg-white/50 rounded-xl p-4 shadow-inner">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="faixaLabel"
                width={110}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#16255c", fontSize: 12, fontWeight: 600 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="square"
                iconSize={10}
                formatter={(value) => (
                  <span className="capitalize text-xs text-slate-600 font-medium">{value}</span>
                )}
              />
              <Bar dataKey="frio"   stackId="a" fill="#60a5fa" radius={[0, 0, 0, 0]} name="frio" />
              <Bar dataKey="morno"  stackId="a" fill="#fb923c" name="morno" />
              <Bar dataKey="quente" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} name="quente" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
