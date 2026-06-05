"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarIcon,
  CheckCircle2,
  Trash2,
  Loader2,
  Check,
  ChevronsUpDown,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

// ─── Types ───────────────────────────────────────────────────────────────────

interface CalendarioEvent {
  id: number
  lead_id: number | null
  lead_nome: string | null
  titulo: string | null
  usuario_id: number
  usuario_nome: string
  agendado_para: string
  descricao: string | null
  concluido: boolean
  concluido_em: string | null
  criado_em: string
}

interface LeadOption {
  id: string
  nome: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function defaultHora() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

type EventStatus = "overdue" | "today" | "upcoming" | "done"

function getEventStatus(event: CalendarioEvent): EventStatus {
  if (event.concluido) return "done"
  const dt = new Date(event.agendado_para)
  const now = new Date()
  if (dt < now) return "overdue"
  if (isToday(dt)) return "today"
  return "upcoming"
}

// ─── EventChip ───────────────────────────────────────────────────────────────

function EventChip({
  event,
  onClick,
}: {
  event: CalendarioEvent
  onClick: (e: React.MouseEvent) => void
}) {
  const status = getEventStatus(event)
  const dt = new Date(event.agendado_para)

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded px-1.5 py-0.5 text-[10px] truncate transition-opacity hover:opacity-75 block leading-relaxed",
        status === "done" && "bg-emerald-100 text-emerald-700",
        status === "overdue" && "bg-red-100 text-red-700",
        status === "today" && "bg-amber-100 text-amber-700",
        status === "upcoming" && "bg-blue-100 text-blue-700"
      )}
    >
      <span className="font-semibold">{format(dt, "HH:mm")}</span>{" "}
      {event.lead_nome || event.titulo || "Compromisso"}
    </button>
  )
}

// ─── DayCell ─────────────────────────────────────────────────────────────────

function DayCell({
  day,
  events,
  isCurrentMonth,
  showBorderRight,
  showBorderBottom,
  onClick,
  onEventClick,
}: {
  day: Date
  events: CalendarioEvent[]
  isCurrentMonth: boolean
  showBorderRight: boolean
  showBorderBottom: boolean
  onClick: () => void
  onEventClick: (event: CalendarioEvent) => void
}) {
  const today = isToday(day)
  const MAX_VISIBLE = 3
  const visible = events.slice(0, MAX_VISIBLE)
  const overflow = events.length - MAX_VISIBLE

  return (
    <div
      className={cn(
        "min-h-22.5 lg:min-h-27.5 p-1.5 transition-colors cursor-pointer",
        isCurrentMonth ? "hover:bg-muted/30" : "bg-muted/10 hover:bg-muted/20",
        showBorderRight && "border-r",
        showBorderBottom && "border-b"
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          "h-5 w-5 flex items-center justify-center rounded-full text-xs font-semibold mb-1 select-none",
          today
            ? "bg-[#16255c] text-white"
            : isCurrentMonth
            ? "text-foreground"
            : "text-muted-foreground/40"
        )}
      >
        {format(day, "d")}
      </div>

      <div className="space-y-0.5">
        {visible.map((event) => (
          <EventChip
            key={event.id}
            event={event}
            onClick={(e) => {
              e.stopPropagation()
              onEventClick(event)
            }}
          />
        ))}
        {overflow > 0 && (
          <p className="text-[10px] text-muted-foreground px-1.5">
            +{overflow} mais
          </p>
        )}
      </div>
    </div>
  )
}

// ─── CreateModal ─────────────────────────────────────────────────────────────

