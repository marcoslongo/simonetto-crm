'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Building2, Settings } from 'lucide-react'
import type { User } from '@/lib/types'

interface DashboardSidebarProps {
  user: User
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname()
  const isAdmin = user.role === 'administrator'
  const basePath = isAdmin ? '/admin' : '/crm'

  const navigation = [
    {
      name: 'Dashboard',
      href: basePath,
      icon: LayoutDashboard,
    },
    ...(isAdmin
      ? [
        {
          name: 'Lojas',
          href: '/admin/lojas',
          icon: Building2,
        },
        {
          name: 'Leads',
          href: `${basePath}/leads`,
          icon: Users,
        },
      ]
      : []),
  ]

  return (
    <aside className="hidden bg-[#0e1627] lg:flex w-64 flex-col border-r min-h-[calc(100vh-4rem)]">
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== basePath && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-white',
                isActive
                  ? 'bg-[#2463eb] text-primary-foreground'
                  : 'text-[#ccc] hover:bg-[#182543] hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs font-medium text-[#ccc]">
            {isAdmin ? 'Modo Administrador' : 'Sua Unidade'}
          </p>
          <p className="text-sm font-semibold mt-1 truncate">
            {isAdmin ? 'Acesso Total' : user.loja_nome || 'Loja'}
          </p>
        </div>
      </div>
    </aside>
  )
}
