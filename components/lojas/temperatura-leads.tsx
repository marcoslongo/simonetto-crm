import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LojaClassificacao } from '@/lib/types-loja'

interface TemperaturaLeadsProps {
  data: LojaClassificacao
}

const TEMP_CONFIG = [
  {
    key: 'quente' as const,
    label: 'Quente',
    emoji: '🔥',
    bg: 'bg-red-50',
    border: 'border-red-200',
    bar: 'bg-red-500',
    value: 'text-red-600',
    desc: 'Alta intenção de compra',
  },
  {
    key: 'morno' as const,
    label: 'Morno',
    emoji: '🌡️',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    bar: 'bg-amber-400',
    value: 'text-amber-600',
    desc: 'Demonstra interesse',
  },
  {
    key: 'frio' as const,
    label: 'Frio',
    emoji: '❄️',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    bar: 'bg-blue-400',
    value: 'text-blue-600',
    desc: 'Sem contexto definido',
  },
]

export function TemperaturaLeads({ data }: TemperaturaLeadsProps) {
  const total = (data.frio ?? 0) + (data.morno ?? 0) + (data.quente ?? 0)

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold text-[#16255c]">
          Temperatura dos Leads
        </CardTitle>
        <p className="text-sm text-slate-500">{total} leads classificados</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {TEMP_CONFIG.map(({ key, label, emoji, bg, border, bar, value, desc }) => {
          const count = data[key] ?? 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0

          return (
            <div
              key={key}
              className={`rounded-xl border p-3 ${bg} ${border} space-y-2`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{emoji}</span>
                  <div>
                    <p className="font-semibold text-slate-700 text-sm leading-none">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${value}`}>{count}</p>
                  <p className="text-xs text-slate-400">{pct}%</p>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/60">
                <div
                  className={`h-1.5 rounded-full ${bar} transition-all duration-500`}
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
