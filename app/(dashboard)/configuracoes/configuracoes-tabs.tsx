'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Link2, Settings2, ShieldCheck, ImageIcon, KeyRound } from 'lucide-react'
import { AvatarForm } from './avatar-form'
import { ConfiguracoesForm } from './configuracoes-form'
import { IntegracaoLP } from '@/components/lojas/integracao-lp'
import { WhatsAppConfig } from '@/components/lojas/whatsapp-config'
import { WhatsAppAutoLeadConfig } from '@/components/lojas/whatsapp-auto-lead-config'
import { LeadsConfigGerente } from '@/components/lojas/leads-config-gerente'
import { VendasRealizadasConfigComp } from '@/components/lojas/vendas-realizadas-config'
import { MetasConfigComp } from '@/components/lojas/metas-config'
import { PosVendaConfigComp } from '@/components/lojas/pos-venda-config'
import { KanbanCardConfigComp } from '@/components/lojas/kanban-card-config'
import { AdminConfigTabs } from '@/components/admin/admin-config-tabs'
import type { LojaIntegrationData } from '@/lib/api-loja'

interface UserProps {
  id: number
  name: string
  email: string
  role: string
  avatar_url: string | null
  loja_nome: string | null
  is_gerente: boolean
}

interface Props {
  user: UserProps
  isLoja: boolean
  primaryLojaId: string | null
  integration: LojaIntegrationData | null
  siteUrl: string | undefined
}

const roleLabels: Record<string, string> = {
  administrator: 'Administrador',
  loja: 'Lojista',
}

export function ConfiguracoesTabs({ user, isLoja, primaryLojaId, integration, siteUrl }: Props) {
  const isMasterAdmin = user.role === 'administrator' && user.id === 1
  const showOperacao  = isLoja && user.is_gerente

  return (
    <Tabs defaultValue="conta" className="space-y-6">
      <TabsList className="h-auto p-1 flex flex-wrap gap-1 w-fit">
        <TabsTrigger value="conta" className="flex items-center gap-1.5">
          <User className="h-4 w-4" />
          Conta
        </TabsTrigger>
        <TabsTrigger value="integracao" className="flex items-center gap-1.5">
          <Link2 className="h-4 w-4" />
          Integração
        </TabsTrigger>
        {showOperacao && (
          <TabsTrigger value="operacao" className="flex items-center gap-1.5">
            <Settings2 className="h-4 w-4" />
            Operação
          </TabsTrigger>
        )}
        {isMasterAdmin && (
          <TabsTrigger value="admin" className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            Administrativo
          </TabsTrigger>
        )}
      </TabsList>

      {/* ── Conta ── */}
      <TabsContent value="conta">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Avatar */}
          <div className="rounded-xl border bg-white shadow-sm">
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

          {/* Perfil */}
          <div className="rounded-xl border bg-white shadow-sm">
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

          {/* Alterar senha */}
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b px-6 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#16255c]">
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

        {/* WhatsApp — largura total abaixo dos 3 cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <WhatsAppConfig isAdmin={false} siteUrl={siteUrl} />
          {isLoja && <WhatsAppAutoLeadConfig />}
        </div>
      </TabsContent>

      {/* ── Integração ── */}
      <TabsContent value="integracao">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {isLoja && primaryLojaId && integration && (
            <IntegracaoLP
              lojaId={primaryLojaId}
              initialData={integration}
              isAdmin={false}
            />
          )}
        </div>
      </TabsContent>

      {/* ── Operação ── */}
      {showOperacao && (
        <TabsContent value="operacao">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LeadsConfigGerente lojaId={primaryLojaId!} />
            <KanbanCardConfigComp lojaId={primaryLojaId!} />
            <VendasRealizadasConfigComp lojaId={primaryLojaId!} />
            <MetasConfigComp lojaId={primaryLojaId!} />
            <PosVendaConfigComp lojaId={primaryLojaId!} />
          </div>
        </TabsContent>
      )}

      {/* ── Administrativo ── */}
      {isMasterAdmin && (
        <TabsContent value="admin">
          <AdminConfigTabs />
        </TabsContent>
      )}
    </Tabs>
  )
}
