import React from "react"
import { requireAuth } from '@/lib/auth'
import { DashboardHeader } from '@/components/dashboard/header'
import { DashboardSidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar user={user} />
      <div className="flex-1 flex flex-col">
        <DashboardHeader user={user} />
        <main className="flex-1 p-6 lg:p-8 transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  )
}