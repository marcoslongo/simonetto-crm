import React from "react"
import { requireAuth } from '@/lib/auth'
import { DashboardHeader } from '@/components/dashboard/header'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { SidebarProvider } from '@/components/dashboard/sidebar-context'
import { LayoutShell } from '@/components/dashboard/layout-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <DashboardSidebar user={user} />
        <LayoutShell>
          <DashboardHeader user={user} />
          <main className="flex-1 p-6 lg:p-8">
            {children}
          </main>
        </LayoutShell>
      </div>
    </SidebarProvider>
  )
}