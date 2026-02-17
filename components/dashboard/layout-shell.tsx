'use client'

import { cn } from '@/lib/utils'
import { useSidebar } from './sidebar-context'

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <div
      className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        collapsed ? "lg:ml-20" : "lg:ml-64"
      )}
    >
      {children}
    </div>
  )
}