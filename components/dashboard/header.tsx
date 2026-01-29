'use client'

import { User, LogOut, Store, Shield } from 'lucide-react'
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
import type { User as UserType } from '@/lib/types'
import Image from 'next/image'

interface DashboardHeaderProps {
  user: UserType
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const isAdmin = user.role === 'administrator'

  return (
    <header className="sticky top-0 z-50 bg-black w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-18 items-center justify-between px-4 lg:px-6 bg-black">
        <div className="flex items-center gap-4">
          <Image
            width={200}
            height={30}
            alt='Simonetto'
            src={'simonetto-white.webp'}
          />
          {!isAdmin && user.loja_nome && (
            <Badge variant="secondary" className="hidden sm:flex items-center gap-1">
              <Store className="h-3 w-3" />
              {user.loja_nome}
            </Badge>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2 bg-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-full">
                {isAdmin ? (
                  <Shield className="h-4 w-4 text-black" />
                ) : (
                  <User className="h-4 w-4 text-black" />
                )}
              </div>
              <span className="hidden sm:inline-block text-sm text-black">
                {user.name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
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
    </header>
  )
}
