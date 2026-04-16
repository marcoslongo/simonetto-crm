'use client'

import Link from 'next/link'
import { Users, Zap, Clock, Flame, Thermometer, Snowflake } from 'lucide-react'

interface StatsCardsProps {
  totalLeads: number
  leadsHoje: number
  ultimaCaptura?: string
  quentes?: number
  mornos?: number
  frios?: number
}

export function StatsCards({
  totalLeads,
  leadsHoje,
  ultimaCaptura,
  quentes = 0,
  mornos = 0,
  frios = 0,
}: StatsCardsProps) {
  const hoje = new Date().toISOString().split('T')[0]
  const total = quentes + mornos + frios || 1

  const temperaturas = [
    {
      label: 'Quentes',
      value: quentes,
      icon: Flame,
      color: 'bg-red-500',
      bgLight: 'bg-red-50',
      textColor: 'text-[#16255c]',
      description: 'Alta intenção',
    },
    {
      label: 'Mornos',
      value: mornos,
      icon: Thermometer,
      color: 'bg-orange-400',
      bgLight: 'bg-orange-50',
      textColor: 'text-[#16255c]',
      description: 'Interesse moderado',
    },
    {
      label: 'Frios',
      value: frios,
      icon: Snowflake,
      color: 'bg-blue-400',
      bgLight: 'bg-blue-50',
      textColor: 'text-[#16255c]',
      description: 'Baixa intenção',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-border/50 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/50">
          <Link
            href="/admin/leads"
            className="group p-6 hover:bg-muted/30 transition-colors rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-[#16255c]">
                Total de Leads
              </span>
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="text-4xl font-bold text-[#16255c] tracking-tight">
              {totalLeads.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-[#16255c]/70 mt-1">
              Total acumulado
            </p>
          </Link>

          <Link
            href={`/admin/leads?from=${hoje}&to=${hoje}`}
            className="group p-6 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-[#16255c]">
                Leads Hoje
              </span>
              <div className="p-2 rounded-lg bg-accent/20 text-accent-foreground group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                <Zap className="h-4 w-4" />
              </div>
            </div>
            <p className="text-4xl font-bold text-[#16255c] tracking-tight">
              {leadsHoje.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-[#16255c]/70 mt-1">
              Novos leads hoje
            </p>
          </Link>

          <div className="p-6 rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-[#16255c]">
                Última Captura
              </span>
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-[#16255c] tracking-tight">
              {ultimaCaptura || '-'}
            </p>
            <p className="text-xs text-[#16255c]/70 mt-1">
              Horário do último lead
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
        <h3 className="text-sm font-semibold text-[#16255c] mb-5">
          Temperatura dos Leads
        </h3>

        <div className="space-y-4">
          {temperaturas.map((temp) => {
            const percentage = Math.round((temp.value / total) * 100)

            return (
              <div key={temp.label} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${temp.bgLight}`}>
                      <temp.icon className={`h-4 w-4 ${temp.textColor}`} />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[#16255c]">
                        {temp.label}
                      </span>
                      <span className="text-xs text-[#16255c]/70 ml-2">
                        {temp.description}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-[#16255c]">
                      {temp.value.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-xs text-[#16255c]/70 ml-2">
                      {percentage}%
                    </span>
                  </div>
                </div>

                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${temp.color} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}