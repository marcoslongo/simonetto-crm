import { requireAuth } from '@/lib/auth'
import { KanbanColumns } from '@/components/leads/kanban-columns'
import { getMultiLojaLeads } from '@/lib/api-loja'
import { getLojas } from '@/lib/api'
import { WhatsAppSetupBanner } from '@/components/crm/whatsapp-setup-banner'

export const metadata = {
  title: 'Atendimentos | Noxus - Lead Ops',
  description: 'Gerencie os atendimentos da sua unidade',
}

interface PageProps {
  searchParams: Promise<{ loja_id?: string }>
}

export default async function CrmAtendimentoPage({ searchParams }: PageProps) {
  const user = await requireAuth()
  const { loja_id } = await searchParams

  const allLojaIds = user.loja_ids
  if (!allLojaIds.length) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Atendimentos</h2>
          <p className="text-muted-foreground mt-1">Nenhuma loja vinculada ao seu usuário.</p>
        </div>
      </div>
    )
  }

  // Filter to a specific loja if the URL param exists and the user has access
  const filteredId = loja_id ? Number(loja_id) : null
  const lojaIds = filteredId && allLojaIds.includes(filteredId) ? [filteredId] : allLojaIds

  const [{ leads, total: totalLeads }, lojasData] = await Promise.all([
    getMultiLojaLeads(lojaIds, 100),
    getLojas().catch(() => ({ success: false, lojas: [] })),
  ])

  const lojas = lojasData.lojas
    .filter(l => lojaIds.includes(Number(l.id)))
    .map(l => ({ id: Number(l.id), nome: l.nome }))

  const lojaFiltrada = filteredId
    ? lojasData.lojas.find(l => Number(l.id) === filteredId)
    : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Atendimentos</h2>
        <p className="text-muted-foreground mt-1">
          {lojaFiltrada
            ? `Kanban filtrado para: ${lojaFiltrada.nome}`
            : `Gerencie os leads da sua unidade: ${user.loja_nome || user.name}`}
        </p>
      </div>

      <WhatsAppSetupBanner />

      <KanbanColumns
        leads={leads}
        initialTotal={totalLeads}
        lojaIds={lojaIds}
        lojas={lojas}
        currentUser={{ id: user.id, nome: user.name }}
        isGerente={user.is_gerente}
      />
    </div>
  )
}