function CreateModal({
  open,
  onOpenChange,
  defaultDate,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDate: Date
  onCreated: (event: CalendarioEvent) => void
}) {
  const defaultDateRef = useRef(defaultDate)
  defaultDateRef.current = defaultDate

  const [selectedLead, setSelectedLead] = useState<LeadOption | null>(null)
  const [leads, setLeads] = useState<LeadOption[]>([])
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [comboOpen, setComboOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [titulo, setTitulo] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>(defaultDate)
  const [selectedHora, setSelectedHora] = useState(defaultHora)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [descricao, setDescricao] = useState("")
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelectedDate(defaultDateRef.current)
    setSelectedLead(null)
    setTitulo("")
    setDescricao("")
    setSelectedHora(defaultHora())
    setSearch("")
    setLeadsLoading(true)
    fetch("/api/calendario/leads")
      .then((r) => r.json())
      .then((d) =>
        setLeads(
          (d.leads ?? []).map((l: { id: string | number; nome: string }) => ({
            id: String(l.id),
            nome: l.nome,
          }))
        )
      )
      .catch(() => toast.error("Erro ao carregar leads"))
      .finally(() => setLeadsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const filteredLeads = useMemo(
    () =>
      search
        ? leads.filter((l) => l.nome.toLowerCase().includes(search.toLowerCase()))
        : leads,
    [leads, search]
  )

  const canSubmit = selectedLead !== null || titulo.trim().length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    const agendadoParaMySQL = `${format(selectedDate, "yyyy-MM-dd")} ${selectedHora}:00`

    setSalvando(true)
    try {
      let res: Response
      let leadNome: string | null = null

      if (selectedLead) {
        // Compromisso vinculado a um lead
        res = await fetch(`/api/leads/${selectedLead.id}/followups`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agendado_para: agendadoParaMySQL,
            descricao: descricao.trim() || null,
          }),
        })
        leadNome = selectedLead.nome
      } else {
        // Compromisso standalone (sem lead)
        res = await fetch("/api/followups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titulo: titulo.trim(),
            agendado_para: agendadoParaMySQL,
            descricao: descricao.trim() || null,
          }),
        })
      }

      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.mensagem ?? "Erro ao agendar compromisso")
        return
      }
      toast.success("Compromisso agendado!")
      onCreated({ ...data.followup, lead_nome: leadNome })
      onOpenChange(false)
    } catch {
      toast.error("Erro ao agendar compromisso")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Novo Compromisso</DialogTitle>
          <DialogDescription>
            Agende um retorno vinculado a um lead
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Lead selector (opcional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Lead{" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </label>
              {selectedLead && (
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                >
                  <span className={!selectedLead ? "text-muted-foreground" : ""}>
                    {selectedLead ? selectedLead.nome : "Selecionar lead..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[380px] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Buscar lead..."
                    value={search}
                    onValueChange={setSearch}
                  />
                  <CommandList className="max-h-[200px]">
                    {leadsLoading && (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {!leadsLoading && filteredLeads.length === 0 && (
                      <CommandEmpty>Nenhum lead encontrado.</CommandEmpty>
                    )}
                    {!leadsLoading && (
                      <CommandGroup>
                        {filteredLeads.map((lead) => (
                          <CommandItem
                            key={lead.id}
                            value={lead.nome}
                            onSelect={() => {
                              setSelectedLead(lead)
                              setComboOpen(false)
                              setSearch("")
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedLead?.id === lead.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {lead.nome}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Título (obrigatório quando não há lead) */}
          {!selectedLead && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Título do compromisso{" "}
                <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Reunião de equipe, Visita ao cliente..."
                required={!selectedLead}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          )}

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium">Data</label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {format(selectedDate, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => {
                      if (d) {
                        setSelectedDate(d)
                        setCalendarOpen(false)
                      }
                    }}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-sm font-medium">Hora</label>
              <input
                type="time"
                value={selectedHora}
                onChange={(e) => setSelectedHora(e.target.value)}
                required
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Motivo / Descrição{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o motivo do retorno..."
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || salvando}
              className="bg-[#16255c] hover:bg-[#16255c] hover:opacity-90"
            >
              {salvando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Agendar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── EventDetailDialog ────────────────────────────────────────────────────────

function EventDetailDialog({
  open,
  onOpenChange,
  event,
  onMarkDone,
  onDelete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: CalendarioEvent | null
  onMarkDone: (id: number) => Promise<void>
  onDelete: (id: number) => Promise<void>
}) {
  const [loadingDone, setLoadingDone] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState(false)

  if (!event) return null

  const dt = new Date(event.agendado_para)
  const status = getEventStatus(event)

  async function handleMarkDone() {
    setLoadingDone(true)
    await onMarkDone(event!.id)
    setLoadingDone(false)
    onOpenChange(false)
  }

  async function handleDelete() {
    setLoadingDelete(true)
    await onDelete(event!.id)
    setLoadingDelete(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Compromisso</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="flex items-center gap-2.5">
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm font-semibold text-[#16255c]">
              {event.lead_nome || event.titulo || `Compromisso #${event.id}`}
            </span>
            {!event.lead_id && (
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                Sem lead
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span
              className={cn(
                "text-sm",
                status === "overdue" && "text-red-600 font-medium",
                status === "today" && "text-amber-700 font-medium"
              )}
            >
              {format(dt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
            {status === "overdue" && (
              <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">
                Atrasado
              </span>
            )}
            {status === "today" && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                Hoje
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{event.usuario_nome}</span>
          </div>

          {event.descricao && (
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {event.descricao}
              </p>
            </div>
          )}

          {event.concluido && event.concluido_em && (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="text-sm">
                Realizado em{" "}
                {format(new Date(event.concluido_em), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </span>
            </div>
          )}
        </div>

        {!event.concluido && (
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={loadingDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              {loadingDelete ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 mr-1" />
              )}
              Excluir
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleMarkDone}
              disabled={loadingDone}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loadingDone ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              )}
              Marcar como realizado
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── CalendarioView (main) ────────────────────────────────────────────────────

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export function CalendarioView({ userId }: { userId: number }) {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [events, setEvents] = useState<CalendarioEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date())
  const [detailEvent, setDetailEvent] = useState<CalendarioEvent | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Calendar grid: all days from start-of-week of first day to end-of-week of last day
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentDate])

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarioEvent[]> = {}
    for (const event of events) {
      const key = format(new Date(event.agendado_para), "yyyy-MM-dd")
      if (!map[key]) map[key] = []
      map[key].push(event)
    }
    return map
  }, [events])

  const fetchEvents = useCallback(async (date: Date) => {
    setLoading(true)
    try {
      const y = date.getFullYear()
      const m = date.getMonth() + 1
      const res = await fetch(`/api/followups/calendario?year=${y}&month=${m}`)
      const data = await res.json()
      if (data.success) setEvents(data.followups ?? [])
    } catch {
      toast.error("Erro ao carregar compromissos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents(currentDate)
  }, [currentDate, fetchEvents])

  function handleDayClick(day: Date) {
    setSelectedDay(day)
    setCreateOpen(true)
  }

  function handleEventClick(event: CalendarioEvent) {
    setDetailEvent(event)
    setDetailOpen(true)
  }

  function handleCreated(event: CalendarioEvent) {
    setEvents((prev) => [...prev, event])
  }

  async function handleMarkDone(id: number) {
    try {
      const res = await fetch(`/api/followups/${id}`, { method: "PATCH" })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.mensagem ?? "Erro ao concluir")
        return
      }
      setEvents((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, ...data.followup, lead_nome: e.lead_nome } : e
        )
      )
      toast.success("Compromisso realizado!")
    } catch {
      toast.error("Erro ao concluir compromisso")
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/followups/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.mensagem ?? "Erro ao excluir")
        return
      }
      setEvents((prev) => prev.filter((e) => e.id !== id))
      toast.success("Compromisso excluído!")
    } catch {
      toast.error("Erro ao excluir compromisso")
    }
  }

  const monthLabel = format(currentDate, "MMMM yyyy", { locale: ptBR }).replace(
    /^\w/,
    (c) => c.toUpperCase()
  )

  const total = calendarDays.length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate((d) => subMonths(d, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-base font-semibold min-w-47.5 text-center capitalize">
            {monthLabel}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate((d) => addMonths(d, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="text-xs"
          >
            Hoje
          </Button>
        </div>

        <Button
          onClick={() => {
            setSelectedDay(new Date())
            setCreateOpen(true)
          }}
          className="gap-2 bg-[#16255c] hover:bg-[#16255c] hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Novo Compromisso
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className={cn("grid grid-cols-7 relative", loading && "opacity-50")}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {calendarDays.map((day, i) => {
            const dateKey = format(day, "yyyy-MM-dd")
            return (
              <DayCell
                key={dateKey}
                day={day}
                events={eventsByDate[dateKey] ?? []}
                isCurrentMonth={isSameMonth(day, currentDate)}
                showBorderRight={i % 7 !== 6}
                showBorderBottom={i < total - 7}
                onClick={() => handleDayClick(day)}
                onEventClick={handleEventClick}
              />
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {[
          { color: "bg-blue-100", label: "Agendado" },
          { color: "bg-amber-100", label: "Hoje" },
          { color: "bg-red-100", label: "Atrasado" },
          { color: "bg-emerald-100", label: "Realizado" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={cn("w-3 h-3 rounded", color)} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <CreateModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultDate={selectedDay}
        onCreated={handleCreated}
      />

      <EventDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        event={detailEvent}
        onMarkDone={handleMarkDone}
        onDelete={handleDelete}
      />
    </div>
  )
}
