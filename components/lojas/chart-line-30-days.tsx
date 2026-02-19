"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, LocateFixed, Store, TrendingUp } from "lucide-react"
import { CartesianGrid, Line, Area, AreaChart, XAxis, YAxis } from "recharts"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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


import {
  getLeadsStatsFilterDate,
} from "@/lib/leads-service"

interface LeadChart {
  date: string
  total: number
}

const chartConfig = {
  total: {
    label: "Leads",
    color: "#16255c",
  },
} satisfies ChartConfig

function normalizeLeads(data: any[], from: string, to: string) {
  const start = new Date(from)
  const end = new Date(to)

  const map = new Map(
    data.map((i) => [i.data, parseInt(i.total) || 0])
  )

  const result = []

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0]

    result.push({
      date: dateStr,
      total: map.get(dateStr) || 0,
    })
  }

  return result
}

export function ChartLeads30Days({ data: initialData }: { data: LeadChart[] }) {
  const [data, setData] = useState(initialData)
  const [from, setFrom] = useState<Date | undefined>()
  const [to, setTo] = useState<Date | undefined>()
  const [loading, setLoading] = useState(false)

  async function handleBuscar() {
    if (!from || !to) return

    setLoading(true)

    try {
      const res = await getLeadsStatsFilterDate(
        format(from, "yyyy-MM-dd"),
        format(to, "yyyy-MM-dd")
      )

      const normalized = normalizeLeads(
        res.data,
        format(from, "yyyy-MM-dd"),
        format(to, "yyyy-MM-dd")
      )

      setData(normalized)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

 

  const totalLeads = data.reduce((s, i) => s + i.total, 0)
  const avgLeads = data.length ? Math.round(totalLeads / data.length) : 0
  const maxLeads = data.length ? Math.max(...data.map(i => i.total)) : 0

  return (
    <>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-[#16255c]">
                Leads por período
              </CardTitle>
              <CardDescription>
                {loading ? "Buscando dados..." : "Captação diária"}
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40 justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {from
                      ? format(from, "dd/MM/yyyy", { locale: ptBR })
                      : "Data inicial"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={from}
                    onSelect={setFrom}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40 justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {to
                      ? format(to, "dd/MM/yyyy", { locale: ptBR })
                      : "Data final"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={to}
                    onSelect={setTo}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              <Button
                onClick={handleBuscar}
                className="bg-[#16255c] hover:bg-[#0f1a45]"
              >
                Buscar
              </Button>
            </div>

            <div className="flex gap-4">
              <div className="text-right">
                <p className="text-xs text-slate-500">Média</p>
                <p className="text-xl font-bold text-[#16255c]">{avgLeads}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Pico</p>
                <p className="text-xl font-bold text-[#16255c]">{maxLeads}</p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-87.5 w-full cursor-pointer"
          >
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />

              <XAxis
                dataKey="date"
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })
                }
              />

              <YAxis />

              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    }
                  />
                }
              />

              <Area
                dataKey="total"
                stroke="#16255c"
                fill="#16255c33"
                strokeWidth={3}
              />

              <Line
                dataKey="total"
                stroke="#16255c"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ChartContainer>

          <div className="mt-6 flex items-center gap-2 text-sm bg-[#16255c]/5 p-3 rounded-lg">
            <TrendingUp className="h-4 w-4 text-[#16255c]" />
            Total de <strong>{totalLeads}</strong> leads no período
          </div>
        </CardContent>
      </Card>
    </>
  )
}
