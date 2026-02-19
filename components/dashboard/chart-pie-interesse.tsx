"use client"

import { useState, useMemo } from "react"
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

interface RawInteresseItem {
  interesse: string
  total: number
}

interface ChartPieInteresseProps {
  data: RawInteresseItem[]
}

const PALETTE = [
  "#16255c",
  "#2563eb",
  "#3b82f6",
  "#60a5fa",
  "#93c5fd",
  "#1e40af",
  "#1d4ed8",
  "#0ea5e9",
  "#38bdf8",
]

function normalizeData(raw: RawInteresseItem[]): { interesse: string; total: number }[] {
  const map: Record<string, number> = {}

  for (const item of raw) {
    const ambientes = item.interesse
      .split(",")
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)

    for (const ambiente of ambientes) {
      map[ambiente] = (map[ambiente] ?? 0) + item.total
    }
  }

  return Object.entries(map)
    .map(([interesse, total]) => ({ interesse, total }))
    .sort((a, b) => b.total - a.total)
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { interesse, total } = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-2 text-sm">
      <p className="font-semibold text-[#16255c] capitalize">{interesse}</p>
      <p className="text-slate-600">
        <span className="font-bold text-[#16255c]">{total}</span> leads
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
    <text
      x={x} y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function ChartPieInteresse({ data }: ChartPieInteresseProps) {
  const normalized = useMemo(() => normalizeData(data), [data])
  const total = useMemo(() => normalized.reduce((s, i) => s + i.total, 0), [normalized])

  const [highlighted, setHighlighted] = useState<string | null>(null)

  if (normalized.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[#16255c]">
            Interesse por Ambiente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-75 flex items-center justify-center">
            <p className="text-slate-400 text-sm">Sem dados disponíveis</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold text-[#16255c]">
          Interesse por Ambiente
        </CardTitle>
        <CardDescription className="text-slate-500">
          Passe o mouse sobre um ambiente para destacar
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col lg:flex-row items-center gap-6">

          <div className="h-75 w-full lg:w-[55%]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={normalized}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="total"
                  nameKey="interesse"
                  labelLine={false}
                  label={PieLabel}
                >
                  {normalized.map((entry, i) => (
                    <Cell
                      key={entry.interesse}
                      fill={PALETTE[i % PALETTE.length]}
                      opacity={
                        highlighted === null || highlighted === entry.interesse
                          ? 1
                          : 0.3
                      }
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full lg:w-[45%] space-y-1.5">
            {normalized.map((item, i) => (
              <div
                key={item.interesse}
                onMouseEnter={() => setHighlighted(item.interesse)}
                onMouseLeave={() => setHighlighted(null)}
                className={`
                  flex items-center justify-between px-3 py-2 rounded-lg
                  border text-sm transition-all duration-150 cursor-default
                  ${highlighted === item.interesse
                    ? "border-[#16255c]/30 bg-white shadow-sm"
                    : "border-transparent"
                  }
                `}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                  />
                  <span className="capitalize text-slate-700 font-medium">
                    {item.interesse}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs">
                    {((item.total / total) * 100).toFixed(1)}%
                  </span>
                  <span className="font-bold text-[#16255c] min-w-[2rem] text-right">
                    {item.total}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}