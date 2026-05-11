"use client"

import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from "recharts"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Tag } from "lucide-react"
import type { CampanhaUTMItem } from "@/lib/leads-service"

interface ChartCampanhasUTMProps {
  data: CampanhaUTMItem[]
}

const PALETTE = [
  "#16255c", "#1e3a5f", "#2e4f7f", "#3d659f",
  "#4d7abf", "#1d4ed8", "#2563eb", "#3b82f6",
  "#60a5fa", "#93c5fd",
]

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { utm_campaign, total, pct } = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-2 text-sm max-w-xs">
      <p className="font-semibold text-[#16255c] truncate">{utm_campaign}</p>
      <p className="text-slate-600">
        <span className="font-bold text-[#16255c]">{total}</span> leads ({pct}%)
      </p>
    </div>
  )
}

export function ChartCampanhasUTM({ data }: ChartCampanhasUTMProps) {
  const hasData = data.some((d) => d.total > 0)

  if (!hasData) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[#16255c]">Top Campanhas UTM</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-slate-400 text-sm">Sem dados de campanha disponíveis</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Trunca labels longos para o eixo Y
  const chartData = data.map((d) => ({
    ...d,
    label: d.utm_campaign.length > 22 ? d.utm_campaign.slice(0, 20) + "…" : d.utm_campaign,
  }))

  const topCampanha = data[0]

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-[#16255c]">Top Campanhas UTM</CardTitle>
            <CardDescription className="flex items-center gap-2 text-slate-500 mt-1">
              <Tag className="h-4 w-4" />
              Volume de leads por campanha de marketing
            </CardDescription>
          </div>
          {topCampanha && (
            <div className="text-right bg-white/70 backdrop-blur-sm px-3 py-2 rounded-xl shadow-sm border border-slate-200 max-w-[140px]">
              <p className="text-xs text-[#16255c] font-semibold">Melhor campanha</p>
              <p className="text-sm font-bold text-[#16255c] truncate">{topCampanha.utm_campaign}</p>
              <p className="text-xs text-slate-500">{topCampanha.pct}% dos leads</p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="bg-white/50 rounded-xl p-4 shadow-inner">
          <ResponsiveContainer width="100%" height={Math.max(200, data.length * 38)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 4, right: 40, top: 4, bottom: 4 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="label"
                width={130}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#16255c", fontSize: 12, fontWeight: 600 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" radius={[0, 6, 6, 0]} label={{ position: "right", fontSize: 11, fill: "#16255c", fontWeight: 700 }}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
