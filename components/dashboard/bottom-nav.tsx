'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Phone,
  CalendarDays,
  Menu,
} from 'lucide-react'
import { useSidebar } from './sidebar-context'
import type { User } from '@/lib/types'

interface BottomNavProps {
  user: User
}

export function BottomNav({ user }: BottomNavProps) {
  const pathname = usePathname()
  const { setMobileOpen } = useSidebar()
  const isAdmin = user.role === 'administrator'

  const rootHref = isAdmin ? '/admin' : '/crm'

  const isActive = (href: string) =>
    pathname === href || (href !== rootHref && pathname.startsWith(href))

  const tabs = isAdmin
    ? [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Leads', href: '/admin/leads', icon: Phone },
        { name: 'Agenda', href: '/crm/calendario', icon: CalendarDays },
      ]
    : [
        { name: 'Resumo', href: '/crm', icon: LayoutDashboard },
        { name: 'Atendimentos', href: '/crm/atendimentos', icon: Phone },
        { name: 'Agenda', href: '/crm/calendario', icon: CalendarDays },
      ]

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-white/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch">
        {tabs.map((tab) => {
          const active = isActive(tab.href)
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-[10px] font-medium transition-colors relative',
                active
                  ? 'text-[#2463eb]'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {active && (
                <span className="absolute top-0 inset-x-3 h-0.5 rounded-full bg-[#2463eb]" />
              )}
              <tab.icon className={cn('h-5 w-5', active ? 'text-[#2463eb]' : 'text-gray-400')} />
              <span>{tab.name}</span>
            </Link>
          )
        })}

        {/* Menu button opens the drawer */}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-[10px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Menu className="h-5 w-5 text-gray-400" />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  )
}
