'use client'

import { useEffect, useState, useCallback } from 'react'
import { Users, Wifi, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const POLL_MS = 30_000 // 30 s

interface OnlineUser {
  id: number
  nome: string
  email: string
  avatar: string
  role: 'master' | 'admin' | 'gerente' | 'loja'
  loja_nome: string | null
  last_active: number
}

const roleLabel: Record<OnlineUser['role'], string> = {
  master: 'Master',
  admin: 'Admin',
  gerente: 'Gerente',
  loja: 'Loja',
}

const roleColor: Record<OnlineUser['role'], string> = {
  master: 'bg-violet-100 text-violet-700',
  admin: 'bg-blue-100 text-blue-700',
  gerente: 'bg-amber-100 text-amber-700',
  loja: 'bg-slate-100 text-slate-600',
}

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts
  if (diff < 60) return 'agora mesmo'
  if (diff < 120) return 'há 1 min'
  return `há ${Math.floor(diff / 60)} min`
}

function Avatar({ user }: { user: OnlineUser }) {
  const [err, setErr] = useState(false)
  const initials = user.nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('')

  if (!err && user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.nome}
        onError={() => setErr(true)}
        className="h-9 w-9 rounded-full object-cover ring-2 ring-white shrink-0"
      />
    )
  }

  return (
    <div className="h-9 w-9 rounded-full bg-[#16255c]/10 text-[#16255c] flex items-center justify-center text-xs font-semibold ring-2 ring-white shrink-0">
      {initials}
    </div>
  )
}

export function OnlineUsers() {
  const [users, setUsers] = useState<OnlineUser[]>([])
  const [loading, setLoading] = useState(true)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  const fetch = useCallback(async () => {
    try {
      const res = await globalThis.fetch('/api/presence')
      if (!res.ok) return
      const data = await res.json()
      setUsers(data.online ?? [])
      setLastFetch(new Date())
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
    const id = setInterval(fetch, POLL_MS)
    return () => clearInterval(id)
  }, [fetch])

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-green-500" />
            <CardTitle className="text-base">Usuários online</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {loading && (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
            <Badge variant="secondary" className={cn(
              'text-xs font-semibold',
              users.length > 0 ? 'bg-green-100 text-green-700' : ''
            )}>
              {users.length} {users.length === 1 ? 'online' : 'online'}
            </Badge>
          </div>
        </div>
        {lastFetch && (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Atualizado às {lastFetch.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · atualiza a cada 30 s
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {!loading && users.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <Users className="h-8 w-8 opacity-20" />
            <p className="text-sm">Nenhum usuário online no momento</p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map(user => (
              <div
                key={user.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/50"
              >
                <div className="relative shrink-0">
                  <Avatar user={user} />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.nome}
                    </p>
                    <span className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      roleColor[user.role]
                    )}>
                      {roleLabel[user.role]}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.loja_nome ?? user.email}
                  </p>
                </div>

                <p className="shrink-0 text-[11px] text-muted-foreground whitespace-nowrap">
                  {timeAgo(user.last_active)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
