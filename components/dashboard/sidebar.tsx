'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Building2, Phone } from 'lucide-react'
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

  const particles = [
    { w: 1.5, h: 1.5, top: 15, left: 20, opacity: 0.2, dur: 5.0, delay: 0.5 },
    { w: 1.2, h: 1.2, top: 40, left: 70, opacity: 0.15, dur: 6.0, delay: 1.5 },
    { w: 1.8, h: 1.8, top: 70, left: 35, opacity: 0.2, dur: 7.0, delay: 0.8 },
    { w: 1.3, h: 1.3, top: 88, left: 65, opacity: 0.15, dur: 5.5, delay: 2.0 },
  ]

  return (
    <>
      <style>{`
        @keyframes sidebar-float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(5px, -8px) scale(1.02); }
          66% { transform: translate(-4px, 4px) scale(0.99); }
        }
        @keyframes sidebar-float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-6px, 5px) scale(1.02); }
          66% { transform: translate(4px, -4px) scale(0.99); }
        }
        @keyframes sidebar-float3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-5px, 8px); }
        }
        @keyframes sidebar-pulse-ring {
          0%, 100% { opacity: 0.2; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.4; transform: translate(-50%, -50%) scale(1.02); }
        }
        @keyframes sidebar-twinkle {
          0%, 100% { opacity: 0.05; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.3); }
        }
      `}</style>

      <aside
        className={cn(
          "hidden lg:flex flex-col border-r min-h-screen transition-all duration-300 fixed top-0 left-0 z-40",
          collapsed ? "w-20" : "w-64"
        )}
        style={{ background: '#0b1437' }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute rounded-full"
            style={{
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, #3b5bdb 0%, #1971c2 50%, transparent 100%)',
              top: '-80px',
              left: '-80px',
              opacity: 0.35,
              filter: 'blur(60px)',
              animation: 'sidebar-float1 8s ease-in-out infinite',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: '250px',
              height: '250px',
              background: 'radial-gradient(circle, #7048e8 0%, #5c37c7 50%, transparent 100%)',
              bottom: '-60px',
              right: '-60px',
              opacity: 0.25,
              filter: 'blur(50px)',
              animation: 'sidebar-float2 10s ease-in-out infinite',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: '180px',
              height: '180px',
              background: 'radial-gradient(circle, #22d3ee 0%, #0e7490 50%, transparent 100%)',
              top: '45%',
              right: '-20px',
              opacity: 0.15,
              filter: 'blur(40px)',
              animation: 'sidebar-float3 12s ease-in-out infinite',
            }}
          />

          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />

          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                rgba(255,255,255,1) 0px,
                rgba(255,255,255,1) 1px,
                transparent 1px,
                transparent 20px
              )`,
            }}
          />

          <div
            className="absolute pointer-events-none"
            style={{
              width: '400px',
              height: '400px',
              border: '1px solid rgba(91, 130, 235, 0.12)',
              borderRadius: '50%',
              top: '50%',
              left: '50%',
              animation: 'sidebar-pulse-ring 4s ease-in-out infinite',
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              width: '280px',
              height: '280px',
              border: '1px solid rgba(91, 130, 235, 0.08)',
              borderRadius: '50%',
              top: '50%',
              left: '50%',
              animation: 'sidebar-pulse-ring 4s ease-in-out infinite 1s',
            }}
          />

          {particles.map((p, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white pointer-events-none"
              style={{
                width: p.w + 'px',
                height: p.h + 'px',
                top: p.top + '%',
                left: p.left + '%',
                opacity: p.opacity,
                animation: `sidebar-twinkle ${p.dur}s ease-in-out infinite ${p.delay}s`,
              }}
            />
          ))}
        </div>
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
          className="absolute -right-3 top-24 h-9 w-9 rounded-full border border-white/20 text-white hover:text-white shadow-lg z-50"
          style={{ background: '#0b1437' }}
        >
          {collapsed ? (
            <GoSidebarCollapse className="h-8 w-8" />
          ) : (
            <GoSidebarExpand className="h-8 w-8" />
          )}
        </Button>

        <nav className="flex-1 space-y-1 p-4 relative z-10">
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
          </TooltipProvider>
        </nav>

        {!collapsed && (
          <div className="p-4 border-t border-white/10 relative z-10">
            <div
              className="rounded-lg p-3"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
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
          <div className="p-4 border-t border-white/10 flex justify-center relative z-10">
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
    </>
  )
}