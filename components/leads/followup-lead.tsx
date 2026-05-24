"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Bell, CheckCircle2, Trash2, Loader2, CalendarClock, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
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

function defaultDateTime(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  // Format as datetime-local value: YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function nowDateTimeLocal(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function FollowupLead({ leadId, currentUserId, onFollowupChange }: FollowupLeadProps) {
  const [followups, setFollowups] = useState<Followup[]>([])
  const [loading, setLoading] = useState(true)
  const [agendadoPara, setAgendadoPara] = useState(defaultDateTime)
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
    if (!agendadoPara) return

    // Convert datetime-local value to MySQL-compatible datetime string
    const agendadoParaMySQL = agendadoPara.replace('T', ' ') + ':00'

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
        toast.error(data.mensagem ?? "Erro ao agendar follow-up")
        return
      }
      const updated = [...followups, data.followup]
      setFollowups(updated)
      setDescricao("")
      setAgendadoPara(defaultDateTime())
      onFollowupChange?.(computeNext(updated))
      toast.success("Follow-up agendado!")
    } catch {
      toast.error("Erro ao agendar follow-up")
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
          <CalendarClock className="h-4 w-4 text-blue-600" />
        </div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Follow-ups
        </h3>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/40 p-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Data e hora</label>
          <input
            type="datetime-local"
            value={agendadoPara}
            min={nowDateTimeLocal()}
            onChange={e => setAgendadoPara(e.target.value)}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Descrição (opcional)</label>
          <Textarea
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Ex: ligar para confirmar visita..."
            rows={2}
            className="resize-none text-sm"
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={salvando || !agendadoPara}
            className="gap-1.5 bg-[#16255c] hover:bg-[#16255c] hover:opacity-90"
          >
            {salvando
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Bell className="h-3.5 w-3.5" />}
            {salvando ? "Agendando..." : "Agendar"}
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
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pendentes ({pending.length})
          </p>

          {pending.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
              <Clock className="h-7 w-7 opacity-30" />
              <p className="text-sm">Nenhum follow-up pendente</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pending.map(f => {
                const { isOverdue, isToday } = getStatusInfo(f.agendado_para)
                return (
                  <div
                    key={f.id}
                    className="group rounded-lg border border-blue-100 bg-blue-50/60 p-3 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Bell className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          isOverdue ? "text-red-500" : isToday ? "text-orange-500" : "text-blue-500"
                        )} />
                        <span className={cn(
                          "text-xs font-semibold",
                          isOverdue ? "text-red-600" : isToday ? "text-orange-600" : "text-blue-700"
                        )}>
                          {format(new Date(f.agendado_para), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] font-semibold rounded-full bg-red-100 text-red-600 px-1.5 py-0.5">
                            Atrasado
                          </span>
                        )}
                        {isToday && !isOverdue && (
                          <span className="text-[10px] font-semibold rounded-full bg-orange-100 text-orange-600 px-1.5 py-0.5">
                            Hoje
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleConcluir(f.id)}
                          disabled={concluding === f.id}
                          title="Marcar como concluído"
                          className={cn(
                            "rounded p-0.5 text-muted-foreground/50 transition-colors",
                            "opacity-0 group-hover:opacity-100",
                            "hover:text-emerald-600 hover:bg-emerald-50",
                            concluding === f.id && "opacity-100"
                          )}
                        >
                          {concluding === f.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <CheckCircle2 className="h-3.5 w-3.5" />}
                        </button>

                        {(currentUserId === f.usuario_id || !currentUserId) && (
                          <button
                            onClick={() => handleDelete(f.id)}
                            disabled={deleting === f.id}
                            title="Excluir follow-up"
                            className={cn(
                              "rounded p-0.5 text-muted-foreground/40 transition-colors",
                              "opacity-0 group-hover:opacity-100",
                              "hover:text-red-500 hover:bg-red-50",
                              deleting === f.id && "opacity-100"
                            )}
                          >
                            {deleting === f.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {f.descricao && (
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        {f.descricao}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="font-medium text-blue-700/70">{f.usuario_nome}</span>
                      <span>·</span>
                      <span>
                        {format(new Date(f.criado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Concluídos */}
      {!loading && completed.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Concluídos ({completed.length})
          </p>
          <div className="space-y-2">
            {completed.map(f => (
              <div
                key={f.id}
                className="group rounded-lg border border-border bg-muted/20 p-3 space-y-1.5 opacity-70"
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold text-muted-foreground line-through">
                    {format(new Date(f.agendado_para), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>

                {f.descricao && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed line-through">
                    {f.descricao}
                  </p>
                )}

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="font-medium">{f.usuario_nome}</span>
                  {f.concluido_em && (
                    <>
                      <span>· Concluído em</span>
                      <span>
                        {format(new Date(f.concluido_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
