"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Smartphone, Monitor, Tablet, HelpCircle } from "lucide-react"
import type { DeviceItem } from "@/lib/leads-service"

interface ChartDeviceBreakdownProps {
  data: DeviceItem[]
}

const DEVICE_CONFIG: Record<string, { color: string; Icon: React.ElementType }> = {
  Mobile:       { color: "#2563eb", Icon: Smartphone },
  Desktop:      { color: "#16255c", Icon: Monitor },
  Tablet:       { color: "#60a5fa", Icon: Tablet },
  Desconhecido: { color: "#cbd5e1", Icon: HelpCircle },
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { device_type, total, pct } = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-2 text-sm">
      <p className="font-semibold text-[#16255c]">{device_type}</p>
      <p className="text-slate-600">
        <span className="font-bold text-[#16255c]">{total}</span> leads ({pct}%)
      </p>
    </div>
  )
}

export function ChartDeviceBreakdown({ data }: ChartDeviceBreakdownProps) {
  const total = data.reduce((s, d) => s + d.total, 0)
  const hasData = total > 0

  if (!hasData) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[#16255c]">Dispositivos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-slate-400 text-sm">Sem dados de dispositivo disponíveis</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-[#16255c]">Dispositivos</CardTitle>
        <CardDescription className="text-slate-500">
          Tipo de dispositivo detectado via User-Agent no momento do cadastro
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="h-56 w-full lg:w-[55%]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="total"
                  nameKey="device_type"
                >
                  {data.map((entry) => (
                    <Cell
                      key={entry.device_type}
                      fill={DEVICE_CONFIG[entry.device_type]?.color ?? "#94a3b8"}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full lg:w-[45%] space-y-3">
            {data.map((item) => {
              const cfg = DEVICE_CONFIG[item.device_type] ?? { color: "#94a3b8", Icon: HelpCircle }
              const Icon = cfg.Icon
              return (
                <div key={item.device_type} className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: `${cfg.color}18` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-[#16255c]">
                        {item.device_type}
                      </span>
                      <span className="text-sm font-bold text-[#16255c]">
                        {item.pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${item.pct}%`, backgroundColor: cfg.color }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{item.total} leads</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
