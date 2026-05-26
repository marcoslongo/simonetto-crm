'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus, MessageSquare, CheckCircle2, XCircle } from "lucide-react"
import { LeadsStatusModal } from './leads-status-modal'

interface KanbanStatsCardsProps {
  data: {
    nao_atendido: number
    em_negociacao: number
    venda_realizada: number
    venda_nao_realizada: number
  }
  description?: string
  from?: string
  to?: string
}

const STATS = [
  {
    key: 'nao_atendido' as const,
    title: "Não Atendidos",
    icon: UserPlus,
    color: "text-slate-500",
    bg: "bg-slate-100",
    badgeClass: "bg-slate-100 text-slate-700",
  },
  {
    key: 'em_negociacao' as const,
    title: "Em Negociação",
    icon: MessageSquare,
    color: "text-blue-500",
    bg: "bg-blue-100",
    badgeClass: "bg-blue-100 text-blue-700",
  },
  {
    key: 'venda_realizada' as const,
    title: "Vendas Realizadas",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-100",
    badgeClass: "bg-emerald-100 text-emerald-700",
  },
  {
    key: 'venda_nao_realizada' as const,
    title: "Vendas Perdidas",
    icon: XCircle,
    color: "text-rose-500",
    bg: "bg-rose-100",
    badgeClass: "bg-rose-100 text-rose-700",
  },
]

export function KanbanStatsCards({
  data,
  description = 'Acompanhamento em tempo real da jornada de vendas de todas as lojas',
  from,
  to,
}: KanbanStatsCardsProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  const selected = STATS.find(s => s.key === selectedStatus)

  return (
    <>
      <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-lg bg-linear-to-br from-slate-50 to-slate-100">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-[#16255c]">Status do Funil</h2>
          <p className="flex items-center gap-2 text-slate-600">{description}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STATS.map(stat => (
            <Card
              key={stat.key}
              onClick={() => setSelectedStatus(stat.key)}
              className="overflow-hidden border-none shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-[#16255c]/70">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#16255c]">
                  {data[stat.key].toLocaleString('pt-BR')}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">
                  Ver leads →
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {selected && (
        <LeadsStatusModal
          open={!!selectedStatus}
          onOpenChange={open => { if (!open) setSelectedStatus(null) }}
          status={selected.key}
          statusLabel={selected.title}
          statusBadgeClass={selected.badgeClass}
          from={from}
          to={to}
        />
      )}
    </>
  )
}
