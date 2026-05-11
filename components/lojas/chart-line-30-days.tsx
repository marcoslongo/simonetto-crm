"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, TrendingUp, Eraser, Search, Store, LocateFixed } from "lucide-react"
import { CartesianGrid, Line, Area, AreaChart, XAxis, YAxis } from "recharts"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

import { getLeadsStatsFilterDateStats, getLeadsByDate } from "@/lib/leads-service"

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
  if (!Array.isArray(data)) return []

  const map = new Map(data.map((i) => [i.data, parseInt(i.total) || 0]))
  const result = []

  const [sy, sm, sd] = from.split("-").map(Number)
  const [ey, em, ed] = to.split("-").map(Number)
  let d = new Date(Date.UTC(sy, sm - 1, sd))
  const end = new Date(Date.UTC(ey, em - 1, ed))

  while (d <= end) {
    const dateStr = d.toISOString().split("T")[0]
    result.push({ date: dateStr, total: map.get(dateStr) || 0 })
    d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1))
  }

  return result
}

export function ChartLeads30Days({
  data: initialData,
  lojaId,
}: {
  data: LeadChart[]
  lojaId?: string | number
}) {
  const [data, setData] = useState(initialData)
  const [from, setFrom] = useState<Date | undefined>()
  const [to, setTo] = useState<Date | undefined>()
  const [loading, setLoading] = useState(false)

  const [openDialog, setOpenDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loadingDialog, setLoadingDialog] = useState(false)
  const [leadsDay, setLeadsDay] = useState<any[]>([])

  const isFiltered = !!from || !!to

  async function handleBuscar() {
    if (!from || !to) return

    setLoading(true)

    try {
      const res = await getLeadsStatsFilterDateStats(
        format(from, "yyyy-MM-dd"),
        format(to, "yyyy-MM-dd"),
        lojaId,
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

  function handleLimpar() {
    setFrom(undefined)
    setTo(undefined)
    setData(initialData)
  }

  async function handleChartClick(e: any) {
    if (e && e.activePayload && e.activePayload.length > 0) {
      const clickedDate = e.activePayload[0].payload.date
      setSelectedDate(clickedDate)
      setOpenDialog(true)
      setLoadingDialog(true)
      setLeadsDay([])

      try {
        const res = await getLeadsByDate(lojaId ? String(lojaId) : undefined, clickedDate)
        if (res && res.data) {
          setLeadsDay(res.data)
        }
      } catch (error) {
        console.error("Erro ao buscar leads do dia", error)
      } finally {
        setLoadingDialog(false)
      }
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
                disabled={loading || !from || !to}
                className="hover:text-white flex gap-2 items-center text-white cursor-pointer bg-[#16255c] hover:bg-[#0f1a45]"
              >
                <Search className="h-4 w-4" />
                {loading ? "Buscando..." : "Buscar"}
              </Button>

              {isFiltered && (
                <Button
                  variant="destructive"
                  onClick={handleLimpar}
                  className="hover:text-white flex gap-2 items-center text-white cursor-pointer"
                >
                  <Eraser className="h-4 w-4" />
                  Limpar
                </Button>
              )}
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
            <AreaChart data={data} onClick={handleChartClick}>
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
                type="monotone"
                dataKey="total"
                stroke="#16255c"
                fill="#16255c33"
                strokeWidth={3}
              />

              <Line
                type="monotone"
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

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl" aria-describedby="dialog-leads-desc">
          <DialogHeader>
            <DialogTitle>
              Leads do dia{" "}
              {selectedDate &&
                new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR")}
            </DialogTitle>
            <DialogDescription id="dialog-leads-desc">
              Lista de leads capturados neste dia
            </DialogDescription>
          </DialogHeader>

          {loadingDialog ? (
            <p className="text-center py-8">Carregando leads...</p>
          ) : leadsDay.length === 0 ? (
            <p className="text-center py-8">Nenhum lead nesse dia</p>
          ) : (
            <div className="max-h-[60vh] overflow-auto space-y-2 pr-2">
              {leadsDay.map((lead, i) => (
                <div
                  key={i}
                  className="border rounded-lg p-3 bg-slate-50 space-y-1"
                >
                  <p className="font-semibold text-[#16255c]">
                    {lead.nome}
                  </p>

                  {lead.loja_regiao && (
                    <p className="text-xs text-slate-600 flex gap-1.5 items-center">
                      <Store size={14} /> Loja: <strong>{lead.loja_regiao}</strong>
                    </p>
                  )}

                  {lead.cidade && (
                    <p className="text-xs text-slate-600 flex gap-1.5 items-center">
                      <LocateFixed size={14} /> Cidade: <strong>{lead.cidade}</strong>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}