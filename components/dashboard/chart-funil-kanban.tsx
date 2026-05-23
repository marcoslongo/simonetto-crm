"use client"

import {
  FunnelChart, Funnel, LabelList, Tooltip, Cell, ResponsiveContainer,
} from "recharts"
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card"
import { Clock, Handshake, CircleCheckBig, XCircle } from "lucide-react"

export interface FunilKanbanData {
  nao_atendido: number
  em_negociacao: number
  venda_realizada: number
  venda_nao_realizada: number
}

const STAGES = [
  { key: "nao_atendido",    label: "Não Atendido",   fill: "#f59e0b", Icon: Clock },
  { key: "em_negociacao",   label: "Em Negociação",  fill: "#3b82f6", Icon: Handshake },
  { key: "venda_realizada", label: "Venda Realizada", fill: "#10b981", Icon: CircleCheckBig },
]

const LOST = { key: "venda_nao_realizada", label: "Não Realizada", fill: "#ef4444", Icon: XCircle }

function FunnelLabel({ x, y, width, height, name, value }: {
  x: number; y: number; width: number; height: number; name: string; value: number
}) {
  if (!width || width < 80) return null
  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      textAnchor="middle"
      dominantBaseline="middle"
      fill="white"
      fontSize={13}
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

export function ChartFunilKanban({
  nao_atendido,
  em_negociacao,
  venda_realizada,
  venda_nao_realizada,
}: FunilKanbanData) {
  const total = nao_atendido || 1

  const counts: Record<string, number> = {
    nao_atendido,
    em_negociacao,
    venda_realizada,
    venda_nao_realizada,
  }

  const data = STAGES.map(s => ({
    name: s.label,
    value: counts[s.key],
    fill: s.fill,
    pct: Math.round(counts[s.key] / total * 100),
  }))

  const convRate = nao_atendido > 0
    ? Math.round(venda_realizada / nao_atendido * 100)
    : 0

  const allStats = [...STAGES, LOST].map(s => ({
    ...s,
    value: counts[s.key],
    pct: Math.round(counts[s.key] / total * 100),
  }))

  return (
    <Card className="border-0 shadow-lg bg-linear-to-br from-slate-50 to-slate-100">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-[#16255c]">
              Funil de Conversão
            </CardTitle>
            <CardDescription className="text-slate-500 mt-0.5">
              {nao_atendido} leads no total · taxa de conversão{" "}
              <span className="font-semibold text-emerald-600">{convRate}%</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip content={<CustomTooltip />} />
              <Funnel dataKey="value" data={data} isAnimationActive lastShapeType="rectangle">
                <LabelList
                  dataKey="value"
                  position="center"
                  content={(props: any) => (
                    <FunnelLabel
                      x={props.x}
                      y={props.y}
                      width={props.width}
                      height={props.height}
                      name={props.name ?? ""}
                      value={props.value ?? 0}
                    />
                  )}
                />
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>

        {/* Stats por etapa */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 border-t pt-4">
          {allStats.map(s => (
            <div key={s.key} className="flex flex-col items-center text-center gap-1">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${s.fill}20` }}
              >
                <s.Icon className="h-4 w-4" style={{ color: s.fill }} />
              </div>
              <p className="text-xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500 leading-tight">{s.label}</p>
              <p className="text-xs font-semibold" style={{ color: s.fill }}>
                {s.pct}%
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
