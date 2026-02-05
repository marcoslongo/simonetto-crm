import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserPlus, Clock, TrendingUp, Zap } from 'lucide-react'

interface StatsCardsProps {
  totalLeads: number
  leadsHoje: number
  ultimaCaptura?: string
}

export function StatsCards({ totalLeads, leadsHoje, ultimaCaptura }: StatsCardsProps) {
  const stats = [
    {
      title: 'Total de Leads',
      value: totalLeads.toLocaleString('pt-BR'),
      icon: Users,
      description: 'Total acumulado',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      textColor: 'text-blue-600',
    },
    {
      title: 'Leads Hoje',
      value: leadsHoje.toLocaleString('pt-BR'),
      icon: Zap,
      description: 'Novos leads hoje',
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-50 to-teal-50',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
      textColor: 'text-emerald-600',
    },
    {
      title: 'Última Captura',
      value: ultimaCaptura || '-',
      icon: Clock,
      description: 'Horário do último lead',
      gradient: 'from-violet-500 to-purple-500',
      bgGradient: 'from-violet-50 to-purple-50',
      iconBg: 'bg-gradient-to-br from-violet-500 to-purple-500',
      textColor: 'text-violet-600',
    },
  ]

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
      {stats.map((stat) => (
        <Card 
          key={stat.title} 
          className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br ${stat.bgGradient}`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600">
              {stat.title}
            </CardTitle>
            <div className={`${stat.iconBg} p-2.5 rounded-xl shadow-md`}>
              <stat.icon className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stat.textColor} mb-1`}>
              {stat.value}
            </div>
            <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}