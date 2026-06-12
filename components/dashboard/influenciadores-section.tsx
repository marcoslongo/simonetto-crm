'use client'

import { useState, useMemo } from 'react'
import { Users, TrendingUp, ShoppingCart, XCircle, Clock, CalendarDays, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { InfluenciadorItem } from '@/lib/leads-service'

interface Props {
  data: InfluenciadorItem[]
}

function fmt(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-start gap-3">
      <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', color ?? 'bg-muted')}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function FunnelBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value} <span className="text-muted-foreground">({pct}%)</span></span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function InfluenciadoresSection({ data }: Props) {
  const [selected, setSelected] = useState<string>('')

  const influenciador = useMemo(
    () => data.find(d => d.utm_source === selected) ?? null,
    [data, selected]
  )

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            Influenciadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
            <Users className="h-8 w-8 opacity-20" />
            <p className="text-sm">Nenhum lead com utm_source registrado no período</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            Influenciadores
            <Badge variant="secondary" className="ml-1 text-xs">{data.length} fontes</Badge>
          </CardTitle>

          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Selecione um influenciador…" />
            </SelectTrigger>
            <SelectContent>
              {data.map(d => (
                <SelectItem key={d.utm_source} value={d.utm_source}>
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{d.utm_source}</span>
                    <span className="text-muted-foreground text-xs">({d.total} leads)</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      {!influenciador ? (
        <CardContent>
          <div className="space-y-2">
            {data.map((d, i) => (
              <button
                key={`${d.utm_source}-${i}`}
                type="button"
                onClick={() => setSelected(d.utm_source)}
                className="w-full text-left rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50 hover:border-[#16255c]/30 group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{d.utm_source}</span>
                      <Badge variant="secondary" className="text-[10px]">{d.total} leads</Badge>
                      {d.conversao_pct > 0 && (
                        <Badge className="text-[10px] bg-green-100 text-green-700 hover:bg-green-100">
                          {d.conversao_pct}% conv.
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#16255c]/70 transition-all duration-700"
                        style={{ width: `${Math.round((d.total / data[0].total) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-[#16255c] transition-colors shrink-0">
                    Ver →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      ) : (
        <CardContent className="space-y-6">
          <button
            type="button"
            onClick={() => setSelected('')}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            ← Voltar para todos
          </button>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={Users} label="Total de leads" value={influenciador.total} color="bg-blue-100 text-blue-700" />
            <StatCard
              icon={ShoppingCart}
              label="Vendas realizadas"
              value={influenciador.vendas}
              sub={`${influenciador.conversao_pct}% de conversão`}
              color="bg-green-100 text-green-700"
            />
            <StatCard icon={TrendingUp} label="Em negociação" value={influenciador.em_negociacao} color="bg-amber-100 text-amber-700" />
            <StatCard icon={XCircle} label="Perdidos" value={influenciador.perdidos} color="bg-red-100 text-red-700" />
          </div>

          <div className="rounded-xl border p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Funil</p>
            <FunnelBar label="Não atendido"   value={influenciador.nao_atendido}  total={influenciador.total} color="bg-slate-400" />
            <FunnelBar label="Em negociação"  value={influenciador.em_negociacao} total={influenciador.total} color="bg-amber-400" />
            <FunnelBar label="Venda realizada" value={influenciador.vendas}        total={influenciador.total} color="bg-green-500" />
            <FunnelBar label="Perdidos"        value={influenciador.perdidos}      total={influenciador.total} color="bg-red-400" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border p-3 flex items-center gap-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Primeiro lead</p>
                <p className="text-sm font-semibold">{fmt(influenciador.primeiro_lead)}</p>
              </div>
            </div>
            <div className="rounded-xl border p-3 flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Último lead</p>
                <p className="text-sm font-semibold">{fmt(influenciador.ultimo_lead)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
