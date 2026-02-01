"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface LeadsPorLoja {
  loja: string
  total: number
}

interface Props {
  data: LeadsPorLoja[]
}

const chartConfig = {
  total: {
    label: "Leads",
  },
} satisfies ChartConfig

export function ChartLeadsPorLoja({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads por Loja</CardTitle>
        <CardDescription>Distribuição por unidade</CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{
              left: 20,
            }}
          >
            <YAxis
              dataKey="loja"
              type="category"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              width={180}
            />

            <XAxis dataKey="total" type="number" hide />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            <Bar
              dataKey="total"
              layout="vertical"
              radius={6}
              fill="var(--chart-1)"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Total de leads por unidade <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Considera todo o período selecionado
        </div>
      </CardFooter>
    </Card>
  )
}