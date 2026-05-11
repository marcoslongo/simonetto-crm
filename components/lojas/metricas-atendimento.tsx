import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Clock, PhoneOff, Timer } from 'lucide-react'
import type { LojaServiceStats } from '@/lib/types-loja'

interface MetricasAtendimentoProps {
  data: LojaServiceStats
}

function formatTempo(minutos: number | null): string {
  if (minutos === null) return '—'
  if (minutos < 60) return `${Math.round(minutos)} min`
  const h = Math.floor(minutos / 60)
  const m = Math.round(minutos % 60)
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export function MetricasAtendimento({ data }: MetricasAtendimentoProps) {
  const taxaContato = data.perc_contatados ?? 0
  const taxaBarColor =
    taxaContato >= 70 ? 'bg-emerald-500' : taxaContato >= 40 ? 'bg-amber-400' : 'bg-red-400'

  const metrics = [
    {
      icon: CheckCircle2,
      label: 'Leads Contatados',
      value: data.leads_contatados,
      sub: `${taxaContato.toFixed(1)}% do total`,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
    },
    {
      icon: PhoneOff,
      label: 'Não Contatados',
      value: data.leads_nao_contatados,
      sub: `${(data.perc_nao_contatados ?? 0).toFixed(1)}% do total`,
      iconColor: 'text-red-500',
      iconBg: 'bg-red-100',
    },
    {
      icon: Clock,
      label: 'Tempo Médio de Resposta',
      value: formatTempo(data.tempo_medio_minutos),
      sub: data.tempo_medio_horas !== null ? `≈ ${data.tempo_medio_horas?.toFixed(1)}h` : 'sem dados',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      icon: Timer,
      label: 'Leads com Atendimento',
      value: `${taxaContato.toFixed(1)}%`,
      sub: `de ${data.total_leads} leads`,
      iconColor: 'text-[#16255c]',
      iconBg: 'bg-[#16255c]/10',
    },
  ]

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold text-[#16255c]">
          Métricas de Atendimento
        </CardTitle>
        <p className="text-sm text-slate-500">Desempenho no contato com os leads</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-slate-600">Taxa de contato</span>
            <span className="font-bold text-slate-800">{taxaContato.toFixed(1)}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-200">
            <div
              className={`h-3 rounded-full ${taxaBarColor} transition-all duration-500`}
              style={{ width: `${taxaContato}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {metrics.map(({ icon: Icon, label, value, sub, iconColor, iconBg }) => (
            <div
              key={label}
              className="rounded-xl bg-white shadow-sm p-3 flex items-start gap-3"
            >
              <div className={`p-2 rounded-lg ${iconBg} shrink-0`}>
                <Icon className={`h-4 w-4 ${iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 leading-tight">{label}</p>
                <p className="text-lg font-bold text-[#16255c] leading-tight">{value}</p>
                <p className="text-xs text-slate-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
