'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Building2, Phone } from 'lucide-react'
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go";
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import type { User } from '@/lib/types'

interface DashboardSidebarProps {
  user: User
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(true)
  const pathname = usePathname()
  const isAdmin = user.role === 'administrator'
  const basePath = isAdmin ? '/admin' : '/crm'
  const isStore = user.role === 'loja'

  const navigation = [
    {
      name: 'Dashboard',
      href: basePath,
      icon: LayoutDashboard,
    },
    ...(isStore
      ? [
          {
            name: 'Atendimentos',
            href: '/crm/atendimentos',
            icon: Phone,
          }
        ]
      : []),
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
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r min-h-screen bg-[#16255c] transition-all duration-300 relative",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className='my-5 border-b border-muted-foreground'>
        <div className="p-4">
          <div
            className={cn(
              "flex items-center justify-center transition-all duration-300",
              collapsed ? "h-12" : "h-16"
            )}
          >
            <Image
              alt='Logo'
              width={collapsed ? 40 : 120}
              height={collapsed ? 40 : 120}
              src={'/noxus.webp'}
              className="object-contain transition-all duration-300"
            />
          </div>
        </div>
      </div>

      <Button
        onClick={() => setCollapsed(!collapsed)}
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-24 z-10 h-9 w-9 rounded-full border border-white/20 bg-[#16255c] text-white hover:bg-[#1e3a8a] hover:text-white shadow-lg"
      >
        {collapsed ? (
          <GoSidebarCollapse className="h-8 w-8" />
        ) : (
          <GoSidebarExpand className="h-8 w-8" />
        )}
      </Button>

      <nav className="flex-1 space-y-1 p-4">
        <TooltipProvider delayDuration={100}>
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== basePath && pathname.startsWith(item.href))

            const link = (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-white',
                  isActive
                    ? 'bg-[#2463eb] text-white'
                    : 'text-[#ccc] hover:bg-[#182543] hover:text-white',
                  collapsed && 'justify-center px-2'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )

            if (!collapsed) return link

            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="bg-[#16255c] text-white border-white/10"
                >
                  {item.name}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </TooltipProvider>
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-white/10">
          <div className="rounded-lg bg-white/5 p-3">
            <p className="text-xs font-medium text-[#ccc]">
              {isAdmin ? 'Modo Administrador' : 'Sua Unidade'}
            </p>
            <p className="text-sm font-semibold mt-1 truncate text-white">
              {isAdmin ? 'Acesso Total' : user.loja_nome || 'Loja'}
            </p>
          </div>
        </div>
      )}

      {collapsed && (
        <div className="p-4 border-t border-white/10 flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-2 w-2 rounded-full bg-[#2463eb]" />
            </TooltipTrigger>
            <TooltipContent side="right">
              {isAdmin ? 'Administrador' : user.loja_nome || 'Loja'}
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </aside>
  )
}
