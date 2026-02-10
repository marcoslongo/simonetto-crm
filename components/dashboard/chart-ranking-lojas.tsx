'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, AlertTriangle, Store } from 'lucide-react'

interface LojaRanking {
  ranking: number
  loja_id: string | number
  loja_nome: string
  total_leads: string | number
  tempo_medio_minutos: string
  tempo_medio_horas: string
}

interface ChartRankingLojasProps {
  data: LojaRanking[]
}

export function ChartRankingLojas({ data }: ChartRankingLojasProps) {
  const getRankingColor = (ranking: number) => {
    if (ranking === 1) return 'bg-red-50 border-red-200 text-red-900'
    if (ranking === 2) return 'bg-orange-50 border-orange-200 text-orange-900'
    if (ranking === 3) return 'bg-yellow-50 border-yellow-200 text-yellow-900'
    return 'bg-white border-gray-200 text-gray-700'
  }

  const getSeverityBadge = (ranking: number) => {
    if (ranking === 1) return { label: 'Crítico', variant: 'destructive' as const }
    if (ranking === 2) return { label: 'Alto', variant: 'default' as const }
    if (ranking === 3) return { label: 'Médio', variant: 'secondary' as const }
    return null
  }

  const formatTempo = (minutos: string) => {
    const mins = Number(minutos)
    if (mins < 60) {
      return `${mins.toFixed(0)}min`
    }
    const horas = Math.floor(mins / 60)
    const minutosRestantes = Math.floor(mins % 60)
    return `${horas}h ${minutosRestantes}min`
  }

  return (
    <Card className='w-full border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100'>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <CardTitle>Lojas com Maior Tempo de Atendimento</CardTitle>
        </div>
        <CardDescription>
          Ranking das lojas que precisam melhorar a velocidade de resposta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((loja) => {
            const severityBadge = getSeverityBadge(loja.ranking)
            return (
              <div
                key={loja.loja_id}
                className={`flex items-center gap-3 p-3 rounded-md border transition-colors hover:bg-gray-50 ${getRankingColor(loja.ranking)}`}
              >
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-white border font-semibold text-sm">
                    {loja.ranking}º
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Store className="h-3.5 w-3.5 opacity-60" />
                    <h3 className="font-medium text-sm truncate">
                      {loja.loja_nome}
                    </h3>
                  </div>
                  <p className="text-xs opacity-70">
                    {Number(loja.total_leads)} leads atendidos
                  </p>
                </div>

                {severityBadge && (
                  <div className="flex-shrink-0">
                    <Badge variant={severityBadge.variant} className="text-xs">
                      {severityBadge.label}
                    </Badge>
                  </div>
                )}

                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center gap-1.5 justify-end mb-0.5">
                    <Clock className="h-3.5 w-3.5 opacity-60" />
                    <span className="font-semibold text-sm">
                      {formatTempo(loja.tempo_medio_minutos)}
                    </span>
                  </div>
                  <p className="text-xs opacity-70">
                    {Number(loja.tempo_medio_horas).toFixed(1)}h média
                  </p>
                </div>
              </div>
            )
          })}

          {data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Store className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum dado disponível</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}