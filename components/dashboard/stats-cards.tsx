'use client'

import Link from 'next/link'
import { Users, Zap, Clock } from 'lucide-react'

interface StatsCardsProps {
  totalLeads: number
  leadsHoje: number
  ultimaCaptura?: string
}

export function StatsCards({
  totalLeads,
  leadsHoje,
  ultimaCaptura,
}: StatsCardsProps) {
  const hoje = new Date().toISOString().split('T')[0]

  return (
    <div className="shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-border/50">
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/50">

        <Link
          href="/admin/leads"
          className="group p-6 hover:bg-muted/30 transition-colors rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-[#16255c]">Total de Leads</span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-4xl font-bold text-[#16255c]">
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
            <div className="p-2 rounded-lg bg-accent/20 text-accent-foreground group-hover:bg-accent transition-colors">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <p className="text-4xl font-bold text-[#16255c]">
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
          <p className="text-2xl font-semibold text-[#16255c]">
            {ultimaCaptura || '-'}
          </p>
          <p className="text-xs text-[#16255c]/70 mt-1">Horário do último lead</p>
        </div>

      </div>
    </div>
  )
}