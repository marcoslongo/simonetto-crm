'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell, Calendar, CalendarClock, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface OverdueFollowup {
  id: number
  lead_id: number
  lead_nome: string | null
  agendado_para: string
  descricao: string | null
  usuario_nome: string
}

const POLL_MS = 60_000

export function FollowupBell() {
  const [followups, setFollowups] = useState<OverdueFollowup[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [concluding, setConcluding] = useState<number | null>(null)
  const toastShownRef = useRef(false)
  const initialized = useRef(false)

  const fetchOverdue = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/followups/overdue', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      if (!data.success || !Array.isArray(data.followups)) return

      const items: OverdueFollowup[] = data.followups
      setFollowups(items)

      if (!toastShownRef.current && items.length > 0) {
        toastShownRef.current = true
        toast.warning(
          `${items.length} retorno${items.length > 1 ? 's atrasados' : ' atrasado'}`,
          {
            description: `Você tem retorno${items.length > 1 ? 's' : ''} vencido${items.length > 1 ? 's' : ''} que precisam de atenção.`,
            duration: 6000,
          }
        )
      }
    } catch {
      // falha silenciosa
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      fetchOverdue()
    }
    const timer = setInterval(fetchOverdue, POLL_MS)
    return () => clearInterval(timer)
  }, [fetchOverdue])

  const handleConcluir = async (id: number) => {
    setConcluding(id)
    try {
      const res = await fetch(`/api/followups/${id}`, { method: 'PATCH' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.mensagem ?? 'Erro ao concluir retorno')
        return
      }
      setFollowups(prev => prev.filter(f => f.id !== id))
      toast.success('Retorno marcado como realizado!')
    } catch {
      toast.error('Erro ao concluir retorno')
    } finally {
      setConcluding(null)
    }
  }

  const count = followups.length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Retornos atrasados"
        >
          <Calendar
            className={cn(
              'h-5 w-5 transition-colors',
              count > 0 ? 'text-orange-500' : 'text-gray-500'
            )}
          />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white ring-2 ring-white">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-80 p-0 shadow-xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-orange-500" />
            <p className="text-sm font-semibold text-[#16255c]">Retornos atrasados</p>
            {loading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
          {count > 0 && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
              {count}
            </span>
          )}
        </div>

        {/* Lista */}
        <div className="max-h-[420px] overflow-y-auto divide-y">
          {count === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-400" />
              <p className="text-sm font-medium text-gray-500">Tudo em dia!</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Nenhum retorno atrasado.
              </p>
            </div>
          ) : (
            followups.map(f => {
              const dt = new Date(f.agendado_para)
              const overdue = formatDistanceToNow(dt, { addSuffix: true, locale: ptBR })
              const isConcluding = concluding === f.id

              return (
                <div key={f.id} className="flex gap-3 px-4 py-3 bg-orange-50/40">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100">
                    <CalendarClock className="h-4 w-4 text-orange-600" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {f.lead_nome ?? `Lead #${f.lead_id}`}
                    </p>
                    <p className="text-[11px] font-semibold text-orange-600">
                      {format(dt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      <span className="ml-1 font-normal text-muted-foreground">({overdue})</span>
                    </p>
                    {f.descricao && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {f.descricao}
                      </p>
                    )}

                    <button
                      onClick={() => handleConcluir(f.id)}
                      disabled={isConcluding}
                      className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                    >
                      {isConcluding
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <CheckCircle2 className="h-3 w-3" />}
                      Marcar como realizado
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Rodapé */}
        <div className="border-t px-4 py-2 text-center">
          <p className="text-xs text-muted-foreground">
            Retornos passados da data · atualiza a cada 60s
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
