"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"
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

interface ChartBarFaturamentoProps {
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

export function ChartBarFaturamento({ data }: ChartBarFaturamentoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads por Faturamento</CardTitle>
        <CardDescription>Distribuição por faixa</CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 0 }}
          >
            <YAxis
              dataKey="faixa"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />

            <XAxis dataKey="total" type="number" hide />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
            />

            <Bar
              dataKey="total"
              radius={5}
              fill="var(--chart-1)"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
