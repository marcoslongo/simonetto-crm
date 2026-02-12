"use client"

import { Pie, PieChart, Cell } from "recharts"
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
import { Target, TrendingUp, Sparkles } from "lucide-react"

interface ChartPieInteresseProps {
  data: {
    interesse: string
    total: number
  }[]
}

const chartConfig = {
  total: {
    label: "Leads",
  },
} satisfies ChartConfig

// Paleta de cores vibrantes e variadas
const COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
  "#6366f1", // indigo-500
  "#84cc16", // lime-500
  "#06b6d4", // cyan-500
  "#f43f5e", // rose-500
  "#a855f7", // purple-500
]

export function ChartPieInteresse({ data }: ChartPieInteresseProps) {
  // Estatísticas
  const totalLeads = data.reduce((sum, item) => sum + item.total, 0)
  const interesseMaisPopular = data.reduce((prev, current) => 
    (prev.total > current.total) ? prev : current
  )
  const percentualLider = ((interesseMaisPopular.total / totalLeads) * 100).toFixed(1)

  // Prepara dados com percentuais
  const dataWithPercentage = data.map((item, index) => ({
    ...item,
    percentage: ((item.total / totalLeads) * 100).toFixed(1),
    color: COLORS[index % COLORS.length],
  }))

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-[#16255c]">
              Leads por Interesse
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-slate-600">
              <Target className="h-4 w-4" />
              Distribuição por categoria de interesse
            </CardDescription>
          </div>

          <div className="text-right bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs text-[#16255c] font-semibold flex items-center gap-1 justify-end">
              <Sparkles className="h-3 w-3" />
              Mais Popular
            </p>
            <p className="text-lg font-bold text-[#16255c]">{interesseMaisPopular.interesse}</p>
            <p className="text-xs text-slate-500 font-medium">{percentualLider}% dos leads</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Gráfico */}
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 shadow-inner">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[300px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent 
                    className="bg-white/95 backdrop-blur-sm border-slate-200 shadow-xl"
                    formatter={(value, name, props) => (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: props.payload.color }}
                        />
                        <span className="font-semibold">{value} leads ({props.payload.percentage}%)</span>
                      </div>
                    )}
                  />
                }
              />

              <Pie
                data={dataWithPercentage}
                dataKey="total"
                nameKey="interesse"
                cx="50%"
                cy="50%"
                outerRadius={100}
                strokeWidth={3}
                stroke="white"
                label={({ percentage }) => `${percentage}%`}
                labelLine={false}
              >
                {dataWithPercentage.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>

        {/* Legenda customizada */}
        <div className="grid grid-cols-2 gap-3">
          {dataWithPercentage.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 bg-white/60 backdrop-blur-sm p-3 rounded-lg border border-slate-200 hover:shadow-md transition-all"
            >
              <div
                className="w-4 h-4 rounded-full shadow-sm flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#16255c] truncate">
                  {item.interesse}
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  {item.total.toLocaleString()} leads ({item.percentage}%)
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer com total */}
        <div className="flex items-center gap-2 text-sm bg-[#16255c]/5 p-3 rounded-lg border border-[#16255c]/10">
          <TrendingUp className="h-4 w-4 text-[#16255c]" />
          <span className="font-semibold text-[#16255c]">
            Total de <span className="font-bold">{totalLeads.toLocaleString()}</span> leads 
            distribuídos em {data.length} categorias
          </span>
        </div>
      </CardContent>
    </Card>
  )
}