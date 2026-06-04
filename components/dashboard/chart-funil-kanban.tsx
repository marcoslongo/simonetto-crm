"use client"

import {
  FunnelChart, Funnel, LabelList, Tooltip, Cell, ResponsiveContainer,
} from "recharts"
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card"
import {
  Clock, Handshake, CircleCheckBig, XCircle, LayoutGrid,
} from "lucide-react"
import type { KanbanColuna } from "@/lib/types"

interface ChartFunilKanbanProps {
  counts: Record<string, number>
  colunas: KanbanColuna[]
}

const SLUG_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  nao_atendido:        Clock,
  em_negociacao:       Handshake,
  venda_realizada:     CircleCheckBig,
  venda_nao_realizada: XCircle,
}

const COLOR_MAP: Record<string, string> = {
  amber:   "#f59e0b",
  blue:    "#3b82f6",
  emerald: "#10b981",
  red:     "#ef4444",
  rose:    "#f43f5e",
  slate:   "#94a3b8",
  purple:  "#a855f7",
  indigo:  "#6366f1",
  teal:    "#14b8a6",
  orange:  "#f97316",
  pink:    "#ec4899",
  violet:  "#8b5cf6",
  cyan:    "#06b6d4",
  gray:    "#6b7280",
}

const TERMINAL_SLUGS = new Set(["venda_realizada", "venda_nao_realizada"])

function FunnelLabel({ x, y, width, height, name, value }: {
  x: number; y: number; width: number; height: number; name: string; value: number
}) {
  if (!width || width < 70) return null
  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      textAnchor="middle"
      dominantBaseline="middle"
      fill="white"
      fontSize={12}
      fontWeight={600}
    >
      {name} · {value}
    </text>
  )
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-[#16255c]">{d.name}</p>
      <p className="text-slate-600">
        <span className="font-bold text-base" style={{ color: d.fill }}>{d.value}</span>{" "}
        leads <span className="text-slate-400">({d.pct}%)</span>
      </p>
    </div>
  )
}

export function ChartFunilKanban({ counts, colunas }: ChartFunilKanbanProps) {
  const funnelColunas = colunas.filter(c => !TERMINAL_SLUGS.has(c.slug))
  const terminalColunas = colunas.filter(c => TERMINAL_SLUGS.has(c.slug))
  const allColunas = [...funnelColunas, ...terminalColunas]

  const totalEntrada = funnelColunas.reduce((s, c) => s + (counts[c.slug] ?? 0), 0)
  const totalBase = funnelColunas.length > 0 ? (counts[funnelColunas[0].slug] ?? 1) || 1 : 1

  const vendaRealizada = counts["venda_realizada"] ?? 0
  const totalAll = Object.values(counts).reduce((s, v) => s + v, 0)
  const convRate = totalAll > 0 ? Math.round(vendaRealizada / totalAll * 100) : 0

  const funnelData = funnelColunas.map(c => ({
    name:  c.label,
    value: counts[c.slug] ?? 0,
    fill:  COLOR_MAP[c.cor] ?? "#94a3b8",
    pct:   totalBase > 0 ? Math.round((counts[c.slug] ?? 0) / totalBase * 100) : 0,
  }))

  return (
    <Card className="border-0 shadow-lg bg-linear-to-br from-slate-50 to-slate-100">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-[#16255c]">Funil de Conversão</CardTitle>
            <CardDescription className="text-slate-500 mt-0.5">
              {totalAll} leads · taxa de conversão{" "}
              <span className="font-semibold text-emerald-600">{convRate}%</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {funnelData.length > 0 ? (
          <div style={{ height: Math.max(160, funnelData.length * 52) }}>
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip content={<CustomTooltip />} />
                <Funnel dataKey="value" data={funnelData} isAnimationActive lastShapeType="rectangle">
                  <LabelList
                    dataKey="value"
                    position="center"
                    content={(props: any) => (
                      <FunnelLabel
                        x={props.x} y={props.y}
                        width={props.width} height={props.height}
                        name={props.name ?? ""} value={props.value ?? 0}
                      />
                    )}
                  />
                  {funnelData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-slate-400 text-sm">
            Nenhum dado disponível
          </div>
        )}

        {/* Stats por etapa — todas as colunas */}
        <div className={`grid gap-3 mt-4 border-t pt-4 ${
          allColunas.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' :
          allColunas.length <= 6 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
        }`}>
          {allColunas.map(c => {
            const Icon = SLUG_ICONS[c.slug] ?? LayoutGrid
            const fill = COLOR_MAP[c.cor] ?? "#94a3b8"
            const value = counts[c.slug] ?? 0
            const pct = totalAll > 0 ? Math.round(value / totalAll * 100) : 0
            return (
              <div key={c.slug} className="flex flex-col items-center text-center gap-1">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${fill}20` }}
                >
                  <Icon className="h-4 w-4" style={{ color: fill }} />
                </div>
                <p className="text-xl font-bold text-slate-800 tabular-nums">{value}</p>
                <p className="text-[10px] text-slate-500 leading-tight px-1">{c.label}</p>
                <p className="text-xs font-semibold" style={{ color: fill }}>{pct}%</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
