import { requireAdmin } from '@/lib/auth'
import { getLojas } from '@/lib/api'
import { getLojaStats, getLojaLeads30Days, getLojaLeads12Months } from '@/lib/api-loja'
import { ChartLeads30Days } from '@/components/dashboard/chart-line-30-days'
import { ChartLeads12Months } from '@/components/dashboard/chart-leads-12-months'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { StatsCards } from '@/components/lojas/stats-cards'

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

  // Buscar dados da loja
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

  // Buscar estatísticas e dados de gráficos em paralelo
  const [stats, leads30Days, leads12Months] = await Promise.all([
    getLojaStats(id),
    getLojaLeads30Days(id),
    getLojaLeads12Months(id),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{loja.nome}</h2>
          <p className="text-muted-foreground">
            {loja.localizacao} • ID: {loja.id}
          </p>
        </div>
        <Link href="/admin/lojas">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>

      {/* Cards de Estatísticas */}
      <StatsCards stats={stats} />

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <ChartLeads30Days data={leads30Days} />
        <ChartLeads12Months data={leads12Months} />
      </div>
    </div>
  )
}