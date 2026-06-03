import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { KanbanColuna } from '@/lib/types'

interface FunilStatusProps {
  data: Record<string, number>
  colunas?: KanbanColuna[]
}

const COLOR_BARS: Record<string, { color: string; text: string; dot: string }> = {
  amber:   { color: 'bg-amber-400',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  blue:    { color: 'bg-blue-500',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  emerald: { color: 'bg-emerald-500', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  red:     { color: 'bg-red-400',     text: 'text-red-600',     dot: 'bg-red-400'     },
  rose:    { color: 'bg-rose-400',    text: 'text-rose-600',    dot: 'bg-rose-400'    },
  slate:   { color: 'bg-slate-400',   text: 'text-slate-600',   dot: 'bg-slate-400'   },
  purple:  { color: 'bg-purple-400',  text: 'text-purple-700',  dot: 'bg-purple-400'  },
  indigo:  { color: 'bg-indigo-400',  text: 'text-indigo-700',  dot: 'bg-indigo-400'  },
  teal:    { color: 'bg-teal-400',    text: 'text-teal-700',    dot: 'bg-teal-400'    },
  orange:  { color: 'bg-orange-400',  text: 'text-orange-700',  dot: 'bg-orange-400'  },
  pink:    { color: 'bg-pink-400',    text: 'text-pink-700',    dot: 'bg-pink-400'    },
  violet:  { color: 'bg-violet-400',  text: 'text-violet-700',  dot: 'bg-violet-400'  },
  cyan:    { color: 'bg-cyan-400',    text: 'text-cyan-700',    dot: 'bg-cyan-400'    },
  gray:    { color: 'bg-gray-400',    text: 'text-gray-600',    dot: 'bg-gray-400'    },
}

const DEFAULT_COLUNAS: KanbanColuna[] = [
  { id: 0, loja_id: 0, slug: 'nao_atendido',        label: 'Não Atendido',       cor: 'slate',   ordem: 0, fixo: 1 },
  { id: 0, loja_id: 0, slug: 'em_negociacao',       label: 'Em Negociação',      cor: 'amber',   ordem: 1, fixo: 1 },
  { id: 0, loja_id: 0, slug: 'venda_realizada',     label: 'Venda Realizada',    cor: 'emerald', ordem: 2, fixo: 1 },
  { id: 0, loja_id: 0, slug: 'venda_nao_realizada', label: 'Venda Não Realizada', cor: 'red',    ordem: 3, fixo: 1 },
]

export function FunilStatus({ data, colunas }: FunilStatusProps) {
  const columns = colunas ?? DEFAULT_COLUNAS
  const total = columns.reduce((s, col) => s + (data[col.slug] ?? 0), 0)

  return (
    <Card className="border-0 shadow-lg bg-linear-to-br from-slate-50 to-slate-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold text-[#16255c]">
          Funil de Atendimentos
        </CardTitle>
        <p className="text-sm text-slate-500">{total} leads no total</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {columns.map(col => {
          const bars = COLOR_BARS[col.cor] ?? COLOR_BARS.gray
          const value = data[col.slug] ?? 0
          const pct = total > 0 ? Math.round((value / total) * 100) : 0

          return (
            <div key={col.slug} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${bars.dot}`} />
                  <span className="font-medium text-slate-700">{col.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-bold text-base ${bars.text}`}>{value}</span>
                  <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200">
                <div
                  className={`h-2 rounded-full ${bars.color} transition-all duration-500`}
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
