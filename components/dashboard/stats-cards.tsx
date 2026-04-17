'use client'

import Link from 'next/link'
import { Users, Zap, Clock, Flame, Thermometer, Snowflake } from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, Cell } from 'recharts'

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

  const temperaturas = [
    {
      label: 'Quentes',
      value: quentes,
      icon: Flame,
      fill: '#ef4444',
      bgLight: 'bg-red-50',
      description: 'Alta intenção',
    },
    {
      label: 'Mornos',
      value: mornos,
      icon: Thermometer,
      fill: '#fb923c',
      bgLight: 'bg-orange-50',
      description: 'Interesse moderado',
    },
    {
      label: 'Frios',
      value: frios,
      icon: Snowflake,
      fill: '#60a5fa',
      bgLight: 'bg-blue-50',
      description: 'Baixa intenção',
    },
  ]

  const chartData = temperaturas.map((t) => ({
    name: t.label,
    value: t.value,
    fill: t.fill,
  }))

  const chartConfig = {
    value: { label: 'Leads' },
    Quentes: { label: 'Quentes', color: '#ef4444' },
    Mornos: { label: 'Mornos', color: '#fb923c' },
    Frios: { label: 'Frios', color: '#60a5fa' },
  }

  return (
    <div className="space-y-6">
      <div className="shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-border/50">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/50">
          <Link
            href="/admin/leads"
            className="group p-6 hover:bg-muted/30 transition-colors rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-[#16255c]">Total de Leads</span>
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="text-4xl font-bold text-[#16255c] tracking-tight">
              {totalLeads.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-[#16255c]/70 mt-1">Total acumulado</p>
          </Link>

          <Link
            href={`/admin/leads?from=${hoje}&to=${hoje}`}
            className="group p-6 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-[#16255c]">Leads Hoje</span>
              <div className="p-2 rounded-lg bg-accent/20 text-accent-foreground group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                <Zap className="h-4 w-4" />
              </div>
            </div>
            <p className="text-4xl font-bold text-[#16255c] tracking-tight">
              {leadsHoje.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-[#16255c]/70 mt-1">Novos leads hoje</p>
          </Link>

          <div className="p-6 rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-[#16255c]">Última Captura</span>
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-[#16255c] tracking-tight">
              {ultimaCaptura || '-'}
            </p>
            <p className="text-xs text-[#16255c]/70 mt-1">Horário do último lead</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
        <h3 className="text-sm font-semibold text-[#16255c] mb-5">Temperatura dos Leads</h3>

        <div className="flex flex-col gap-2 mb-4">
          {temperaturas.map((temp) => (
            <div key={temp.label} className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${temp.bgLight}`}>
                <temp.icon className="h-4 w-4" style={{ color: temp.fill }} />
              </div>
              <span className="text-sm font-medium text-[#16255c] w-16">{temp.label}</span>
              <span className="text-xs text-[#16255c]/60">{temp.description}</span>
              <span className="ml-auto text-sm font-bold text-[#16255c]">
                {temp.value.toLocaleString('pt-BR')}
              </span>
            </div>
          ))}
        </div>

        <ChartContainer config={chartConfig} className="h-[120px] w-full">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={64}
              tick={{ fontSize: 12, fill: '#16255c', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <ChartTooltip
              content={<ChartTooltipContent hideLabel />}
              cursor={{ fill: 'rgba(22,37,92,0.05)' }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={24}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  )
}