'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  UserPlus, MessageSquare, CheckCircle2, XCircle, LayoutGrid,
} from "lucide-react"
import { LeadsStatusModal } from './leads-status-modal'
import type { KanbanColuna } from '@/lib/types'

interface KanbanStatsCardsProps {
  data: Record<string, number>
  colunas?: KanbanColuna[]
  description?: string
  from?: string
  to?: string
}

const SLUG_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  nao_atendido:        UserPlus,
  em_negociacao:       MessageSquare,
  venda_realizada:     CheckCircle2,
  venda_nao_realizada: XCircle,
}

function getIcon(slug: string): React.ComponentType<{ className?: string }> {
  return SLUG_ICONS[slug] ?? LayoutGrid
}

const COLOR_STYLES: Record<string, { icon: string; bg: string; badge: string }> = {
  amber:   { icon: 'text-amber-500',   bg: 'bg-amber-100',   badge: 'bg-amber-100 text-amber-700'   },
  blue:    { icon: 'text-blue-500',    bg: 'bg-blue-100',    badge: 'bg-blue-100 text-blue-700'    },
  emerald: { icon: 'text-emerald-500', bg: 'bg-emerald-100', badge: 'bg-emerald-100 text-emerald-700' },
  red:     { icon: 'text-red-500',     bg: 'bg-red-100',     badge: 'bg-red-100 text-red-700'     },
  rose:    { icon: 'text-rose-500',    bg: 'bg-rose-100',    badge: 'bg-rose-100 text-rose-700'    },
  slate:   { icon: 'text-slate-500',   bg: 'bg-slate-100',   badge: 'bg-slate-100 text-slate-700'   },
  purple:  { icon: 'text-purple-500',  bg: 'bg-purple-100',  badge: 'bg-purple-100 text-purple-700'  },
  indigo:  { icon: 'text-indigo-500',  bg: 'bg-indigo-100',  badge: 'bg-indigo-100 text-indigo-700'  },
  teal:    { icon: 'text-teal-500',    bg: 'bg-teal-100',    badge: 'bg-teal-100 text-teal-700'    },
  orange:  { icon: 'text-orange-500',  bg: 'bg-orange-100',  badge: 'bg-orange-100 text-orange-700'  },
  pink:    { icon: 'text-pink-500',    bg: 'bg-pink-100',    badge: 'bg-pink-100 text-pink-700'    },
  violet:  { icon: 'text-violet-500',  bg: 'bg-violet-100',  badge: 'bg-violet-100 text-violet-700'  },
  cyan:    { icon: 'text-cyan-500',    bg: 'bg-cyan-100',    badge: 'bg-cyan-100 text-cyan-700'    },
  gray:    { icon: 'text-gray-500',    bg: 'bg-gray-100',    badge: 'bg-gray-100 text-gray-700'    },
}

const DEFAULT_COLUNAS: KanbanColuna[] = [
  { id: 0, loja_id: 0, slug: 'nao_atendido',        label: 'Não Atendidos',     cor: 'slate',   ordem: 0, fixo: 1 },
  { id: 0, loja_id: 0, slug: 'em_negociacao',       label: 'Em Negociação',     cor: 'blue',    ordem: 1, fixo: 1 },
  { id: 0, loja_id: 0, slug: 'venda_realizada',     label: 'Vendas Realizadas', cor: 'emerald', ordem: 2, fixo: 1 },
  { id: 0, loja_id: 0, slug: 'venda_nao_realizada', label: 'Vendas Perdidas',   cor: 'rose',    ordem: 3, fixo: 1 },
]

export function KanbanStatsCards({
  data,
  colunas,
  description = 'Acompanhamento em tempo real da jornada de vendas de todas as lojas',
  from,
  to,
}: KanbanStatsCardsProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  const stats = colunas ?? DEFAULT_COLUNAS
  const selected = stats.find(s => s.slug === selectedStatus)

  return (
    <>
      <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-lg bg-linear-to-br from-slate-50 to-slate-100">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-[#16255c]">Status do Funil</h2>
          <p className="flex items-center gap-2 text-slate-600">{description}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map(stat => {
            const colorStyle = COLOR_STYLES[stat.cor] ?? COLOR_STYLES.gray
            const Icon = getIcon(stat.slug)
            return (
              <Card
                key={stat.slug}
                onClick={() => setSelectedStatus(stat.slug)}
                className="overflow-hidden border-none shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium text-[#16255c]/70">
                    {stat.label}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${colorStyle.bg}`}>
                    <Icon className={`h-4 w-4 ${colorStyle.icon}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#16255c]">
                    {(data[stat.slug] ?? 0).toLocaleString('pt-BR')}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">
                    Ver leads →
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {selected && (
        <LeadsStatusModal
          open={!!selectedStatus}
          onOpenChange={open => { if (!open) setSelectedStatus(null) }}
          status={selected.slug}
          statusLabel={selected.label}
          statusBadgeClass={COLOR_STYLES[selected.cor]?.badge ?? COLOR_STYLES.gray.badge}
          from={from}
          to={to}
        />
      )}
    </>
  )
}
