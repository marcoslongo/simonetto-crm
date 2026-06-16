import { requireAuth } from '@/lib/auth'
import { PosVendaKanban } from '@/components/pos-venda/pos-venda-kanban'

export const metadata = {
  title: 'Pós-Venda | Noxus - Lead Ops',
  description: 'Acompanhe o processo operacional de cada projeto',
}

export default async function PosVendaPage() {
  const user = await requireAuth()

  const lojaIds = user.loja_ids
  if (!lojaIds.length) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Pós-Venda</h2>
          <p className="text-muted-foreground mt-1">Nenhuma loja vinculada ao seu usuário.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Pós-Venda</h2>
        <p className="text-muted-foreground mt-1">
          Acompanhe o andamento operacional dos projetos — da medição à montagem final.
        </p>
      </div>

      <PosVendaKanban
        lojaIds={lojaIds}
        currentUser={{ id: user.id, nome: user.name }}
        isGerente={user.is_gerente}
      />
    </div>
  )
}
