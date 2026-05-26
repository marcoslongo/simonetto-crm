import { requireAuth } from '@/lib/auth'
import { CalendarioView } from '@/components/crm/calendario-view'

export const metadata = {
  title: 'Agenda | Noxus - Lead Ops',
  description: 'Gerencie seus compromissos e retornos',
}

export default async function CalendarioPage() {
  const user = await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Agenda</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie seus compromissos e retornos
        </p>
      </div>

      <CalendarioView userId={user.id} />
    </div>
  )
}
