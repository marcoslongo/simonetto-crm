'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Lead } from '@/lib/types'

const POLL_INTERVAL_MS = 90_000
const LS_KEY = 'admin_notification_seen'

function getSeenKeys(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(LS_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function saveSeenKeys(keys: Set<string>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...keys]))
  } catch {}
}

function notifKey(lead: Lead) {
  return `${lead.id}_${lead.status}`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Agora mesmo'
  if (minutes < 60) return `há ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Lead[]>([])
  const [seenKeys, setSeenKeys] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const initialized = useRef(false)

  const unreadCount = notifications.filter(n => !seenKeys.has(notifKey(n))).length

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications)
      }
    } catch {
      // falha silenciosa — não interrompe o usuário
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      setSeenKeys(getSeenKeys())
      fetchNotifications()
    }
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markAllRead = useCallback(() => {
    setSeenKeys(prev => {
      const next = new Set(prev)
      notifications.forEach(n => next.add(notifKey(n)))
      saveSeenKeys(next)
      return next
    })
  }, [notifications])

  const handleOpenChange = (val: boolean) => {
    setOpen(val)
    if (val && unreadCount > 0) {
      markAllRead()
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notificações"
        >
          <Bell
            className={cn(
              'h-5 w-5 transition-colors',
              unreadCount > 0 ? 'text-[#2463eb]' : 'text-gray-500'
            )}
          />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-80 p-0 shadow-xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[#16255c]">Notificações</p>
            {loading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
          {notifications.length > 0 && unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-[#2463eb] hover:underline"
            >
              Marcar como lidas
            </button>
          )}
        </div>

        {/* Lista */}
        <div className="max-h-[420px] overflow-y-auto divide-y">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Bell className="mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">Sem notificações</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Vendas realizadas e perdidas aparecem aqui
              </p>
            </div>
          ) : (
            notifications.map(lead => {
              const isRealizada = lead.status === 'venda_realizada'
              const isRead = seenKeys.has(notifKey(lead))

              return (
                <div
                  key={notifKey(lead)}
                  className={cn(
                    'flex gap-3 px-4 py-3 transition-colors',
                    !isRead && 'bg-blue-50/50'
                  )}
                >
                  {/* Ícone de status */}
                  <div
                    className={cn(
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      isRealizada ? 'bg-green-100' : 'bg-red-100'
                    )}
                  >
                    {isRealizada ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {lead.nome}
                      </p>
                      {!isRead && (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {lead.loja_nome}
                      {lead.loja_cidade ? ` · ${lead.loja_cidade}` : ''}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className={cn(
                          'text-[11px] font-semibold',
                          isRealizada ? 'text-green-700' : 'text-red-600'
                        )}
                      >
                        {isRealizada ? 'Venda realizada' : 'Venda perdida'}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        · {timeAgo(lead.data_atualizacao)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Rodapé */}
        {notifications.length > 0 && (
          <div className="border-t px-4 py-2 text-center">
            <p className="text-xs text-muted-foreground">
              Últimos 7 dias · atualiza a cada 90s
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
