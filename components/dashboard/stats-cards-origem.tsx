'use client'

import Link from 'next/link'
import { Building2, Store, Users, Zap } from 'lucide-react'

interface OrigemStats {
  total: number
  today: number
}

interface StatsCardsOrigemProps {
  industria: OrigemStats
  proprio: OrigemStats
}

export function StatsCardsOrigem({ industria, proprio }: StatsCardsOrigemProps) {
  const hoje = new Date().toISOString().split('T')[0]

  return (
    <div className="shadow-lg bg-linear-to-br from-slate-50 to-slate-100 rounded-2xl border border-border/50">
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">

        {/* Indústria */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-slate-200 text-slate-600">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-[#16255c] uppercase tracking-wide">
              Indústria
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/admin/leads?origem=industria"
              className="group p-4 rounded-xl bg-white border border-border/50 hover:bg-muted/30 transition-colors shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[#16255c]/70">Total</span>
                <div className="p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Users className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#16255c]">
                {industria.total.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-[#16255c]/60 mt-1">Acumulado</p>
            </Link>

            <Link
              href={`/admin/leads?origem=industria&from=${hoje}&to=${hoje}`}
              className="group p-4 rounded-xl bg-white border border-border/50 hover:bg-muted/30 transition-colors shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[#16255c]/70">Hoje</span>
                <div className="p-1.5 rounded-md bg-accent/20 text-accent-foreground group-hover:bg-accent transition-colors">
                  <Zap className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#16255c]">
                {industria.today.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-[#16255c]/60 mt-1">Novos hoje</p>
            </Link>
          </div>
        </div>

        {/* Próprio (Lojistas) */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-slate-200 text-slate-600">
              <Store className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-[#16255c] uppercase tracking-wide">
              Lojistas (Próprio)
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/admin/leads?origem=proprio"
              className="group p-4 rounded-xl bg-white border border-border/50 hover:bg-muted/30 transition-colors shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[#16255c]/70">Total</span>
                <div className="p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Users className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#16255c]">
                {proprio.total.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-[#16255c]/60 mt-1">Acumulado</p>
            </Link>

            <Link
              href={`/admin/leads?origem=proprio&from=${hoje}&to=${hoje}`}
              className="group p-4 rounded-xl bg-white border border-border/50 hover:bg-muted/30 transition-colors shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[#16255c]/70">Hoje</span>
                <div className="p-1.5 rounded-md bg-accent/20 text-accent-foreground group-hover:bg-accent transition-colors">
                  <Zap className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#16255c]">
                {proprio.today.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-[#16255c]/60 mt-1">Novos hoje</p>
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
