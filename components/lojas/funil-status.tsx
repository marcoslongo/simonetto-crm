import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LojaStatusFunil } from '@/lib/types-loja'

interface FunilStatusProps {
  data: LojaStatusFunil
}

const STATUS_CONFIG = [
  {
    key: 'nao_atendido' as const,
    label: 'Não Atendido',
    color: 'bg-slate-400',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
  },
  {
    key: 'em_negociacao' as const,
    label: 'Em Negociação',
    color: 'bg-amber-400',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
  },
  {
    key: 'venda_realizada' as const,
    label: 'Venda Realizada',
    color: 'bg-emerald-500',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  {
    key: 'venda_nao_realizada' as const,
    label: 'Venda Não Realizada',
    color: 'bg-red-400',
    text: 'text-red-600',
    dot: 'bg-red-400',
  },
]

export function FunilStatus({ data }: FunilStatusProps) {
  const total = Object.values(data).reduce((s, v) => s + v, 0)

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold text-[#16255c]">
          Funil de Atendimentos
        </CardTitle>
        <p className="text-sm text-slate-500">{total} leads no total</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {STATUS_CONFIG.map(({ key, label, color, text, dot }) => {
          const value = data[key]
          const pct = total > 0 ? Math.round((value / total) * 100) : 0

          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                  <span className="font-medium text-slate-700">{label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-bold text-base ${text}`}>{value}</span>
                  <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200">
                <div
                  className={`h-2 rounded-full ${color} transition-all duration-500`}
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
