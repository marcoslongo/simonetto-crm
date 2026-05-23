"use client"

import { useState, useCallback } from "react"
import { format, subDays, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer,
} from "recharts"
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { CalendarIcon, Eraser, TrendingDown, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface VnrMotivoItem {
  key: string
  label: string
  total: number
  pct: number
}

export interface VnrStatsData {
  total: number
  motivos: VnrMotivoItem[]
}

interface LojaOption {
  id: number
  nome: string
}

interface ChartVnrMotivosProps {
  initialData: VnrStatsData
  isAdmin?: boolean
  lojas?: LojaOption[]
  lojaIds?: number[]
}

const BARS_PALETTE = [
  "#dc2626", "#ef4444", "#f87171", "#fca5a5",
  "#fecaca", "#fde8e8", "#fee2e2", "#fef2f2",
  "#fff1f1", "#fff5f5", "#fff8f8",
]

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { label, total, pct } = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-sm max-w-56">
      <p className="font-semibold text-[#16255c] text-xs uppercase tracking-wide mb-1 leading-tight">
        {label}
      </p>
      <p className="text-slate-600">
        <span className="font-bold text-red-600 text-base">{total}</span>{" "}
        ocorrências{" "}
        <span className="text-slate-400">({pct}%)</span>
      </p>
    </div>
  )
}

async function fetchVnrStats(params: {
  lojaId?: string
  from?: string
  to?: string
}): Promise<VnrStatsData> {
  const qs = new URLSearchParams()
  if (params.lojaId && params.lojaId !== "all") qs.set("loja_id", params.lojaId)
  if (params.from) qs.set("from", params.from)
  if (params.to)   qs.set("to", params.to)

  const res = await fetch(`/api/vnr-stats?${qs.toString()}`)
  const json = await res.json()
  if (!json.success) return { total: 0, motivos: [] }
  return { total: json.total, motivos: json.motivos }
}

export function ChartVnrMotivos({
  initialData,
  isAdmin = false,
  lojas = [],
  lojaIds = [],
}: ChartVnrMotivosProps) {
  const [data, setData]       = useState<VnrStatsData>(initialData)
  const [loading, setLoading] = useState(false)
  const [from, setFrom]       = useState<Date | undefined>()
  const [to, setTo]           = useState<Date | undefined>()
  const [lojaId, setLojaId]   = useState<string>("all")

  const isFiltered = !!(from || to || (isAdmin && lojaId !== "all"))

  const refetch = useCallback(async (opts: {
    from?: Date; to?: Date; lojaId?: string
  }) => {
    setLoading(true)
    try {
      const result = await fetchVnrStats({
        lojaId:  opts.lojaId,
        from:    opts.from ? format(opts.from, "yyyy-MM-dd") : undefined,
        to:      opts.to   ? format(opts.to,   "yyyy-MM-dd") : undefined,
      })
      setData(result)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleBuscar = () => refetch({ from, to, lojaId })

  const handlePeriodo = (months: number) => {
    const toDate   = new Date()
    const fromDate = months === 0 ? subDays(toDate, 30) : subMonths(toDate, months)
    setFrom(fromDate)
    setTo(toDate)
    refetch({ from: fromDate, to: toDate, lojaId })
  }

  const handleLimpar = () => {
    setFrom(undefined)
    setTo(undefined)
    setLojaId("all")
    refetch({})
  }

  const activeMotivos = data.motivos.filter(m => m.total > 0)
  const top = activeMotivos[0]

  // Para lojista: filtra os ids da loja
  const lojasFiltradas = isAdmin
    ? lojas
    : lojas.filter(l => lojaIds.includes(l.id))

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
              <CardTitle className="text-xl font-bold text-[#16255c]">
                Motivos de Venda Não Realizada
              </CardTitle>
            </div>
            <CardDescription className="text-slate-500 ml-10">
              {data.total > 0
                ? `${data.total} registro${data.total !== 1 ? "s" : ""} no período`
                : "Nenhum registro no período"}
            </CardDescription>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => handlePeriodo(0)}
              disabled={loading} className="text-xs whitespace-nowrap">
              30 dias
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePeriodo(3)}
              disabled={loading} className="text-xs whitespace-nowrap">
              3 meses
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePeriodo(12)}
              disabled={loading} className="text-xs whitespace-nowrap">
              12 meses
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && lojas.length > 0 && (
            <Select value={lojaId} onValueChange={setLojaId}>
              <SelectTrigger className="w-44 text-sm">
                <SelectValue placeholder="Todas as lojas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as lojas</SelectItem>
                {lojas.map(l => (
                  <SelectItem key={l.id} value={String(l.id)}>{l.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-38 justify-start text-sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {from ? format(from, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={from} onSelect={setFrom} locale={ptBR} />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-38 justify-start text-sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {to ? format(to, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={to} onSelect={setTo} locale={ptBR} />
            </PopoverContent>
          </Popover>

          <Button
            onClick={handleBuscar}
            disabled={loading}
            className="bg-[#16255c] hover:bg-[#0f1a45]"
          >
            {loading ? "Buscando…" : "Buscar"}
          </Button>

          {isFiltered && (
            <Button variant="destructive" onClick={handleLimpar} disabled={loading}
              className="flex gap-1.5 items-center">
              <Eraser className="h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>

        {/* Destaque do principal motivo */}
        {top && top.total > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-800">
              <span className="font-semibold">Principal gargalo:</span>{" "}
              {top.label}{" "}
              <span className="text-red-600 font-bold">({top.pct}%)</span>
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {activeMotivos.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center gap-2">
            <TrendingDown className="h-8 w-8 text-slate-300" />
            <p className="text-slate-400 text-sm">Nenhum dado disponível</p>
          </div>
        ) : (
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activeMotivos}
                layout="vertical"
                margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
              >
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={210}
                  tick={{ fontSize: 11, fill: "#475569" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
                <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={28}>
                  {activeMotivos.map((entry, i) => (
                    <Cell
                      key={entry.key}
                      fill={BARS_PALETTE[Math.min(i, BARS_PALETTE.length - 1)]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tabela legenda */}
        {activeMotivos.length > 0 && (
          <div className="mt-4 space-y-1.5 border-t pt-4">
            {activeMotivos.map((item, i) => (
              <div key={item.key} className="flex items-center gap-3 text-sm">
                <span
                  className="h-3 w-3 rounded-sm shrink-0"
                  style={{ backgroundColor: BARS_PALETTE[Math.min(i, BARS_PALETTE.length - 1)] }}
                />
                <span className={cn("flex-1 text-slate-700", i === 0 && "font-semibold")}>
                  {item.label}
                </span>
                <span className="text-slate-400 tabular-nums">{item.total}</span>
                <span className={cn(
                  "w-12 text-right tabular-nums font-medium",
                  i === 0 ? "text-red-600" : "text-slate-500"
                )}>
                  {item.pct}%
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
