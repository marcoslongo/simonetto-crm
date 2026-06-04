'use client'

import { Menu, User, LogOut, Store, Shield, Settings } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { logoutAction } from '@/app/login/actions'
import { NotificationBell } from './notification-bell'
import { FollowupBell } from './followup-bell'
import { useSidebar } from './sidebar-context'
import type { User as UserType } from '@/lib/types'

interface DashboardHeaderProps {
  user: UserType
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const isAdmin = user.role === 'administrator'
  const { setMobileOpen } = useSidebar()

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/10 lg:border-border bg-[#0b1437] lg:bg-white/95 backdrop-blur supports-backdrop-filter:lg:bg-white/60">
      <div className="flex h-14 lg:h-16 items-center justify-between px-3 lg:px-6">

        {/* Left: hamburger (mobile) + loja badge (desktop) */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Hamburger — mobile only */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-10 w-10 shrink-0 text-white hover:bg-white/10 hover:text-white"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo — mobile only */}
          <Link href={isAdmin ? '/admin' : '/crm'} className="lg:hidden">
            <Image
              src="/noxus.webp"
              alt="Logo"
              width={80}
              height={28}
              className="object-contain h-7 w-auto brightness-0 invert"
            />
          </Link>

          {/* Loja badge — desktop only */}
          {!isAdmin && user.loja_nome && (
            <Badge variant="secondary" className="hidden lg:flex items-center gap-1">
              <Store className="h-3 w-3" />
              {user.loja_nome}
            </Badge>
          )}
        </div>

        {/* Right: bells + user menu */}
        <div className="flex items-center gap-1.5 lg:gap-2">
          <div className="[&_button]:text-white/80 [&_button]:hover:text-white [&_button]:hover:bg-white/10 lg:[&_button]:text-inherit lg:[&_button]:hover:bg-inherit lg:[&_button]:hover:text-inherit">
            <FollowupBell />
          </div>
          {isAdmin && (
            <div className="[&_button]:text-white/80 [&_button]:hover:text-white [&_button]:hover:bg-white/10 lg:[&_button]:text-inherit lg:[&_button]:hover:bg-inherit lg:[&_button]:hover:text-inherit">
              <NotificationBell />
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white lg:border-gray-200 lg:bg-background lg:text-gray-900 lg:hover:bg-gray-50 lg:hover:text-gray-900 h-9 px-2 lg:px-3"
              >
                {/* Avatar: foto se existir, senão ícone/iniciais */}
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="h-7 w-7 rounded-full object-cover ring-1 ring-white/20 lg:ring-gray-200 shrink-0"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 lg:bg-primary/10 shrink-0">
                    {isAdmin ? (
                      <Shield className="h-3.5 w-3.5 text-white lg:text-primary" />
                    ) : (
                      <User className="h-3.5 w-3.5 text-white lg:text-primary" />
                    )}
                  </div>
                )}
                <span className="hidden sm:inline-block text-sm max-w-28 truncate">
                  {user.name}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center gap-3">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="h-9 w-9 rounded-full object-cover ring-1 ring-border shrink-0"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
                      {isAdmin
                        ? <Shield className="h-4 w-4 text-primary" />
                        : <User className="h-4 w-4 text-primary" />
                      }
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-muted-foreground">
                <Badge variant={isAdmin ? 'default' : 'secondary'} className="text-xs">
                  {isAdmin ? 'Administrador' : 'Loja'}
                </Badge>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/configuracoes" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action={logoutAction} className="w-full">
                  <button type="submit" className="flex w-full items-center gap-2 text-destructive">
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
