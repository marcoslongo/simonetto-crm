'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  UserPlus, MessageSquare, CheckCircle2, XCircle, LayoutGrid,
} from "lucide-react"
import { LeadsStatusModal } from './leads-status-modal'
import type { KanbanColuna } from '@/lib/types'
import { cn } from '@/lib/utils'
import { DEFAULT_KANBAN_COLUNAS } from '@/lib/kanban-config'

interface KanbanStatsCardsProps {
  data: Record<string, number>
  colunas?: KanbanColuna[]
  description?: string
  from?: string
  to?: string
  currentUserId?: number
  isGerente?: boolean
  isSupervisor?: boolean
  isAdmin?: boolean
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

const COLOR_STYLES: Record<string, { icon: string; bg: string; badge: string; accent: string }> = {
  amber:   { icon: 'text-amber-600',   bg: 'bg-amber-50',   badge: 'bg-amber-100 text-amber-700',   accent: '#f59e0b' },
  blue:    { icon: 'text-blue-600',    bg: 'bg-blue-50',    badge: 'bg-blue-100 text-blue-700',    accent: '#3b82f6' },
  emerald: { icon: 'text-emerald-600', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700', accent: '#10b981' },
  red:     { icon: 'text-red-600',     bg: 'bg-red-50',     badge: 'bg-red-100 text-red-700',     accent: '#ef4444' },
  rose:    { icon: 'text-rose-600',    bg: 'bg-rose-50',    badge: 'bg-rose-100 text-rose-700',    accent: '#f43f5e' },
  slate:   { icon: 'text-slate-600',   bg: 'bg-slate-50',   badge: 'bg-slate-100 text-slate-700',   accent: '#64748b' },
  purple:  { icon: 'text-purple-600',  bg: 'bg-purple-50',  badge: 'bg-purple-100 text-purple-700',  accent: '#a855f7' },
  indigo:  { icon: 'text-indigo-600',  bg: 'bg-indigo-50',  badge: 'bg-indigo-100 text-indigo-700',  accent: '#6366f1' },
  teal:    { icon: 'text-teal-600',    bg: 'bg-teal-50',    badge: 'bg-teal-100 text-teal-700',    accent: '#14b8a6' },
  orange:  { icon: 'text-orange-600',  bg: 'bg-orange-50',  badge: 'bg-orange-100 text-orange-700',  accent: '#f97316' },
  pink:    { icon: 'text-pink-600',    bg: 'bg-pink-50',    badge: 'bg-pink-100 text-pink-700',    accent: '#ec4899' },
  violet:  { icon: 'text-violet-600',  bg: 'bg-violet-50',  badge: 'bg-violet-100 text-violet-700',  accent: '#8b5cf6' },
  cyan:    { icon: 'text-cyan-600',    bg: 'bg-cyan-50',    badge: 'bg-cyan-100 text-cyan-700',    accent: '#06b6d4' },
  gray:    { icon: 'text-gray-600',    bg: 'bg-gray-50',    badge: 'bg-gray-100 text-gray-700',    accent: '#6b7280' },
}


function gridClass(count: number): string {
  if (count <= 2) return 'grid-cols-2'
  if (count <= 4) return 'grid-cols-2 lg:grid-cols-4'
  if (count <= 6) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
  return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
}

export function KanbanStatsCards({
  data,
  colunas,
  description = 'Acompanhamento em tempo real da jornada de vendas',
  from,
  to,
  currentUserId,
  isGerente,
  isSupervisor,
  isAdmin,
}: KanbanStatsCardsProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  const stats = colunas ?? DEFAULT_KANBAN_COLUNAS
  const selected = stats.find(s => s.slug === selectedStatus)
  const total = stats.reduce((s, c) => s + (data[c.slug] ?? 0), 0)

  return (
    <>
      <div className="card-surface-elevated p-6 animate-section">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#16255c]">Status do Funil</h2>
            <p className="text-sm text-slate-500 mt-0.5">{description}</p>
          </div>
          <div className="shrink-0 rounded-full bg-[#16255c]/5 px-3 py-1">
            <span className="text-xs font-semibold text-[#16255c]/60 tabular-nums">
              {total.toLocaleString('pt-BR')} leads
            </span>
          </div>
        </div>

        <div className={cn('grid gap-3', gridClass(stats.length))}>
          {stats.map(stat => {
            const colorStyle = COLOR_STYLES[stat.cor] ?? COLOR_STYLES.gray
            const Icon = getIcon(stat.slug)
            const value = data[stat.slug] ?? 0
            const pct = total > 0 ? Math.round(value / total * 100) : 0

            return (
              <button
                key={stat.slug}
                onClick={() => setSelectedStatus(stat.slug)}
                className={cn(
                  'group relative overflow-hidden rounded-xl border border-slate-200/70 bg-white p-4',
                  'text-left transition-all duration-200',
                  'hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16255c]/30',
                )}
              >
                {/* Color accent line top */}
                <div
                  className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl transition-all duration-200 group-hover:h-1"
                  style={{ backgroundColor: colorStyle.accent }}
                />

                <div className="flex items-start justify-between gap-2 mt-1">
                  <p className="text-xs font-semibold text-slate-500 leading-tight">{stat.label}</p>
                  <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', colorStyle.bg)}>
                    <Icon className={cn('h-3.5 w-3.5', colorStyle.icon)} />
                  </div>
                </div>

                <p className="mt-2 text-2xl font-extrabold tracking-tight text-[#16255c] tabular-nums">
                  {value.toLocaleString('pt-BR')}
                </p>

                <div className="mt-2 flex items-center justify-between">
                  <div className="h-1 flex-1 rounded-full bg-slate-100 mr-2">
                    <div
                      className="h-1 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: colorStyle.accent }}
                    />
                  </div>
                  <span className="text-[10px] font-bold tabular-nums" style={{ color: colorStyle.accent }}>
                    {pct}%
                  </span>
                </div>

                <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Ver leads →
                </p>
              </button>
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
          currentUserId={currentUserId}
          isGerente={isGerente}
          isSupervisor={isSupervisor}
          isAdmin={isAdmin}
        />
      )}
    </>
  )
}
