import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth'
import { StatsCardsSkeleton, ChartCardSkeleton } from '@/components/dashboard/dashboard-skeletons'
import { StatusStatsSection } from '@/components/dashboard/dashboard-sections'
import { DateFilterClient } from '@/components/ui/date-filter-client'
import { getLojasServer } from '@/lib/server-lojas-service'
import { getVnrStats, getConversaoPorLoja } from '@/lib/api-loja'
import { ChartVnrMotivos } from '@/components/dashboard/chart-vnr-motivos'
import { ChartConversaoPorLoja } from '@/components/dashboard/chart-conversao-por-loja'
import Link from 'next/link'

export const metadata = { title: 'Conversão | Noxus' }

interface ConversaoPageProps {
  searchParams: Promise<{ from?: string; to?: string }>
}

async function ConversaoResumoAlerta({ from, to }: { from?: string; to?: string }) {
  const data = await getConversaoPorLoja([], from, to)
  const comDados = data.filter(l => l.total_leads >= 3)
  if (!comDados.length) return null

  const avg = comDados.reduce((s, l) => s + l.taxa_conversao, 0) / comDados.length
  const abaixo = comDados.filter(l => l.taxa_conversao < avg)
  const abaixo50pct = comDados.filter(l => l.taxa_conversao < avg * 0.5)
  const acima = comDados.length - abaixo.length

  const topBottom = comDados.sort((a, b) => a.taxa_conversao - b.taxa_conversao).slice(0, 3)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Acima da média</p>
        <p className="text-3xl font-bold text-emerald-700">{acima}</p>
        <p className="text-xs text-emerald-600 mt-1">
          de {comDados.length} lojas · média {avg.toFixed(1)}%
        </p>
      </div>
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Abaixo da média</p>
        <p className="text-3xl font-bold text-amber-700">{abaixo.length}</p>
        <p className="text-xs text-amber-600 mt-1">
          precisam de atenção
        </p>
      </div>
      <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4">
        <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Conversão crítica</p>
        <p className="text-3xl font-bold text-red-700">{abaixo50pct.length}</p>
        <p className="text-xs text-red-600 mt-1">
          abaixo de 50% da média
        </p>
      </div>
      {topBottom.length > 0 && (
        <div className="sm:col-span-3 rounded-2xl border border-red-200 bg-red-50/40 px-4 py-3">
          <p className="text-xs font-semibold text-red-700 mb-2">Lojas com menor conversão</p>
          <div className="flex flex-wrap gap-2">
            {topBottom.map(l => (
              <Link key={l.loja_id} href={`/admin/lojas/${l.loja_id}`}
                className="flex items-center gap-1.5 rounded-lg bg-white border border-red-200 px-2.5 py-1 text-xs hover:border-red-400 transition-colors">
                <span className="font-medium text-slate-700 truncate max-w-32">{l.loja_nome}</span>
                <span className="font-bold text-red-600">{l.taxa_conversao}%</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

async function ConversaoChart({ from, to }: { from?: string; to?: string }) {
  const data = await getConversaoPorLoja([], from, to)
  return <ChartConversaoPorLoja data={data} />
}

async function VnrMotivosWrapper() {
  const [vnrStats, lojas] = await Promise.all([getVnrStats(), getLojasServer()])
  return (
    <ChartVnrMotivos
      initialData={vnrStats}
      isAdmin={true}
      lojas={lojas.map(l => ({ id: Number(l.id), nome: l.nome }))}
    />
  )
}

export default async function ConversaoPage({ searchParams }: ConversaoPageProps) {
  await requireAdmin()
  const { from, to } = await searchParams

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Conversão</h2>
        <p className="text-muted-foreground mt-1">Análise do funil e taxas de conversão</p>
      </div>

      <DateFilterClient />

      <Suspense key={`alerta-${from}-${to}`} fallback={<div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />}>
        <ConversaoResumoAlerta from={from} to={to} />
      </Suspense>

      <Suspense key={`${from}-${to}`} fallback={<StatsCardsSkeleton />}>
        <StatusStatsSection from={from} to={to} />
      </Suspense>

      <Suspense fallback={<ChartCardSkeleton height="h-80" />}>
        <VnrMotivosWrapper />
      </Suspense>

      <Suspense key={`chart-${from}-${to}`} fallback={<ChartCardSkeleton height="h-80" />}>
        <ConversaoChart from={from} to={to} />
      </Suspense>

    </div>
  )
}
