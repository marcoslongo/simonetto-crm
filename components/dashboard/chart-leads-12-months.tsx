"use client"

import { CartesianGrid, Bar, BarChart, XAxis, YAxis } from "recharts"
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

interface ChartLeads12MonthsProps {
  data: {
    date: string
    total: number
  }[]
}

const chartConfig = {
  total: {
    label: "Leads",
    color: "#16255c",
  },
} satisfies ChartConfig

export function ChartLeads12Months({ data }: ChartLeads12MonthsProps) {
  const totalLeads = data.reduce((sum, item) => sum + item.total, 0)
  const avgLeads = Math.round(totalLeads / data.length)
  const maxLeads = Math.max(...data.map(item => item.total))

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold text-[#16255c]">
              Leads últimos 12 meses
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-slate-600">
              <Calendar className="h-4 w-4" />
              Captação mensal de leads
            </CardDescription>
          </div>

          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium">
                Média mensal
              </p>
              <p className="text-2xl font-bold text-[#16255c]">
                {avgLeads}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium">
                Pico
              </p>
              <p className="text-2xl font-bold text-[#16255c]">
                {maxLeads}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[350px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12, top: 12 }}
          >
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
              tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("pt-BR", {
                  month: "short",
                  year: "2-digit",
                })
              }
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
            />

            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="bg-white/95 backdrop-blur-sm border-slate-200 shadow-xl"
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                    })
                  }
                  indicator="dot"
                />
              }
            />

            <Bar
              dataKey="total"
              radius={[8, 8, 0, 0]}
              fill="#16255c"
            />
          </BarChart>
        </ChartContainer>

        <div className="mt-6 flex items-center gap-2 text-sm bg-[#16255c]/5 p-3 rounded-lg border border-[#16255c]/10">
          <TrendingUp className="h-4 w-4 text-[#16255c]" />
          <span className="font-semibold text-[#16255c]">
            Total de <span className="font-bold">{totalLeads}</span> leads
            capturados nos últimos 12 meses
          </span>
        </div>
      </CardContent>
    </Card>
  )
}