import { requireAuth } from '@/lib/auth'
import { CrmContent } from '@/components/relatorios/crm-content'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Relatórios | Noxus',
}

export default async function CrmRelatoriosPage() {
  const user = await requireAuth()

  if (user.role !== 'loja' || !user.loja_ids.length) {
    redirect('/crm')
  }

  const lojaId = user.loja_ids[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Relatórios</h2>
        <p className="text-muted-foreground mt-1">
          Gere e exporte relatórios da sua unidade: {user.loja_nome || user.name}
        </p>
      </div>
      <CrmContent lojaId={lojaId} lojaNome={user.loja_nome} />
    </div>
  )
}
