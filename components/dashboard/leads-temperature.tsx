'use client'

import { Flame, Thermometer, Snowflake } from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, Cell } from 'recharts'

interface LeadsTemperatureProps {
  quentes?: number
  mornos?: number
  frios?: number
}

export function LeadsTemperature({
  quentes = 0,
  mornos = 0,
  frios = 0,
}: LeadsTemperatureProps) {
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
    <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#16255c]">
          Temperatura dos Leads
        </h2>
        <p className="text-slate-600">
          Classificação baseada no nível de engajamento
        </p>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {temperaturas.map((temp) => (
          <div key={temp.label} className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${temp.bgLight}`}>
              <temp.icon className="h-4 w-4" style={{ color: temp.fill }} />
            </div>
            <span className="text-sm font-medium text-[#16255c] w-16">
              {temp.label}
            </span>
            <span className="text-xs text-[#16255c]/60">
              {temp.description}
            </span>
            <span className="ml-auto text-sm font-bold text-[#16255c]">
              {temp.value.toLocaleString('pt-BR')}
            </span>
          </div>
        ))}
      </div>

      <ChartContainer config={chartConfig} className="h-[120px] w-full">
        <BarChart layout="vertical" data={chartData}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={64}
            tick={{ fontSize: 12, fill: '#16255c', fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}