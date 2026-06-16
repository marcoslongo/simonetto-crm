import React from "react"
import { requireAuth, isAdmin } from '@/lib/auth'
import { getLojaMetasConfig, getLojaPosVendaConfig } from '@/lib/api-loja'
import { DashboardHeader } from '@/components/dashboard/header'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { SidebarProvider } from '@/components/dashboard/sidebar-context'
import { LayoutShell } from '@/components/dashboard/layout-shell'
import { BottomNav } from '@/components/dashboard/bottom-nav'
import { SessionTimeout } from '@/components/providers/session-timeout'
import { AdminAiButton } from '@/components/admin/ai-admin-button'
import { AiGerenteButton } from '@/components/gerente/ai-gerente-button'
import { PresenceHeartbeat } from '@/components/providers/presence-heartbeat'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  const isLoja       = user.role === 'loja' && user.loja_ids.length > 0
  const [metasAtivo, posVendaAtivo] = isLoja
    ? await Promise.all([
        getLojaMetasConfig(user.loja_ids[0]),
        getLojaPosVendaConfig(user.loja_ids[0]),
      ])
    : [false, false]

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <DashboardSidebar user={user} metasAtivo={metasAtivo} posVendaAtivo={posVendaAtivo} />
        <LayoutShell>
          <DashboardHeader user={user} />
          <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8 min-w-0 overflow-x-hidden">
            {children}
          </main>
        </LayoutShell>
      </div>
      <BottomNav user={user} />
      <SessionTimeout />
      <PresenceHeartbeat />
      {isAdmin(user) && <AdminAiButton />}
      {!isAdmin(user) && user.is_gerente && <AiGerenteButton lojaNome={user.loja_nome} />}
    </SidebarProvider>
  )
}