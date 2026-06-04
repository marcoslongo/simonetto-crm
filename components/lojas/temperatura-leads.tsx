import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flame, Thermometer, Snowflake } from 'lucide-react'
import type { LojaClassificacao } from '@/lib/types-loja'

interface TemperaturaLeadsProps {
  data: LojaClassificacao
}

const TEMP_CONFIG = [
  {
    key: 'quente' as const,
    label: 'Quente',
    icon: Flame,
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconColor: 'text-red-500',
    iconBg: 'bg-red-100',
    bar: 'bg-red-500',
    value: 'text-red-600',
    desc: 'Alta intenção de compra',
  },
  {
    key: 'morno' as const,
    label: 'Morno',
    icon: Thermometer,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-100',
    bar: 'bg-amber-400',
    value: 'text-amber-600',
    desc: 'Demonstra interesse',
  },
  {
    key: 'frio' as const,
    label: 'Frio',
    icon: Snowflake,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-100',
    bar: 'bg-blue-400',
    value: 'text-blue-600',
    desc: 'Sem contexto definido',
  },
]

export function TemperaturaLeads({ data }: TemperaturaLeadsProps) {
  const total = (data.frio ?? 0) + (data.morno ?? 0) + (data.quente ?? 0)

  return (
    <Card className="border-0 card-surface-elevated">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold text-[#16255c]">
          Temperatura dos Leads
        </CardTitle>
        <p className="text-sm text-slate-500 tabular-nums">{total} leads classificados</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {TEMP_CONFIG.map(({ key, label, icon: Icon, bg, border, iconColor, iconBg, bar, value, desc }) => {
          const count = data[key] ?? 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0

          return (
            <div
              key={key}
              className={`rounded-xl border p-3 ${bg} ${border} space-y-2`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
                    <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 text-sm leading-none">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-extrabold tabular-nums ${value}`}>{count}</p>
                  <p className="text-xs font-medium text-slate-400 tabular-nums">{pct}%</p>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/70">
                <div
                  className={`h-1.5 rounded-full ${bar} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
