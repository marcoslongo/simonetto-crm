'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
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
  UserSearch,
  Settings,
  TrendingUp,
  MousePointerClick,
  CalendarDays,
  CalendarRange,
  User,
  Shield,
  LogOut,
  ChevronRight,
  Medal,
} from 'lucide-react'
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go"
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useSidebar } from './sidebar-context'
import { logoutAction } from '@/app/login/actions'

import type { User as UserType } from '@/lib/types'

interface DashboardSidebarProps {
  user: UserType
  metasAtivo?: boolean
}

function buildNavigation(user: UserType, metasAtivo: boolean) {
  const isAdmin = user.role === 'administrator'
  const isGerente = isAdmin || user.is_gerente === true

  if (isAdmin) {
    return [
      {
        group: 'Visão Geral',
        items: [
          { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        ],
      },
      {
        group: 'Performance',
        items: [
          { name: 'Conversão', href: '/admin/conversao', icon: Target },
          { name: 'Operação', href: '/admin/operacao', icon: Activity },
          { name: 'Aquisição', href: '/admin/aquisicao', icon: Filter },
        ],
      },
      {
        group: 'Análise',
        items: [
          { name: 'Perfil dos Leads', href: '/admin/perfil', icon: UserSearch },
          { name: 'Geografia', href: '/admin/geografia', icon: Map },
        ],
      },
      {
        group: 'Administração',
        items: [
          { name: 'Lojas', href: '/admin/lojas', icon: Building2 },
          { name: 'Leads', href: '/admin/leads', icon: Users },
          { name: 'Relatórios', href: '/admin/relatorios', icon: FileChartColumnIncreasing },
          { name: 'Agenda', href: '/crm/calendario', icon: CalendarDays },
        ],
      },
      {
        group: 'Conta',
        items: [
          { name: 'Configurações', href: '/configuracoes', icon: Settings },
        ],
      },
    ]
  }

  return [
    {
      group: 'Visão Geral',
      items: [
        { name: 'Resumo', href: '/crm', icon: LayoutDashboard },
        ...(isGerente && user.loja_ids.length > 1
          ? [{ name: 'Unidades', href: '/crm/unidades', icon: Building2 }]
          : []),
      ],
    },
    ...(isGerente
      ? [
          {
            group: 'Análise',
            items: [
              { name: 'Desempenho', href: '/crm/desempenho', icon: TrendingUp },
              { name: 'Comportamento', href: '/crm/comportamento', icon: MousePointerClick },
            ],
          },
        ]
      : []),
    {
      group: 'Operações',
      items: [
        { name: 'Atendimentos', href: '/crm/atendimentos', icon: Phone },
        // Gerentes: visível só quando módulo ativo. Vendedores: sempre visível (só leitura)
        ...(isGerente ? (metasAtivo ? [{ name: 'Metas Comerciais', href: '/metas', icon: Medal }] : []) : [{ name: 'Metas Comerciais', href: '/metas', icon: Medal }]),
        { name: 'Minha Agenda', href: '/crm/calendario', icon: CalendarDays },
        { name: 'Agenda da Loja', href: '/crm/agenda', icon: CalendarRange },
        ...(isGerente
          ? [{ name: 'Relatórios', href: '/crm/relatorios', icon: FileChartColumnIncreasing }]
          : []),
      ],
    },
    {
      group: 'Conta',
      items: [
        { name: 'Configurações', href: '/configuracoes', icon: Settings },
      ],
    },
  ]
}

export function DashboardSidebar({ user, metasAtivo = false }: DashboardSidebarProps) {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar()
  const pathname = usePathname()

  const isAdmin = user.role === 'administrator'
  const rootHref = isAdmin ? '/admin' : '/crm'
  const navigation = buildNavigation(user, metasAtivo)

  const isActive = (href: string) =>
    pathname === href || (href !== rootHref && pathname.startsWith(href))

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
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
                    const active = isActive(item.href)

                    const link = (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-white',
                          active
                            ? 'bg-[#2463eb] text-white'
                            : 'text-[#ccc] hover:bg-white/10 hover:text-white',
                          collapsed && 'justify-center px-2'
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
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

      {/* ── Mobile Drawer ───────────────────────────────────────────── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="p-0 w-70 border-r-0 flex flex-col [&>button]:text-white [&>button]:hover:bg-white/10 [&>button]:rounded-lg"
          style={{ background: '#0b1437' }}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Menu de navegação</SheetTitle>
          </SheetHeader>

          {/* User info */}
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2463eb]/20 border border-[#2463eb]/30">
                {isAdmin
                  ? <Shield className="h-5 w-5 text-[#2463eb]" />
                  : <User className="h-5 w-5 text-[#2463eb]" />
                }
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                <p className="truncate text-xs text-white/50">
                  {isAdmin ? 'Administrador' : user.loja_nome || 'Atendente'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
            {navigation.map((group) => (
              <div key={group.group}>
                <p className="text-[10px] uppercase tracking-widest text-white/35 px-3 mb-1.5">
                  {group.group}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all',
                          'min-h-12',
                          active
                            ? 'bg-[#2463eb] text-white shadow-sm shadow-[#2463eb]/30'
                            : 'text-white/70 hover:bg-white/8 hover:text-white active:bg-white/12'
                        )}
                      >
                        <item.icon className={cn("h-5 w-5 shrink-0", active ? "text-white" : "text-white/60")} />
                        <span className="flex-1">{item.name}</span>
                        {active && <ChevronRight className="h-3.5 w-3.5 text-white/60 shrink-0" />}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer: logout */}
          <div className="p-3 border-t border-white/10">
            <form action={logoutAction} className="w-full">
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl px-3 min-h-12 text-sm font-medium text-white/60 hover:bg-white/8 hover:text-white transition-all"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                Sair
              </button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
