import { requireAuth } from '@/lib/auth'
import { KeyRound, User, ShieldCheck, ImageIcon } from 'lucide-react'
import { ConfiguracoesForm } from './configuracoes-form'
import { AvatarForm } from './avatar-form'
import { IntegracaoLP } from '@/components/lojas/integracao-lp'
import { WhatsAppConfig } from '@/components/lojas/whatsapp-config'
import { WhatsAppAutoLeadConfig } from '@/components/lojas/whatsapp-auto-lead-config'
import { LeadsConfigGerente } from '@/components/lojas/leads-config-gerente'
import { VendasRealizadasConfigComp } from '@/components/lojas/vendas-realizadas-config'
import { AdminConfigTabs } from '@/components/admin/admin-config-tabs'
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

  const isLoja = user.role === 'loja' && user.loja_ids.length > 0
  const primaryLojaId = user.loja_ids[0]
  const integration = isLoja ? await getLojaIntegration(primaryLojaId) : null

  return (
    <div className="space-y-6 ">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Configurações</h2>
        <p className="text-muted-foreground mt-1">Gerencie as configurações da sua conta</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Card: Avatar */}
        <div className="rounded-xl border bg-white shadow-sm bg-linear-to-br from-slate-50 to-slate-100">
          <div className="flex items-center gap-3 border-b px-6 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#16255c]">
              <ImageIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">Foto de perfil</p>
              <p className="text-xs text-muted-foreground">Visível nos cards de atendimento</p>
            </div>
          </div>
          <div className="px-6 py-6">
            <AvatarForm currentAvatarUrl={user.avatar_url} userName={user.name} />
          </div>
        </div>

        {/* Card: Perfil */}
        <div className="rounded-xl border bg-white shadow-sm bg-linear-to-br from-slate-50 to-slate-100">
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

        {/* Card: Alterar senha */}
        <div className="rounded-xl border shadow-sm bg-linear-to-br from-slate-50 to-slate-100">
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

      {user.role === 'administrator' && user.id === 1 && <AdminConfigTabs />}

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {isLoja && integration && (
          <IntegracaoLP
            lojaId={String(primaryLojaId)}
            initialData={integration}
            isAdmin={false}
          />
        )}

        <WhatsAppConfig
          isAdmin={false}
          siteUrl={process.env.NEXT_PUBLIC_SITE_URL}
        />

        {isLoja && <WhatsAppAutoLeadConfig />}

        {isLoja && user.is_gerente && (
          <LeadsConfigGerente lojaId={String(primaryLojaId)} />
        )}

        {isLoja && user.is_gerente && (
          <VendasRealizadasConfigComp lojaId={String(primaryLojaId)} />
        )}
      </div>
    </div>
  )
}
