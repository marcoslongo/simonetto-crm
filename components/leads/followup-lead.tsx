"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Bell, CheckCircle2, Trash2, Loader2, Clock, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface Followup {
  id: number
  lead_id: number
  usuario_id: number
  usuario_nome: string
  agendado_para: string
  descricao: string | null
  concluido: boolean
  concluido_em: string | null
  criado_em: string
}

interface FollowupLeadProps {
  leadId: string
  currentUserId?: number
  onFollowupChange?: (next: { em: string; descricao?: string | null } | null) => void
}

function computeNext(followups: Followup[]): { em: string; descricao?: string | null } | null {
  const pending = followups
    .filter(f => !f.concluido)
    .sort((a, b) => new Date(a.agendado_para).getTime() - new Date(b.agendado_para).getTime())
  if (!pending.length) return null
  return { em: pending[0].agendado_para, descricao: pending[0].descricao }
}

function defaultHora(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function FollowupLead({ leadId, currentUserId, onFollowupChange }: FollowupLeadProps) {
  const [followups, setFollowups] = useState<Followup[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(addDays(new Date(), 1))
  const [selectedHora, setSelectedHora] = useState(defaultHora)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [descricao, setDescricao] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [concluding, setConcluding] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    fetchFollowups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId])

  async function fetchFollowups() {
    setLoading(true)
    try {
      const res = await fetch(`/api/leads/${leadId}/followups`)
      const data = await res.json()
      if (data.success) setFollowups(data.followups ?? [])
    } catch {
      toast.error("Erro ao carregar follow-ups")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDate) return

    const agendadoParaMySQL = `${format(selectedDate, 'yyyy-MM-dd')} ${selectedHora}:00`

    setSalvando(true)
    try {
      const res = await fetch(`/api/leads/${leadId}/followups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agendado_para: agendadoParaMySQL,
          descricao: descricao.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.mensagem ?? "Erro ao agendar retorno")
        return
      }
      const updated = [...followups, data.followup]
      setFollowups(updated)
      setDescricao("")
      setSelectedDate(addDays(new Date(), 1))
      setSelectedHora(defaultHora())
      onFollowupChange?.(computeNext(updated))
      toast.success("Retorno agendado!")
    } catch {
      toast.error("Erro ao agendar retorno")
    } finally {
      setSalvando(false)
    }
  }

  async function handleConcluir(id: number) {
    setConcluding(id)
    try {
      const res = await fetch(`/api/followups/${id}`, { method: "PATCH" })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.mensagem ?? "Erro ao concluir follow-up")
        return
      }
      const updated = followups.map(f => f.id === id ? data.followup : f)
      setFollowups(updated)
      onFollowupChange?.(computeNext(updated))
      toast.success("Follow-up concluído!")
    } catch {
      toast.error("Erro ao concluir follow-up")
    } finally {
      setConcluding(null)
    }
  }

  async function handleDelete(id: number) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/followups/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.mensagem ?? "Erro ao excluir follow-up")
        return
      }
      const updated = followups.filter(f => f.id !== id)
      setFollowups(updated)
      onFollowupChange?.(computeNext(updated))
      toast.success("Follow-up excluído!")
    } catch {
      toast.error("Erro ao excluir follow-up")
    } finally {
      setDeleting(null)
    }
  }

  const pending = followups
    .filter(f => !f.concluido)
    .sort((a, b) => new Date(a.agendado_para).getTime() - new Date(b.agendado_para).getTime())

  const completed = followups
    .filter(f => f.concluido)
    .sort((a, b) => new Date(b.concluido_em ?? b.criado_em).getTime() - new Date(a.concluido_em ?? a.criado_em).getTime())

  function getStatusInfo(agendado_para: string) {
    const dt = new Date(agendado_para)
    const now = new Date()
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    const isOverdue = dt < now
    const isToday = dt <= todayEnd && !isOverdue
    return { isOverdue, isToday }
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Novo retorno
        </p>
        <div className="flex gap-2">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex flex-1 items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-left transition-colors",
                  "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {selectedDate
                  ? format(selectedDate, "dd 'de' MMM, yyyy", { locale: ptBR })
                  : "Selecionar data"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => { setSelectedDate(d); setCalendarOpen(false) }}
                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          <input
            type="time"
            value={selectedHora}
            onChange={e => setSelectedHora(e.target.value)}
            required
            className="w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <Textarea
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          placeholder="Motivo do retorno (opcional)..."
          rows={2}
          className="resize-none text-sm"
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={salvando || !selectedDate}
            className="gap-1.5 bg-[#16255c] hover:bg-[#16255c] hover:opacity-90"
          >
            {salvando
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Bell className="h-3.5 w-3.5" />}
            {salvando ? "Agendando..." : "Agendar retorno"}
          </Button>
        </div>
      </form>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Pendentes */}
      {!loading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Aguardando
            </p>
            {pending.length > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {pending.length}
              </span>
            )}
          </div>

          {pending.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-8 text-muted-foreground">
              <Clock className="h-6 w-6 opacity-30" />
              <p className="text-sm">Nenhum retorno agendado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pending.map(f => {
                const { isOverdue, isToday } = getStatusInfo(f.agendado_para)
                return (
                  <div
                    key={f.id}
                    className={cn(
                      "group relative rounded-xl border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
                      "border-l-[3px]",
                      isOverdue ? "border-l-red-400" : isToday ? "border-l-amber-400" : "border-l-slate-300"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            "text-sm font-semibold",
                            isOverdue ? "text-red-600" : isToday ? "text-amber-700" : "text-foreground"
                          )}>
                            {format(new Date(f.agendado_para), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                          {isOverdue && (
                            <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                              Atrasado
                            </span>
                          )}
                          {isToday && !isOverdue && (
                            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                              Hoje
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{f.usuario_nome}</p>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => handleConcluir(f.id)}
                          disabled={concluding === f.id}
                          title="Marcar como realizado"
                          className={cn(
                            "rounded-lg p-1.5 text-muted-foreground/40 transition-colors",
                            "opacity-0 group-hover:opacity-100",
                            "hover:text-emerald-600 hover:bg-emerald-50",
                            concluding === f.id && "opacity-100"
                          )}
                        >
                          {concluding === f.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <CheckCircle2 className="h-4 w-4" />}
                        </button>

                        {(currentUserId === f.usuario_id || !currentUserId) && (
                          <button
                            onClick={() => handleDelete(f.id)}
                            disabled={deleting === f.id}
                            title="Excluir retorno"
                            className={cn(
                              "rounded-lg p-1.5 text-muted-foreground/30 transition-colors",
                              "opacity-0 group-hover:opacity-100",
                              "hover:text-red-500 hover:bg-red-50",
                              deleting === f.id && "opacity-100"
                            )}
                          >
                            {deleting === f.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Trash2 className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {f.descricao && (
                      <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {f.descricao}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Concluídos */}
      {!loading && completed.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Realizados
            </p>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {completed.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {completed.map(f => (
              <div
                key={f.id}
                className="flex items-start gap-2.5 rounded-xl border bg-muted/20 px-3 py-2.5 opacity-60"
              >
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground line-through">
                    {format(new Date(f.agendado_para), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                  {f.descricao && (
                    <p className="text-xs text-muted-foreground/80 line-clamp-1">
                      {f.descricao}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground/60">
                    {f.usuario_nome}
                    {f.concluido_em && (
                      <> · realizado {format(new Date(f.concluido_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
