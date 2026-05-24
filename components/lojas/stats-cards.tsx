import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus, Users, Calendar, Clock } from 'lucide-react'
import type { LojaStats } from '@/lib/types-loja'

interface StatsCardsProps {
  stats: LojaStats
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
      {isPositive
        ? <TrendingUp className="h-3 w-3" />
        : <TrendingDown className="h-3 w-3" />}
      {isPositive ? '+' : ''}{diff} vs {label}
    </span>
  )
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total de Leads',
      value: stats.total.toLocaleString('pt-BR'),
      icon: Users,
      delta: null,
    },
    {
      title: 'Leads Hoje',
      value: stats.hoje.toLocaleString('pt-BR'),
      icon: Clock,
      delta: <Delta current={stats.hoje} previous={stats.ontem} label="ontem" />,
    },
    {
      title: 'Últimos 7 dias',
      value: stats.semana.toLocaleString('pt-BR'),
      icon: Calendar,
      delta: <Delta current={stats.semana} previous={stats.semana_anterior} label="semana passada" />,
    },
    {
      title: 'Últimos 30 dias',
      value: stats.mes.toLocaleString('pt-BR'),
      icon: TrendingUp,
      delta: <Delta current={stats.mes} previous={stats.mes_anterior} label="mês anterior" />,
    },
  ]

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ title, value, icon: Icon, delta }) => (
        <Card
          key={title}
          className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-linear-to-br from-slate-50 to-slate-100"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-600">
              {title}
            </CardTitle>
            <div className="bg-[#16255c] p-2.5 rounded-xl shadow-md">
              <Icon className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#16255c] mb-1.5">
              {value}
            </div>
            {delta ?? (
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Todos os leads
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
