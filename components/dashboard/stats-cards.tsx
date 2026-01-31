import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserPlus, Clock, TrendingUp } from 'lucide-react'

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
      icon: UserPlus,
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
    <div className="grid gap-4 grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
