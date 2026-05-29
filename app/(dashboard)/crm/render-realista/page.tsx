import { requireAuth } from '@/lib/auth'
import { RenderView } from '@/components/crm/render-view'

export const metadata = {
  title: 'Render Realista | Noxus - Lead Ops',
  description: 'Transforme renders em imagens fotorrealistas com IA',
}

export default async function RenderRealistaPage() {
  const user = await requireAuth()
  const lojaId = user.loja_ids?.[0] ?? null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Render Realista</h2>
        <p className="text-muted-foreground mt-1">
          Transforme renders em imagens fotorrealistas com inteligência artificial
        </p>
      </div>
      <RenderView lojaId={lojaId} />
    </div>
  )
}
