import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus, Users, Calendar, Clock } from 'lucide-react'
import type { LojaStats } from '@/lib/types-loja'

interface StatsCardsProps {
  stats: LojaStats
  sublabel?: string
}

function Delta({ current, previous, label }: { current: number; previous?: number; label: string }) {
  if (previous === undefined) return null
  const diff = current - previous
  if (diff === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-400">
        <Minus className="h-3 w-3" />
        igual ao {label}
      </span>
    )
  }
  const isPositive = diff > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? '+' : ''}{diff} vs {label}
    </span>
  )
}

export function StatsCards({ stats, sublabel = 'Todos os leads' }: StatsCardsProps) {
  const cards = [
    { title: 'Total de Leads',   value: stats.total.toLocaleString('pt-BR'),  icon: Users,     delta: null },
    { title: 'Leads Hoje',       value: stats.hoje.toLocaleString('pt-BR'),   icon: Clock,     delta: <Delta current={stats.hoje}   previous={stats.ontem}           label="ontem" /> },
    { title: 'Últimos 7 dias',   value: stats.semana.toLocaleString('pt-BR'), icon: Calendar,  delta: <Delta current={stats.semana} previous={stats.semana_anterior} label="semana passada" /> },
    { title: 'Últimos 30 dias',  value: stats.mes.toLocaleString('pt-BR'),    icon: TrendingUp, delta: <Delta current={stats.mes}   previous={stats.mes_anterior}    label="mês anterior" /> },
  ]

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ title, value, icon: Icon, delta }) => (
        <Card
          key={title}
          className="animate-card border border-slate-200/70 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {title}
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#16255c]/8">
              <Icon className="h-4 w-4 text-[#16255c]" strokeWidth={2} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-[#16255c] tabular-nums tracking-tight mb-1">
              {value}
            </div>
            {delta ?? (
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {sublabel}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
