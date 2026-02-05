"use client"

import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { DollarSign, TrendingUp, Award } from "lucide-react"

interface ChartBarInvestProps {
  data: {
    faixa: string
    total: number
  }[]
}

const chartConfig = {
  total: {
    label: "Leads",
  },
} satisfies ChartConfig

// Gradiente de cores do azul marinho para tons mais claros
const barColors = [
  "#0e1627", // azul marinho escuro
  "#1e3a5f", // azul marinho médio
  "#2e4f7f", // azul médio
  "#3d659f", // azul
  "#4d7abf", // azul claro
]

export function ChartBarInvest({ data }: ChartBarInvestProps) {
  // Calcula estatísticas
  const totalLeads = data.reduce((sum, item) => sum + item.total, 0)
  const faixaMaisLeads = data.reduce((prev, current) => 
    (prev.total > current.total) ? prev : current
  )
  const mediaLeads = Math.round(totalLeads / data.length)

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-[#0e1627]">
              Leads por Investimento
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-slate-600">
              <DollarSign className="h-4 w-4" />
              Distribuição por faixa de investimento
            </CardDescription>
          </div>

          <div className="text-right bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs text-[#0e1627] font-semibold">Faixa líder</p>
            <p className="text-lg font-bold text-[#0e1627]">{faixaMaisLeads.faixa}</p>
            <p className="text-xs text-slate-500 font-medium">{faixaMaisLeads.total} leads</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 shadow-inner">
          <ChartContainer config={chartConfig} className="h-[300px]">
            <BarChart
              accessibilityLayer
              data={data}
              layout="vertical"
              margin={{
                left: 20,
                right: 20,
                top: 10,
                bottom: 10,
              }}
            >
              <YAxis
                dataKey="faixa"
                type="category"
                axisLine={false}
                tickLine={false}
                tickMargin={12}
                width={180}
                tick={{ fill: '#0e1627', fontSize: 13, fontWeight: 600 }}
              />

              <XAxis 
                dataKey="total" 
                type="number" 
                hide 
              />

              <ChartTooltip
                cursor={{ fill: 'rgba(14, 22, 39, 0.1)' }}
                content={
                  <ChartTooltipContent 
                    hideLabel 
                    className="bg-white/95 backdrop-blur-sm border-slate-200 shadow-xl"
                  />
                }
              />

              <Bar
                dataKey="total"
                layout="vertical"
                radius={8}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={barColors[index % barColors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0e1627]/5 p-3 rounded-lg border border-[#0e1627]/10">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-[#0e1627]" />
              <p className="text-xs text-[#0e1627] font-semibold">Média por Faixa</p>
            </div>
            <p className="text-2xl font-bold text-[#0e1627]">{mediaLeads}</p>
            <p className="text-xs text-slate-500 font-medium">leads em média</p>
          </div>

          <div className="bg-[#0e1627]/5 p-3 rounded-lg border border-[#0e1627]/10">
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-4 w-4 text-[#0e1627]" />
              <p className="text-xs text-[#0e1627] font-semibold">Total Geral</p>
            </div>
            <p className="text-2xl font-bold text-[#0e1627]">{totalLeads}</p>
            <p className="text-xs text-slate-500 font-medium">leads no total</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}