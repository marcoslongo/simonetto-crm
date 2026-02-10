import { requireAdmin } from '@/lib/auth'
import { getLojas } from '@/lib/api'
import { getLeadsStats } from '@/lib/leads-service'
import type { Loja } from '@/lib/types'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
    return <p>Loja não encontrada</p>
  }

  const stats = await getLeadsStats(parseInt(loja.id, 10))

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{loja.nome}</h2>
      <p className="text-muted-foreground">ID: {loja.id}</p>

      <Card>
        <CardHeader>
          <CardTitle>Estatísticas de Leads</CardTitle>
          <CardDescription>
            Total de leads: {stats.total} • Leads hoje: {stats.today}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Localização: {loja.localizacao || '-'}</p>
          <p>Email: {loja.emails?.[0]?.email || '-'}</p>
        </CardContent>
      </Card>
    </div>
  )
}