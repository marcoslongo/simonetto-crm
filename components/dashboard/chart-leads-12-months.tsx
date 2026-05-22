"use client"

import React, { useState } from "react"
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
import { TrendingUp, Calendar, Building2, Store } from "lucide-react"

interface ChartLeads12MonthsProps {
  data: {
    date: string
    total: number
  }[]
  lojaId?: string | number
}

const chartConfig = {
  total: {
    label: "Leads",
    color: "#16255c",
  },
} satisfies ChartConfig

type Origem = 'todos' | 'industria' | 'proprio'

const origemOptions: { value: Origem; label: string; icon: React.ReactNode }[] = [
  { value: 'todos', label: 'Todos', icon: null },
  { value: 'industria', label: 'Indústria', icon: <Building2 className="h-3.5 w-3.5" /> },
  { value: 'proprio', label: 'Lojistas', icon: <Store className="h-3.5 w-3.5" /> },
]

export function ChartLeads12Months({ data: initialData, lojaId }: ChartLeads12MonthsProps) {
  const [data, setData] = useState(initialData)
  const [origem, setOrigem] = useState<Origem>('todos')
  const [loading, setLoading] = useState(false)

  async function handleOrigemChange(val: Origem) {
    setOrigem(val)
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (val !== 'todos') params.set('origem', val)
      if (lojaId) params.set('loja_id', String(lojaId))
      const res = await fetch(`/api/leads-12meses?${params.toString()}`)
      const json = await res.json()
      setData(json.data ?? [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const totalLeads = data.reduce((sum, item) => sum + item.total, 0)
  const avgLeads = data.length ? Math.round(totalLeads / data.length) : 0
  const maxLeads = data.length ? Math.max(...data.map(item => item.total)) : 0

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold text-[#16255c]">
              Leads últimos 12 meses
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-slate-600">
              <Calendar className="h-4 w-4" />
              {loading ? 'Buscando dados...' : 'Captação mensal de leads'}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Filtro de origem */}
            <div className="flex items-center rounded-lg border border-border/60 bg-white overflow-hidden">
              {origemOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleOrigemChange(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    origem === opt.value
                      ? 'bg-[#16255c] text-white'
                      : 'text-[#16255c]/70 hover:bg-slate-100'
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Média mensal</p>
                <p className="text-2xl font-bold text-[#16255c]">{avgLeads}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Pico</p>
                <p className="text-2xl font-bold text-[#16255c]">{maxLeads}</p>
              </div>
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
