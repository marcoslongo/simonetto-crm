import { requireAdmin } from '@/lib/auth'
import { getLojas } from '@/lib/api'
import { getLojaStats, getLojaLeads30Days, getLojaLeads12Months } from '@/lib/api-loja'
import { ChartLeads12Months } from '@/components/dashboard/chart-leads-12-months'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { StatsCards } from '@/components/lojas/stats-cards'
import { LojaInfoCard } from '@/components/lojas/loja-info-card'
import { ChartLeads30Days } from '@/components/lojas/chart-line-30-days'

interface LojaPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: 'Loja | Admin CRM',
  description: 'Detalhes da loja',
}

export default async function LojaPage({ params }: LojaPageProps) {
  await requireAdmin()

  const { id } = await params

  const lojasResponse = await getLojas()
  if (!lojasResponse.success) {
    throw new Error('Falha ao carregar lojas')
  }

  const loja = lojasResponse.lojas.find((l) => l.id === id)

  if (!loja) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Loja não encontrada</h2>
        <Link href="/admin/lojas">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>
    )
  }

  const [stats, leads30Days, leads12Months] = await Promise.all([
    getLojaStats(id),
    getLojaLeads30Days(id),
    getLojaLeads12Months(id),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">{loja.nome}</h2>
          <p className="text-muted-foreground mt-1">
            Visualização detalhada da loja
          </p>
        </div>
        <Link href="/admin/lojas">
          <Button variant="outline" className="shadow-sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>
      <div>
        <LojaInfoCard loja={loja} />
      </div>
      <div>
        <StatsCards stats={stats} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <ChartLeads30Days data={leads30Days} />
        <ChartLeads12Months data={leads12Months} />
      </div>
    </div>
  )
}