import { requireAuth } from '@/lib/auth'
import { KeyRound, User } from 'lucide-react'
import { ConfiguracoesForm } from './configuracoes-form'

export const metadata = {
  title: 'Configurações | Noxus - Lead Ops',
}

export default async function ConfiguracoesPage() {
  const user = await requireAuth()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Configurações</h2>
        <p className="text-muted-foreground mt-1">Gerencie as configurações da sua conta</p>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="flex items-center gap-2 mb-5">
            <KeyRound className="h-5 w-5 text-[#16255c]" />
            <h3 className="text-base font-semibold text-[#16255c]">Alterar senha</h3>
          </div>
          <ConfiguracoesForm />
        </div>
      </div>
    </div>
  )
}
