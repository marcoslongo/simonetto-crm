"use client"

import React, { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, TrendingUp, Eraser, Search, Store, LocateFixed, Building2 } from "lucide-react"
import { CartesianGrid, Area, AreaChart, XAxis, YAxis } from "recharts"

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
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

type Origem = 'todos' | 'industria' | 'proprio'

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

function normalizeLeads(data: any[], from: string, to: string): LeadChart[] {
  if (!Array.isArray(data)) return []
  const map = new Map(data.map((i) => [i.data as string, parseInt(i.total) || 0]))

  const [sy, sm, sd] = from.split("-").map(Number)
  const [ey, em, ed] = to.split("-").map(Number)
  let d = new Date(Date.UTC(sy, sm - 1, sd))
  const end = new Date(Date.UTC(ey, em - 1, ed))
  const result: LeadChart[] = []

  while (d <= end) {
    const dateStr = d.toISOString().substring(0, 10)
    result.push({ date: dateStr, total: map.get(dateStr) ?? 0 })
    d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1))
  }
  return result
}

export function ChartLeads30Days({
  data: initialData,
  lojaIds,
  showProprio = true,
}: {
  data: LeadChart[]
  lojaIds?: (string | number)[]
  showProprio?: boolean
}) {
  const [data, setData]       = useState(initialData)
  const [from, setFrom]       = useState<Date | undefined>()
  const [to, setTo]           = useState<Date | undefined>()
  const [origem, setOrigem]   = useState<Origem>('todos')
  const [loading, setLoading] = useState(false)

  const [openDialog, setOpenDialog]       = useState(false)
  const [selectedDate, setSelectedDate]   = useState<string | null>(null)
  const [loadingDialog, setLoadingDialog] = useState(false)
  const [leadsDay, setLeadsDay]           = useState<any[]>([])

  const isFiltered = !!from || !!to

  async function fetchData(fromStr?: string, toStr?: string, origemVal?: string) {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (fromStr) qs.set('from', fromStr)
      if (toStr)   qs.set('to', toStr)
      if (lojaIds?.length) qs.set('loja_ids', lojaIds.join(','))
      if (origemVal && origemVal !== 'todos') qs.set('origem', origemVal)

      const json = await fetch(`/api/kanban/leads-by-day?${qs}`).then(r => r.json())

      const normalized = fromStr && toStr
        ? normalizeLeads(json.data ?? [], fromStr, toStr)
        : (json.data ?? []).map((i: any) => ({ date: i.data as string, total: parseInt(i.total) || 0 }))
      setData(normalized)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleBuscar() {
    if (!from || !to) return
    await fetchData(format(from, "yyyy-MM-dd"), format(to, "yyyy-MM-dd"), origem)
  }

  async function handleOrigemChange(val: Origem) {
    setOrigem(val)
    if (from && to) {
      await fetchData(format(from, "yyyy-MM-dd"), format(to, "yyyy-MM-dd"), val)
    } else if (val === 'todos') {
      setData(initialData)
    } else {
      const today = new Date()
      const ago30 = new Date(); ago30.setDate(ago30.getDate() - 29)
      await fetchData(format(ago30, "yyyy-MM-dd"), format(today, "yyyy-MM-dd"), val)
    }
  }

  function handleLimpar() {
    setFrom(undefined)
    setTo(undefined)
    setOrigem('todos')
    setData(initialData)
  }

  async function handleChartClick(e: any) {
    if (!e?.activePayload?.length) return
    const clickedDate = e.activePayload[0].payload.date as string
    setSelectedDate(clickedDate)
    setOpenDialog(true)
    setLoadingDialog(true)
    setLeadsDay([])
    try {
      const qs = new URLSearchParams({ from: clickedDate, to: clickedDate, per_page: '200' })
      if (lojaIds?.length) qs.set('loja_ids', lojaIds.join(','))
      const json = await fetch(`/api/kanban/leads?${qs}`).then(r => r.json())
      if (json.success) setLeadsDay(json.leads ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDialog(false)
    }
  }

  const totalLeads = data.reduce((s, i) => s + i.total, 0)
  const avgLeads   = data.length ? Math.round(totalLeads / data.length) : 0
  const maxLeads   = data.length ? Math.max(...data.map(i => i.total)) : 0

  const origemLabel: Record<Origem, string> = {
    todos:    'Todos os leads',
    industria: 'Leads de Indústria',
    proprio:  'Leads Próprios',
  }

  return (
    <>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
        <CardHeader className="pb-3">
          {/* ── Linha 1: título + stats ── */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <CardTitle className="text-xl font-bold text-[#16255c]">
                Leads por período
              </CardTitle>
              <CardDescription className="mt-0.5">
                {loading ? "Buscando dados…" : origemLabel[origem]}
              </CardDescription>
            </div>

            <div className="flex items-center gap-5 shrink-0">
              <div className="text-center">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Total</p>
                <p className="text-2xl font-bold text-[#16255c] leading-none">{totalLeads}</p>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-center">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Média/dia</p>
                <p className="text-2xl font-bold text-[#16255c] leading-none">{avgLeads}</p>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-center">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Pico</p>
                <p className="text-2xl font-bold text-[#16255c] leading-none">{maxLeads}</p>
              </div>
            </div>
          </div>

          {/* ── Linha 2: filtros ── */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t border-slate-200/70">
            {/* Date pickers + botões de ação */}
            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-36 justify-start text-xs bg-white">
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                    {from ? format(from, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={from} onSelect={setFrom} locale={ptBR} />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-36 justify-start text-xs bg-white">
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                    {to ? format(to, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={to} onSelect={setTo} locale={ptBR} />
                </PopoverContent>
              </Popover>

              <Button
                size="sm"
                onClick={handleBuscar}
                disabled={loading || !from || !to}
                className="h-8 px-3 text-xs text-white bg-[#16255c] hover:bg-[#0f1a45]"
              >
                <Search className="mr-1.5 h-3.5 w-3.5" />
                {loading ? "Buscando…" : "Buscar"}
              </Button>

              {isFiltered && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleLimpar}
                  className="h-8 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Eraser className="mr-1.5 h-3.5 w-3.5" />
                  Limpar
                </Button>
              )}
            </div>

            {/* Origem toggle */}
            <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 ml-auto">
              {(
                [
                  ['todos', 'Todos', null],
                  ['industria', 'Indústria', <Building2 key="i" className="h-3.5 w-3.5" />],
                  ...(showProprio ? [['proprio', 'Próprio', <Store key="p" className="h-3.5 w-3.5" />]] : []),
                ] as [Origem, string, React.ReactNode][]
              ).map(([val, label, icon]) => (
                <button
                  key={val}
                  onClick={() => handleOrigemChange(val)}
                  className={[
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                    origem === val
                      ? 'bg-[#16255c] text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
                  ].join(' ')}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full cursor-pointer">
            <AreaChart data={data} onClick={handleChartClick} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16255c" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16255c" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) =>
                  new Date(v + 'T12:00:00').toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })
                }
              />

              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                width={28}
              />

              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      new Date(value + 'T12:00:00').toLocaleDateString("pt-BR", {
                        weekday: "short",
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
                fill="url(#gradLeads)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: '#16255c', strokeWidth: 0 }}
              />
            </AreaChart>
          </ChartContainer>

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 bg-[#16255c]/5 px-3 py-2 rounded-lg">
            <TrendingUp className="h-3.5 w-3.5 text-[#16255c]" />
            <span>
              <strong className="text-[#16255c]">{totalLeads}</strong> leads no período
              {origem !== 'todos' && (
                <span className="ml-1 text-slate-400">
                  · filtrando por <strong>{origemLabel[origem].toLowerCase()}</strong>
                </span>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl" aria-describedby="dialog-leads-desc">
          <DialogHeader>
            <DialogTitle>
              Leads do dia{" "}
              {selectedDate &&
                new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
            </DialogTitle>
            <DialogDescription id="dialog-leads-desc">
              Lista de leads capturados neste dia
            </DialogDescription>
          </DialogHeader>

          {loadingDialog ? (
            <p className="text-center py-8 text-slate-500">Carregando leads…</p>
          ) : leadsDay.length === 0 ? (
            <p className="text-center py-8 text-slate-400">Nenhum lead nesse dia</p>
          ) : (
            <div className="max-h-[60vh] overflow-auto space-y-2 pr-2">
              {leadsDay.map((lead, i) => (
                <div key={i} className="border rounded-lg p-3 bg-slate-50 space-y-1">
                  <p className="font-semibold text-[#16255c]">{lead.nome}</p>
                  {lead.loja_regiao && (
                    <p className="text-xs text-slate-600 flex gap-1.5 items-center">
                      <Store size={13} /> {lead.loja_regiao}
                    </p>
                  )}
                  {lead.cidade && (
                    <p className="text-xs text-slate-600 flex gap-1.5 items-center">
                      <LocateFixed size={13} /> {lead.cidade}
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
