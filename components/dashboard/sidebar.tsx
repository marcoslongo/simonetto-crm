'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Building2,
  Phone,
  FileChartColumnIncreasing,
  Filter,
  Activity,
  Target,
  Map,
  UserSearch
} from 'lucide-react'
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go"
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSidebar } from './sidebar-context'

import type { User } from '@/lib/types'

interface DashboardSidebarProps {
  user: User
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const { collapsed, setCollapsed } = useSidebar()
  const pathname = usePathname()

  const isAdmin = user.role === 'administrator'
  const isStore = user.role === 'loja'

  const basePath = isAdmin ? '/admin' : '/crm'

  const navigation = [
    {
      group: 'Visão Geral',
      items: [
        {
          name: 'Dashboard',
          href: basePath,
          icon: LayoutDashboard,
        },
      ],
    },

    {
      group: 'Performance',
      items: [
        {
          name: 'Conversão',
          href: `${basePath}/conversao`,
          icon: Target,
        },
        {
          name: 'Operação',
          href: `${basePath}/operacao`,
          icon: Activity,
        },
        {
          name: 'Aquisição',
          href: `${basePath}/aquisicao`,
          icon: Filter,
        },
      ],
    },

    {
      group: 'Análise',
      items: [
        {
          name: 'Perfil dos Leads',
          href: `${basePath}/perfil`,
          icon: UserSearch,
        },
        {
          name: 'Geografia',
          href: `${basePath}/geografia`,
          icon: Map,
        },
      ],
    },

    ...(isStore
      ? [
        {
          group: 'CRM',
          items: [
            {
              name: 'Atendimentos',
              href: '/crm/atendimentos',
              icon: Phone,
            },
          ],
        },
      ]
      : []),

    ...(isAdmin
      ? [
        {
          group: 'Administração',
          items: [
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
            {
              name: 'Relatórios',
              href: `${basePath}/relatorios`,
              icon: FileChartColumnIncreasing,
            },
          ],
        },
      ]
      : []),
  ]

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r min-h-screen transition-all duration-300 fixed top-0 left-0 z-40",
        collapsed ? "w-20" : "w-64"
      )}
      style={{ background: '#0b1437' }}
    >
      <div className='my-5 relative z-10'>
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
        className="absolute -right-3 top-24 h-9 w-9 rounded-full border border-white/20 text-white shadow-lg z-50"
        style={{ background: '#0b1437' }}
      >
        {collapsed ? (
          <GoSidebarCollapse className="h-8 w-8" />
        ) : (
          <GoSidebarExpand className="h-8 w-8" />
        )}
      </Button>

      <nav className="flex-1 space-y-4 p-4 relative z-10">
        <TooltipProvider delayDuration={100}>
          {navigation.map((group) => (
            <div key={group.group}>
              {!collapsed && (
                <p className="text-[10px] uppercase text-white/40 px-3 mb-2">
                  {group.group}
                </p>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
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
                          : 'text-[#ccc] hover:bg-white/10 hover:text-white',
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
                        className="border-white/10"
                        style={{ background: '#0b1437', color: 'white' }}
                      >
                        {item.name}
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </div>
          ))}
        </TooltipProvider>
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-white/10 relative z-10">
          <div
            className="rounded-lg p-3"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <p className="text-xs text-[#ccc]">
              {isAdmin ? 'Modo Administrador' : 'Sua Unidade'}
            </p>
            <p className="text-sm font-semibold mt-1 truncate text-white">
              {isAdmin ? 'Acesso Total' : user.loja_nome || 'Loja'}
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}