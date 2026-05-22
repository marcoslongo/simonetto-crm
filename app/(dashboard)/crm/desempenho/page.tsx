import { requireAuth } from '@/lib/auth'
import { getMultiLojaLeads30Days, getMultiLojaLeads12Months, getMultiLojaServiceStats } from '@/lib/api-loja'
import { ChartLeads12Months } from '@/components/dashboard/chart-leads-12-months'
import { ChartLeads30Days } from '@/components/lojas/chart-line-30-days'
import { MetricasAtendimento } from '@/components/lojas/metricas-atendimento'

export const metadata = {
  title: 'Desempenho | Noxus - Lead Ops',
  description: 'Evolução e métricas de atendimento da sua unidade',
}

export default async function DesempenhoPage() {
  const user = await requireAuth()

  const isLoja = user.role === 'loja'
  const lojaIds = isLoja ? user.loja_ids : []

  const [leads30Days, leads12Months, serviceStats] = await Promise.all([
    getMultiLojaLeads30Days(lojaIds),
    getMultiLojaLeads12Months(lojaIds),
    getMultiLojaServiceStats(lojaIds),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Desempenho</h2>
        <p className="text-muted-foreground mt-1">
          Evolução de captação da sua unidade
        </p>
      </div>

      <ChartLeads30Days data={leads30Days} lojaId={lojaIds[0]} />

      <ChartLeads12Months data={leads12Months} lojaId={lojaIds[0]} />
    </div>
  )
}
