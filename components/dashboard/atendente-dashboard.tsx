'use client'

import { AlertTriangle, Bell, CheckCircle2, Flame, TrendingDown, TrendingUp, Users, Zap } from 'lucide-react'
import Link from 'next/link'
import type { AtendanteStats } from '@/lib/api-loja'
import type { KanbanColuna } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AtendenteDashboardProps {
  stats: AtendanteStats
  userName: string
  colunas: KanbanColuna[]
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  alert,
  href,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'emerald' | 'amber' | 'red' | 'slate'
  alert?: boolean
  href?: string
}) {
  const colors = {
    blue:    { bg: 'bg-blue-50',    icon: 'bg-blue-100 text-blue-600',    value: 'text-blue-700',    border: 'border-blue-200' },
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', value: 'text-emerald-700', border: 'border-emerald-200' },
    amber:   { bg: 'bg-amber-50',   icon: 'bg-amber-100 text-amber-600',   value: 'text-amber-700',   border: 'border-amber-200' },
    red:     { bg: 'bg-red-50',     icon: 'bg-red-100 text-red-600',       value: 'text-red-700',     border: 'border-red-200' },
    slate:   { bg: 'bg-slate-50',   icon: 'bg-slate-100 text-slate-600',   value: 'text-[#16255c]',   border: 'border-slate-200' },
  }
  const c = colors[color]

  const inner = (
    <div className={cn(
      'relative flex items-start gap-3 rounded-2xl border p-4 transition-all duration-200',
      c.bg, c.border,
      href && 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
      alert && 'ring-2 ring-offset-1',
      alert && color === 'red'   && 'ring-red-400',
      alert && color === 'amber' && 'ring-amber-400',
    )}>
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', c.icon)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 leading-tight">{label}</p>
        <p className={cn('text-2xl font-bold tabular-nums leading-tight mt-0.5', c.value)}>{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {alert && Number(value) > 0 && (
        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
      )}
    </div>
  )

  if (href) return <Link href={href}>{inner}</Link>
  return inner
}

function UrgencyItem({
  icon: Icon,
  color,
  label,
  count,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  color: string
  label: string
  count: number
  description: string
}) {
  if (count === 0) return null
  return (
    <div className={cn(
      'flex items-center gap-3 rounded-xl border px-4 py-3',
      color,
    )}>
      <Icon className="h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">{label}</p>
        <p className="text-[11px] opacity-70 leading-tight">{description}</p>
      </div>
      <span className="shrink-0 text-lg font-bold tabular-nums">{count}</span>
    </div>
  )
}

export function AtendenteDashboard({ stats, userName, colunas }: AtendenteDashboardProps) {
  const totalUrgencias = stats.sla_nao_atendido + stats.sla_negociacao +
    stats.followups_atrasados + stats.leads_quentes_sem_contato

  const statusAtivos = colunas
    .filter(c => c.slug !== 'venda_realizada' && c.slug !== 'venda_nao_realizada')
    .map(c => ({ label: c.label, count: stats.por_status[c.slug] ?? 0 }))
    .filter(s => s.count > 0)

  const firstName = userName.split(' ')[0]

  return (
    <div className="space-y-5 animate-section">
      {/* Header pessoal */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-[#16255c]">Olá, {firstName} 👋</h3>
          <p className="text-sm text-slate-500">Veja como está seu dia</p>
        </div>
        {totalUrgencias > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs font-bold text-red-600">
              {totalUrgencias} {totalUrgencias === 1 ? 'urgência' : 'urgências'}
            </span>
          </div>
        )}
      </div>

      {/* KPIs pessoais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Meus leads ativos"
          value={stats.ativos}
          sub={`${stats.total_atribuidos} no total`}
          icon={Users}
          color="slate"
          href="/crm/atendimentos"
        />
        <StatCard
          label="Minha conversão"
          value={`${stats.taxa_conversao}%`}
          sub={`${stats.venda_realizada} vendas · ${stats.venda_nao_realizada} perdas`}
          icon={stats.taxa_conversao >= 20 ? TrendingUp : TrendingDown}
          color={stats.taxa_conversao >= 20 ? 'emerald' : 'amber'}
        />
        <StatCard
          label="Follow-ups hoje"
          value={stats.followups_hoje + stats.followups_atrasados}
          sub={stats.followups_atrasados > 0 ? `${stats.followups_atrasados} atrasado${stats.followups_atrasados > 1 ? 's' : ''}` : 'em dia'}
          icon={Bell}
          color={stats.followups_atrasados > 0 ? 'amber' : 'blue'}
          alert={stats.followups_atrasados > 0}
          href="/crm/calendario"
        />
        <StatCard
          label="Leads recebidos hoje"
          value={stats.leads_hoje}
          sub="novos na sua carteira"
          icon={Zap}
          color="blue"
        />
      </div>

      {/* Urgências — só renderiza se existir algo */}
      {totalUrgencias > 0 && (
        <div className="rounded-2xl border border-red-100 bg-red-50/40 p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-red-500 flex items-center gap-1.5 mb-3">
            <AlertTriangle className="h-3.5 w-3.5" />
            Precisa de atenção agora
          </p>
          <UrgencyItem
            icon={AlertTriangle}
            color="border-red-200 bg-red-50 text-red-700"
            label="Leads fora do SLA (não atendidos)"
            count={stats.sla_nao_atendido}
            description="Sem primeiro contato há mais de 2h"
          />
          <UrgencyItem
            icon={AlertTriangle}
            color="border-orange-200 bg-orange-50 text-orange-700"
            label="Leads parados há mais de 3 dias"
            count={stats.sla_negociacao}
            description="Sem movimentação em etapas ativas"
          />
          <UrgencyItem
            icon={Flame}
            color="border-rose-200 bg-rose-50 text-rose-700"
            label="Leads quentes sem contato recente"
            count={stats.leads_quentes_sem_contato}
            description="Alta intenção — não deixe esfriar"
          />
          <UrgencyItem
            icon={Bell}
            color="border-amber-200 bg-amber-50 text-amber-700"
            label="Follow-ups atrasados"
            count={stats.followups_atrasados}
            description="Comprometimentos não cumpridos"
          />
        </div>
      )}

      {/* Mini funil pessoal por status */}
      {statusAtivos.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Minha distribuição por etapa
          </p>
          <div className="space-y-2">
            {statusAtivos.map(({ label, count }) => {
              const pct = stats.ativos > 0 ? Math.round(count / stats.ativos * 100) : 0
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 text-xs text-slate-600 truncate">{label}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#16255c] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-xs font-bold text-[#16255c] tabular-nums">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Estado vazio — sem leads atribuídos */}
      {stats.total_atribuidos === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 py-10 text-slate-400">
          <CheckCircle2 className="h-8 w-8 opacity-30" />
          <p className="text-sm font-medium">Nenhum lead atribuído a você ainda</p>
          <p className="text-xs">Leads não atendidos estão disponíveis no Kanban</p>
        </div>
      )}
    </div>
  )
}
