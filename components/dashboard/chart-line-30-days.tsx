"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis, Area, AreaChart } from "recharts"
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
import { TrendingUp, Calendar } from "lucide-react"

interface ChartLeads30DaysProps {
  data: {
    date: string
    total: number
  }[]
}

const chartConfig = {
  total: {
    label: "Leads",
    color: "#1e3a8a", // azul marinho
  },
} satisfies ChartConfig

export function ChartLeads30Days({ data }: ChartLeads30DaysProps) {
  const totalLeads = data.reduce((sum, item) => sum + item.total, 0)
  const avgLeads = Math.round(totalLeads / data.length)
  const maxLeads = Math.max(...data.map(item => item.total))

  return (
    <Card className="border-0 shadow-lg bg-linear-to-br from-slate-50 to-gray-50">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold text-[#0e1627]">
              Leads últimos 30 dias
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              Captação diária de leads
            </CardDescription>
          </div>
          
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500 font-medium">Média diária</p>
              <p className="text-2xl font-bold text-blue-600">{avgLeads}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-medium">Pico</p>
              <p className="text-2xl font-bold text-emerald-600">{maxLeads}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-87.5 w-full"
        >
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12, top: 12 }}
          >
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
              </linearGradient>
            </defs>

            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false}
              stroke="#e5e7eb"
              opacity={0.5}
            />

            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              minTickGap={32}
              tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                })
              }
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
            />

            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-xl"
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  }
                  indicator="dot"
                />
              }
            />

            <Area
              dataKey="total"
              type="monotone"
              stroke="#1e3a8a"
              strokeWidth={3}
              fill="url(#colorTotal)"
              dot={false}
            />

            <Line
              dataKey="total"
              type="monotone"
              stroke="#1e3a8a"
              strokeWidth={3}
              dot={{
                fill: "#1e3a8a",
                strokeWidth: 2,
                r: 4,
                stroke: "white"
              }}
              activeDot={{
                r: 6,
                fill: "#1e3a8a",
                stroke: "white",
                strokeWidth: 3
              }}
            />
          </AreaChart>
        </ChartContainer>

        <div className="mt-6 flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <span className="font-medium">
            Total de <span className="text-blue-600 font-bold">{totalLeads}</span> leads 
            capturados nos últimos 30 dias
          </span>
        </div>
      </CardContent>
    </Card>
  )
}