import { requireAuth } from '@/lib/auth'
import { KeyRound, User, ShieldCheck } from 'lucide-react'
import { ConfiguracoesForm } from './configuracoes-form'
import { IntegracaoLP } from '@/components/lojas/integracao-lp'
import { getLojaIntegration } from '@/lib/api-loja'

export const metadata = {
  title: 'Configurações | Noxus - Lead Ops',
}

const roleLabels: Record<string, string> = {
  administrator: 'Administrador',
  loja: 'Lojista',
}

export default async function ConfiguracoesPage() {
  const user = await requireAuth()

  const isLoja = user.role === 'loja' && !!user.loja_id
  const integration = isLoja ? await getLojaIntegration(user.loja_id!) : null

  return (
    <div className="space-y-6 ">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Configurações</h2>
        <p className="text-muted-foreground mt-1">Gerencie as configurações da sua conta</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white shadow-sm bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="flex items-center gap-3 border-b px-6 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#16255c]">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">Perfil</p>
              <p className="text-xs text-muted-foreground">Informações da sua conta</p>
            </div>
          </div>

          <div className="px-6 py-6 space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nome</p>
              <p className="text-sm font-semibold text-gray-900">{user.name}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">E-mail</p>
              <p className="text-sm text-gray-700">{user.email}</p>
            </div>

            {user.role && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Perfil de acesso</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {roleLabels[user.role] ?? user.role}
                </span>
              </div>
            )}

            {user.loja_nome && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Unidade</p>
                <p className="text-sm text-gray-700">{user.loja_nome}</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border shadow-sm bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="flex items-center gap-3 border-b px-6 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#16255c] shadow-sm">
              <KeyRound className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">Alterar senha</p>
              <p className="text-xs text-muted-foreground">Atualize a senha da sua conta</p>
            </div>
          </div>

          <div className="px-6 py-6">
            <ConfiguracoesForm />
          </div>
        </div>
      </div>

      {isLoja && integration && (
        <IntegracaoLP
          lojaId={String(user.loja_id!)}
          initialData={integration}
          isAdmin={false}
        />
      )}
    </div>
  )
}
