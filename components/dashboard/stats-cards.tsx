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
    },
    {
      title: 'Leads Hoje',
      value: leadsHoje.toLocaleString('pt-BR'),
      icon: Zap,
      description: 'Novos leads hoje',
    },
    {
      title: 'Última Captura',
      value: ultimaCaptura || '-',
      icon: Clock,
      description: 'Horário do último lead',
    },
  ]

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
      {stats.map((stat) => (
        <Card 
          key={stat.title} 
          className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-linear-to-br from-slate-50 to-slate-100"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-600">
              {stat.title}
            </CardTitle>
            <div className="bg-[#0e1627] p-2.5 rounded-xl shadow-md">
              <stat.icon className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#0e1627] mb-1">
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