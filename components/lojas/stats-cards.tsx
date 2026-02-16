import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Users, Calendar, Clock } from 'lucide-react'
import type { LojaStats } from '@/lib/types-loja'

interface StatsCardsProps {
  stats: LojaStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const statsData = [
    {
      title: 'Total de Leads',
      value: stats.total.toLocaleString('pt-BR'),
      icon: Users,
      description: 'Todos os leads',
    },
    {
      title: 'Leads Hoje',
      value: stats.hoje.toLocaleString('pt-BR'),
      icon: Clock,
      description: 'Novos leads hoje',
    },
    {
      title: 'Últimos 7 dias',
      value: stats.semana.toLocaleString('pt-BR'),
      icon: Calendar,
      description: 'Esta semana',
    },
    {
      title: 'Últimos 30 dias',
      value: stats.mes.toLocaleString('pt-BR'),
      icon: TrendingUp,
      description: 'Este mês',
    },
  ]

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => (
        <Card 
          key={stat.title} 
          className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-linear-to-br from-slate-50 to-slate-100"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-600">
              {stat.title}
            </CardTitle>
            <div className="bg-[#16255c] p-2.5 rounded-xl shadow-md">
              <stat.icon className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#16255c] mb-1">
              {stat.value}
            </div>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}