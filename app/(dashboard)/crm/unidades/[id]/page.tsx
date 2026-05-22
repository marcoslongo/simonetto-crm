import { requireLoja, canAccessLoja } from '@/lib/auth'
import { getLojas } from '@/lib/api'
import {
  getLojaStats,
  getLojaLeads30Days,
  getLojaLeads12Months,
  getLojaStatusFunil,
  getLojaClassificacao,
  getLojaServiceStats,
} from '@/lib/api-loja'
import { ChartLeads12Months } from '@/components/dashboard/chart-leads-12-months'
import { ChartLeads30Days } from '@/components/lojas/chart-line-30-days'
import { StatsCards } from '@/components/lojas/stats-cards'
import { LojaInfoCard } from '@/components/lojas/loja-info-card'
import { FunilStatus } from '@/components/lojas/funil-status'
import { TemperaturaLeads } from '@/components/lojas/temperatura-leads'
import { MetricasAtendimento } from '@/components/lojas/metricas-atendimento'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'

interface UnidadePageProps {
  params: Promise<{ id: string }>
}

export default async function CrmUnidadePage({ params }: UnidadePageProps) {
  const user = await requireLoja()

  if (user.loja_ids.length <= 1) redirect('/crm')

  const { id } = await params

  if (!canAccessLoja(user, Number(id))) redirect('/crm/unidades')

  const lojasData = await getLojas().catch(() => ({ success: false, lojas: [] }))
  const loja = lojasData.lojas.find(l => l.id === id)

  if (!loja) notFound()

  const [stats, leads30Days, leads12Months, statusFunil, classificacao, serviceStats] =
    await Promise.all([
      getLojaStats(id),
      getLojaLeads30Days(id),
      getLojaLeads12Months(id),
      getLojaStatusFunil(id),
      getLojaClassificacao(id),
      getLojaServiceStats(id),
    ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">{loja.nome}</h2>
          <p className="text-muted-foreground mt-1">Visualização detalhada da unidade</p>
        </div>
        <Link href="/crm/unidades">
          <Button variant="outline" className="shadow-sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>

      <LojaInfoCard loja={loja} />

      <StatsCards stats={stats} />

      <div className="grid gap-6 md:grid-cols-3">
        <MetricasAtendimento data={serviceStats} />
        <FunilStatus data={statusFunil} />
        <TemperaturaLeads data={classificacao} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ChartLeads30Days data={leads30Days} lojaId={id} />
        <ChartLeads12Months data={leads12Months} lojaId={id} />
      </div>
    </div>
  )
}
