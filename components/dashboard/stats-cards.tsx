'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Clock, TrendingUp, Zap } from 'lucide-react'

interface StatsCardsProps {
  totalLeads: number
  leadsHoje: number
  ultimaCaptura?: string
}

export function StatsCards({ totalLeads, leadsHoje, ultimaCaptura }: StatsCardsProps) {
  const hoje = new Date().toISOString().split('T')[0]

  const stats = [
    {
      title: 'Total de Leads',
      value: totalLeads.toLocaleString('pt-BR'),
      icon: Users,
      description: 'Total acumulado',
      link: `/admin/leads`,
    },
    {
      title: 'Leads Hoje',
      value: leadsHoje.toLocaleString('pt-BR'),
      icon: Zap,
      description: 'Novos leads hoje',
      link: `/admin/leads?from=${hoje}&to=${hoje}`,
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
      {stats.map((stat) => {
        const card = (
          <Card
            key={stat.title}
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-linear-to-br from-slate-50 to-slate-100 cursor-pointer"
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
        )

        return stat.link ? (
          <Link key={stat.title} href={stat.link}>
            {card}
          </Link>
        ) : (
          card
        )
      })}
    </div>
  )
}