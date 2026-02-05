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

// Gradiente de cores para as barras (do roxo ao rosa)
const barColors = [
  "#8b5cf6", // violet-500
  "#a78bfa", // violet-400
  "#c4b5fd", // violet-300
  "#ddd6fe", // violet-200
  "#ede9fe", // violet-100
]

export function ChartBarInvest({ data }: ChartBarInvestProps) {
  // Calcula estatísticas
  const totalLeads = data.reduce((sum, item) => sum + item.total, 0)
  const faixaMaisLeads = data.reduce((prev, current) => 
    (prev.total > current.total) ? prev : current
  )
  const mediaLeads = Math.round(totalLeads / data.length)

  return (
    <Card className="border-0 shadow-lg bg-linear-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold bg-linear-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              Leads por Investimento
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-purple-700">
              <DollarSign className="h-4 w-4" />
              Distribuição por faixa de investimento
            </CardDescription>
          </div>

          <div className="text-right bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-violet-100">
            <p className="text-xs text-violet-600 font-semibold">Faixa líder</p>
            <p className="text-lg font-bold text-violet-700">{faixaMaisLeads.faixa}</p>
            <p className="text-xs text-violet-500 font-medium">{faixaMaisLeads.total} leads</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 shadow-inner">
          <ChartContainer config={chartConfig} className="h-75">
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
                tick={{ fill: '#6b21a8', fontSize: 13, fontWeight: 600 }}
              />

              <XAxis 
                dataKey="total" 
                type="number" 
                hide 
              />

              <ChartTooltip
                cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                content={
                  <ChartTooltipContent 
                    hideLabel 
                    className="bg-white/95 backdrop-blur-sm border-violet-200 shadow-xl"
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
          <div className="bg-linear-to-br from-violet-100 to-purple-100 p-3 rounded-lg border border-violet-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-violet-600" />
              <p className="text-xs text-violet-700 font-semibold">Média por Faixa</p>
            </div>
            <p className="text-2xl font-bold text-violet-800">{mediaLeads}</p>
            <p className="text-xs text-violet-600 font-medium">leads em média</p>
          </div>

          <div className="bg-linear-to-br from-purple-100 to-fuchsia-100 p-3 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-4 w-4 text-purple-600" />
              <p className="text-xs text-purple-700 font-semibold">Total Geral</p>
            </div>
            <p className="text-2xl font-bold text-purple-800">{totalLeads}</p>
            <p className="text-xs text-purple-600 font-medium">leads no total</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}