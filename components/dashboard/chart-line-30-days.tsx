"use client"

import React, { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Building2, CalendarIcon, Eraser, Search, Store, TrendingUp, Phone, User, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
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

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { getLeadsStatsFilterDateStats } from "@/lib/leads-service"

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

type Origem = 'todos' | 'industria' | 'proprio'

const DAY_PAGE_SIZE = 10

const CLASSIF_COLORS: Record<string, string> = {
  quente: 'bg-orange-100 text-orange-700',
  morno:  'bg-yellow-100 text-yellow-700',
  frio:   'bg-sky-100 text-sky-700',
}

const origemOptions: { value: Origem; label: string; icon: React.ReactNode }[] = [
  { value: 'todos', label: 'Todos', icon: null },
  { value: 'industria', label: 'Indústria', icon: <Building2 className="h-3.5 w-3.5" /> },
  { value: 'proprio', label: 'Lojistas', icon: <Store className="h-3.5 w-3.5" /> },
]

export function ChartLeads30Days({
  data: initialData,
  lojaId,
  showProprio = true,
}: {
  data: LeadChart[]
  lojaId?: string
  showProprio?: boolean
}) {
  const [data, setData] = useState(initialData)
  const [from, setFrom] = useState<Date | undefined>()
  const [to, setTo] = useState<Date | undefined>()
  const [loading, setLoading] = useState(false)
  const [isFiltered, setIsFiltered] = useState(false)
  const visibleOptions = showProprio ? origemOptions : origemOptions.filter(o => o.value !== 'proprio')
  const [origem, setOrigem] = useState<Origem>('todos')

  const [openDialog, setOpenDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [leadsDay, setLeadsDay] = useState<any[]>([])
  const [loadingDialog, setLoadingDialog] = useState(false)
  const [dayPage, setDayPage] = useState(1)

  async function fetchData(fromDate?: Date, toDate?: Date, origemVal: Origem = origem) {
    setLoading(true)
    try {
      if (fromDate && toDate) {
        const res = await getLeadsStatsFilterDateStats(
          format(fromDate, "yyyy-MM-dd"),
          format(toDate, "yyyy-MM-dd"),
          lojaId,
          origemVal === 'todos' ? undefined : origemVal,
        )
        setData(normalizeLeads(res.data, format(fromDate, "yyyy-MM-dd"), format(toDate, "yyyy-MM-dd")))
        setIsFiltered(true)
      } else {
        const params = new URLSearchParams()
        if (lojaId) params.set("loja_id", String(lojaId))
        if (origemVal !== 'todos') params.set("origem", origemVal)
        const res = await fetch(`/api/leads-30dias?${params.toString()}`)
        const json = await res.json()
        const raw = json.data ?? []
        setData(raw.map((i: any) => ({ date: i.data, total: parseInt(i.total) || 0 })))
        setIsFiltered(false)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleBuscar() {
    if (!from || !to) return
    await fetchData(from, to, origem)
  }

  async function handleOrigemChange(val: Origem) {
    setOrigem(val)
    await fetchData(isFiltered ? from : undefined, isFiltered ? to : undefined, val)
  }

  function handleLimpar() {
    setFrom(undefined)
    setTo(undefined)
    setData(initialData)
    setIsFiltered(false)
    setOrigem('todos')
  }

  async function handleChartClick(e: any) {
    if (!e?.activePayload?.length) return

    const date = e.activePayload[0].payload.date

    setSelectedDate(date)
    setLeadsDay([])
    setDayPage(1)
    setOpenDialog(true)
    setLoadingDialog(true)

    try {
      const params = new URLSearchParams({ date })
      if (lojaId) params.set('loja_id', lojaId)

      const res = await fetch(`/api/leads-por-dia?${params.toString()}`)

      if (!res.ok) {
        throw new Error(`Erro ao buscar leads: ${res.status}`)
      }

      const json = await res.json()
      setLeadsDay(json.data ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDialog(false)
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
                {loading
                  ? "Buscando dados..."
                  : isFiltered
                    ? `Filtrado: ${format(from!, "dd/MM/yyyy", { locale: ptBR })} até ${format(to!, "dd/MM/yyyy", { locale: ptBR })}`
                    : "Últimos 30 dias"}
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro de origem */}
              <div className="flex items-center rounded-lg border border-border/60 bg-white overflow-hidden">
                {visibleOptions.map((opt) => (
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
                disabled={!from || !to || loading}
                className="bg-[#16255c] hover:bg-[#0f1a45] flex items-center gap-1.5 cursor-pointer"
              >
                <Search />
                Buscar
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
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />

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
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#16255c]/10 text-[#16255c]">
                {selectedDate
                  ? format(new Date(selectedDate + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : ''}
              </span>
              {loadingDialog
                ? <span className="text-sm text-muted-foreground font-normal">carregando...</span>
                : <span className="text-base font-bold text-[#16255c]">
                    {leadsDay.length} lead{leadsDay.length !== 1 ? 's' : ''}
                  </span>
              }
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            {loadingDialog ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : leadsDay.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                Nenhum lead capturado neste dia
              </div>
            ) : (
              <div className="space-y-2">
                {leadsDay.slice((dayPage - 1) * DAY_PAGE_SIZE, dayPage * DAY_PAGE_SIZE).map((lead: any, i: number) => (
                  <div
                    key={lead.id ?? i}
                    className="rounded-lg border border-border/60 bg-card p-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-[#16255c]">{lead.nome}</p>
                          {lead.classificacao && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize ${CLASSIF_COLORS[lead.classificacao] ?? 'bg-slate-100 text-slate-600'}`}>
                              {lead.classificacao}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                          {lead.telefone && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3 shrink-0" />
                              {lead.telefone}
                            </span>
                          )}
                          {lead.loja_nome && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground max-w-52 truncate">
                              <Store className="h-3 w-3 shrink-0" />
                              {lead.loja_nome}
                            </span>
                          )}
                          {lead.responsavel_nome && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3 shrink-0" />
                              {lead.responsavel_nome}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        {lead.interesse && (
                          <p className="text-[10px] text-muted-foreground max-w-36 truncate text-right">
                            {lead.interesse}
                          </p>
                        )}
                        {lead.cidade && (
                          <p className="text-[10px] text-muted-foreground text-right">{lead.cidade}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {Math.ceil(leadsDay.length / DAY_PAGE_SIZE) > 1 && (
            <div className="flex items-center justify-between border-t px-6 py-3">
              <span className="text-xs text-muted-foreground">
                {(dayPage - 1) * DAY_PAGE_SIZE + 1}–{Math.min(dayPage * DAY_PAGE_SIZE, leadsDay.length)} de {leadsDay.length}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline" size="sm" className="h-7 text-xs"
                  disabled={dayPage === 1}
                  onClick={() => setDayPage(p => p - 1)}
                >
                  <ChevronLeft className="h-3 w-3 mr-1" /> Anterior
                </Button>
                <span className="text-xs text-muted-foreground px-1 tabular-nums">
                  {dayPage} / {Math.ceil(leadsDay.length / DAY_PAGE_SIZE)}
                </span>
                <Button
                  variant="outline" size="sm" className="h-7 text-xs"
                  disabled={dayPage === Math.ceil(leadsDay.length / DAY_PAGE_SIZE)}
                  onClick={() => setDayPage(p => p + 1)}
                >
                  Próxima <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}