'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell, User, CheckCheck, Loader2, ExternalLink } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface Notificacao {
  id: number
  lead_id: number
  lead_nome: string
  atribuido_por_id: number
  atribuido_por_nome: string
  criado_em: string
}

const POLL_MS = 60_000

export function LeadAtribuicaoBell() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const toastShownRef = useRef(false)
  const prevCountRef = useRef(0)

  const fetch_ = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/notificacoes/lead-atribuicao', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      if (!data.success) return

      const items: Notificacao[] = data.notificacoes ?? []
      setNotificacoes(items)

      // Toast só na primeira vez se há notificações novas
      if (!toastShownRef.current && items.length > 0) {
        toastShownRef.current = true
        toast.info(
          `${items.length} lead${items.length > 1 ? 's foram atribuídos' : ' foi atribuído'} a você`,
          { duration: 5000 }
        )
      }

      // Toast ao chegar notificações novas durante a sessão
      if (toastShownRef.current && items.length > prevCountRef.current) {
        const novas = items.length - prevCountRef.current
        toast.info(`${novas} novo${novas > 1 ? 's leads atribuídos' : ' lead atribuído'} a você`)
      }

      prevCountRef.current = items.length
    } catch {
      // silencioso — não quebra UI
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  // Poll inicial + intervalo
  useEffect(() => {
    fetch_(false)
    const id = setInterval(() => fetch_(true), POLL_MS)
    return () => clearInterval(id)
  }, [fetch_])

  const handleMarkOne = async (notif: Notificacao) => {
    setNotificacoes(prev => prev.filter(n => n.id !== notif.id))
    await fetch(`/api/notificacoes/lead-atribuicao/${notif.id}`, { method: 'PATCH' }).catch(() => {})
    prevCountRef.current = Math.max(0, prevCountRef.current - 1)
  }

  const handleMarkAll = async () => {
    if (!notificacoes.length) return
    setMarkingAll(true)
    try {
      await fetch('/api/notificacoes/lead-atribuicao/lidas', { method: 'POST' })
      setNotificacoes([])
      prevCountRef.current = 0
      setOpen(false)
    } catch {
      toast.error('Erro ao marcar notificações')
    } finally {
      setMarkingAll(false)
    }
  }

  const count = notificacoes.length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label={`${count} notificações de atribuição`}
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 shadow-xl" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-semibold">Leads atribuídos a você</p>
          </div>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={handleMarkAll}
              disabled={markingAll}
            >
              {markingAll
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <CheckCheck className="h-3 w-3" />
              }
              Limpar
            </Button>
          )}
        </div>

        {/* Lista */}
        <div className="max-h-80 overflow-y-auto">
          {loading && notificacoes.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : count === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <CheckCheck className="h-7 w-7 opacity-20" />
              <p className="text-sm">Nenhuma notificação nova</p>
            </div>
          ) : (
            <div className="divide-y">
              {notificacoes.map(n => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
                >
                  {/* Avatar / ícone */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 mt-0.5">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>

                  {/* Conteúdo */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground leading-snug">
                      {n.lead_nome}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Atribuído por <span className="font-medium text-foreground">{n.atribuido_por_nome}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                      {formatDistanceToNow(parseISO(n.criado_em), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleMarkOne(n)}
                      className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Marcar como lida"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {count > 0 && (
          <div className="border-t px-4 py-2">
            <p className="text-xs text-muted-foreground text-center">
              {count} notificação{count > 1 ? 'ões' : ''} não lida{count > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
