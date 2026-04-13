"use client"

import { useState, useMemo, useCallback } from "react"
import { format, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Search, Eraser } from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

export interface OrigemItem {
  utm_source: string
  utm_medium: string
  total: number
  pct: number
}

interface ChartPieOrigemProps {
  initialData: OrigemItem[]
}

const PALETTE = [
  "#16255c", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd",
  "#1e40af", "#1d4ed8", "#0ea5e9", "#38bdf8",
]

async function fetchLeadsPorOrigem(from?: string, to?: string): Promise<OrigemItem[]> {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)

  const res = await fetch(`/api/leads-por-origem?${params.toString()}`)
  const json = await res.json()

  if (!json.data || !Array.isArray(json.data)) return []
  return json.data as OrigemItem[]
}

function normalizeSource(source?: string) {
  if (!source) return "Direto"
  const s = source.toLowerCase().trim()
  const aliases: Record<string, string> = {
    "(direto)": "Direto", direto: "Direto",
    ig: "Instagram", instagram: "Instagram",
    fb: "Facebook", facebook: "Facebook", meta: "Facebook",
    google: "Google", google_ads: "Google Ads", gads: "Google Ads",
    yt: "YouTube", youtube: "YouTube",
    tiktok: "TikTok",
  }
  return aliases[s] || source
}

function groupBySource(raw: OrigemItem[]) {
  const map: Record<string, { total: number; mediums: Set<string> }> = {}
  for (const item of raw) {
    const source = normalizeSource(item.utm_source)
    if (!map[source]) map[source] = { total: 0, mediums: new Set() }
    map[source].total += item.total
    if (item.utm_medium) map[source].mediums.add(item.utm_medium)
  }
  const grandTotal = Object.values(map).reduce((s, v) => s + v.total, 0)
  return Object.entries(map)
    .map(([source, v]) => ({
      label: source,
      medium: Array.from(v.mediums).join(", ") || "—",
      total: v.total,
      pct: grandTotal > 0 ? parseFloat(((v.total / grandTotal) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.total - a.total)
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { label, medium, total, pct } = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-sm space-y-1">
      <p className="font-semibold text-[#16255c]">{label}</p>
      {medium !== "—" && <p className="text-slate-400 text-xs">via {medium}</p>}
      <p className="text-slate-600">
        <span className="font-bold text-[#16255c]">{total}</span> leads{" "}
        <span className="text-slate-400">({pct}%)</span>
      </p>
    </div>
  )
}

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.04) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle"
      dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function ChartPieOrigem({ initialData }: ChartPieOrigemProps) {
  const [data, setData] = useState<OrigemItem[]>(initialData)
  const [from, setFrom] = useState<Date | undefined>()
  const [to, setTo] = useState<Date | undefined>()
  const [loading, setLoading] = useState(false)
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const isFiltered = !!(from || to)

  const grouped = useMemo(() => groupBySource(data), [data])
  const total = useMemo(() => grouped.reduce((s, i) => s + i.total, 0), [grouped])

  const fetchData = useCallback(async (fromDate?: Date, toDate?: Date) => {
    setLoading(true)
    try {
      const fromStr = fromDate ? format(fromDate, "yyyy-MM-dd") : undefined
      const toStr = toDate ? format(toDate, "yyyy-MM-dd") : undefined
      const result = await fetchLeadsPorOrigem(fromStr, toStr)
      setData(result)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleBuscar = () => fetchData(from, to)

  const handleLast30Days = () => {
    const toDate = new Date()
    const fromDate = subDays(toDate, 30)
    setFrom(fromDate)
    setTo(toDate)
    fetchData(fromDate, toDate)
  }

  const handleLimpar = () => {
    setFrom(undefined)
    setTo(undefined)
    fetchData()
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <CardTitle className="text-2xl font-bold text-[#16255c]">
              Origem dos Leads
            </CardTitle>
            <CardDescription className="text-slate-500 mt-1">
              Passe o mouse sobre uma origem para destacar
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLast30Days}
            disabled={loading}
            className="text-xs self-start sm:self-center whitespace-nowrap"
          >
            Últimos 30 dias
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-40 justify-start text-sm">
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
              <Button variant="outline" className="w-40 justify-start text-sm">
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
            disabled={!from || !to || loading}
            className="bg-[#16255c] hover:bg-[#0f1a45] flex items-center gap-1.5"
          >
            <Search className="h-4 w-4" />
            {loading ? "Buscando…" : "Buscar"}
          </Button>

          {isFiltered && (
            <Button
              variant="destructive"
              onClick={handleLimpar}
              disabled={loading}
              className="flex gap-2 items-center text-white"
            >
              <Eraser className="h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {grouped.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-slate-400 text-sm">Sem dados disponíveis</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="h-75 w-full lg:w-[55%]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={grouped} cx="50%" cy="50%"
                    innerRadius={60} outerRadius={120}
                    paddingAngle={2} dataKey="total" nameKey="label"
                    labelLine={false} label={PieLabel}
                  >
                    {grouped.map((entry, i) => (
                      <Cell
                        key={entry.label}
                        fill={PALETTE[i % PALETTE.length]}
                        opacity={highlighted === null || highlighted === entry.label ? 1 : 0.3}
                        stroke="white" strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full lg:w-[45%] space-y-1.5">
              {grouped.map((item, i) => (
                <div
                  key={item.label}
                  onMouseEnter={() => setHighlighted(item.label)}
                  onMouseLeave={() => setHighlighted(null)}
                  className={`
                    flex items-center justify-between px-3 py-2 rounded-lg
                    border text-sm transition-all duration-150 cursor-default
                    ${highlighted === item.label
                      ? "border-[#16255c]/30 bg-white shadow-sm"
                      : "border-transparent"}
                  `}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                    />
                    <div className="min-w-0">
                      <span className="text-slate-700 font-medium block truncate">
                        {item.label}
                      </span>
                      {item.medium !== "—" && (
                        <span className="text-slate-400 text-xs truncate block">
                          {item.medium}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-slate-400 text-xs">{item.total}</span>
                    <span className="font-bold text-[#16255c] min-w-10 text-right">
                      {((item.total / total) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}