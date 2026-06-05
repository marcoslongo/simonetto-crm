'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO, addDays,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import {
  ChevronLeft, ChevronRight, Plus, Loader2, Trash2,
  Settings, CalendarDays, Clock, Users, MapPin, Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

// ── Tipos ──────────────────────────────────────────────────────────────────

interface Sala {
  id: number
  loja_id: number
  nome: string
  capacidade: number | null
  descricao: string | null
  cor: string
  ativo: boolean
}

interface Evento {
  id: number
  loja_id: number
  sala_id: number | null
  sala_nome: string | null
  sala_cor: string | null
  titulo: string
  descricao: string | null
  usuario_id: number
  usuario_nome: string
  inicio: string
  fim: string | null
  tipo: string
  cor: string
  criado_em: string
}

const TIPOS: { value: string; label: string; cor: string }[] = [
  { value: 'evento',      label: 'Evento',       cor: '#3b82f6' },
  { value: 'reuniao',     label: 'Reunião',       cor: '#8b5cf6' },
  { value: 'treinamento', label: 'Treinamento',   cor: '#f59e0b' },
  { value: 'visita',      label: 'Visita',        cor: '#10b981' },
  { value: 'outro',       label: 'Outro',         cor: '#6b7280' },
]

const TIPO_LABEL: Record<string, string> = Object.fromEntries(TIPOS.map(t => [t.value, t.label]))
const TIPO_COR:   Record<string, string> = Object.fromEntries(TIPOS.map(t => [t.value, t.cor]))

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// ── Props ──────────────────────────────────────────────────────────────────

interface AgendaCompartilhadaViewProps {
  lojaId: number | null
  lojaIds: number[]
  isAdmin: boolean
  isGerente: boolean
  currentUserId: number
  currentUserName: string
}

// ── Componente principal ───────────────────────────────────────────────────

export function AgendaCompartilhadaView({
  lojaId,
  lojaIds,
  isAdmin,
  isGerente,
  currentUserId,
}: AgendaCompartilhadaViewProps) {
  const primaryLojaId = lojaId ?? lojaIds[0] ?? null

  const [currentDate, setCurrentDate] = useState(new Date())
  const [eventos, setEventos] = useState<Evento[]>([])
  const [salas, setSalas] = useState<Sala[]>([])
  const [loading, setLoading] = useState(false)

  // Modal de evento
  const [eventoOpen, setEventoOpen]     = useState(false)
  const [selectedDay, setSelectedDay]   = useState<Date | null>(null)
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null)
  const [editMode, setEditMode]         = useState(false)

  // Modal de salas
  const [salasOpen, setSalasOpen] = useState(false)

  // Filtro de sala
  const [filtroSala, setFiltroSala] = useState<number | null>(null)

  // Form de evento
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    inicio: '',
    fim: '',
    tipo: 'evento',
    sala_id: '',
    cor: '#3b82f6',
  })
  const [saving, setSaving] = useState(false)

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchEventos = useCallback(async () => {
    if (!primaryLojaId) return
    setLoading(true)
    try {
      const year  = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      const res  = await fetch(`/api/agenda-compartilhada?loja_id=${primaryLojaId}&year=${year}&month=${month}`)
      const data = await res.json()
      if (data.success) setEventos(data.eventos ?? [])
    } catch { toast.error('Erro ao carregar eventos') }
    finally { setLoading(false) }
  }, [primaryLojaId, currentDate])

  const fetchSalas = useCallback(async () => {
    if (!primaryLojaId) return
    try {
      const res  = await fetch(`/api/salas-reuniao?loja_id=${primaryLojaId}`)
      const data = await res.json()
      if (data.success) setSalas(data.salas ?? [])
    } catch {}
  }, [primaryLojaId])

  useEffect(() => { fetchEventos() }, [fetchEventos])
  useEffect(() => { fetchSalas() },  [fetchSalas])

  // ── Grade do calendário ──────────────────────────────────────────────────

  const monthStart = startOfMonth(currentDate)
  const monthEnd   = endOfMonth(currentDate)
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd    = endOfWeek(monthEnd,     { weekStartsOn: 0 })

  const days: Date[] = []
  let d = gridStart
  while (d <= gridEnd) { days.push(d); d = addDays(d, 1) }

  const total = days.length

  const eventosVisiveis = filtroSala
    ? eventos.filter(e => e.sala_id === filtroSala)
    : eventos

  const eventosDoDia = (day: Date) =>
    eventosVisiveis.filter(e => isSameDay(parseISO(e.inicio), day))

  // ── Handlers ─────────────────────────────────────────────────────────────

  const openCreate = (day: Date) => {
    if (!primaryLojaId) return
    setSelectedDay(day)
    setSelectedEvento(null)
    setEditMode(false)
    const def = TIPOS[0]
    setForm({
      titulo: '', descricao: '',
      inicio: format(day, 'yyyy-MM-dd') + 'T09:00',
      fim:    format(day, 'yyyy-MM-dd') + 'T10:00',
      tipo: def.value, sala_id: '', cor: def.cor,
    })
    setEventoOpen(true)
  }

  const openView = (e: React.MouseEvent, evento: Evento) => {
    e.stopPropagation()
    setSelectedEvento(evento)
    setSelectedDay(null)
    setEditMode(false)
    setEventoOpen(true)
  }

  const enterEditMode = (evento: Evento) => {
    setEditMode(true)
    setForm({
      titulo:    evento.titulo,
      descricao: evento.descricao ?? '',
      inicio:    evento.inicio.slice(0, 16).replace(' ', 'T'),
      fim:       evento.fim ? evento.fim.slice(0, 16).replace(' ', 'T') : '',
      tipo:      evento.tipo,
      sala_id:   evento.sala_id ? String(evento.sala_id) : '',
      cor:       evento.cor,
    })
  }

  const handleSave = async () => {
    if (!primaryLojaId || !form.titulo.trim() || !form.inicio) return
    setSaving(true)
    try {
      const body = {
        loja_id:   primaryLojaId,
        titulo:    form.titulo.trim(),
        descricao: form.descricao.trim() || null,
        inicio:    form.inicio.replace('T', ' ') + ':00',
        fim:       form.fim ? form.fim.replace('T', ' ') + ':00' : null,
        tipo:      form.tipo,
        cor:       form.cor,
        sala_id:   form.sala_id ? Number(form.sala_id) : null,
      }

      if (editMode && selectedEvento) {
        const res  = await fetch(`/api/agenda-compartilhada/${selectedEvento.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, loja_id: primaryLojaId }),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.mensagem)
        setEventos(prev => prev.map(ev => ev.id === selectedEvento.id ? data.evento : ev))
        toast.success('Evento atualizado')
      } else {
        const res  = await fetch('/api/agenda-compartilhada', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.mensagem)
        setEventos(prev => [...prev, data.evento])
        toast.success('Evento criado')
      }
      setEventoOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar evento')
    } finally { setSaving(false) }
  }

  const handleDelete = async (evento: Evento) => {
    if (!primaryLojaId) return
    if (!confirm(`Excluir "${evento.titulo}"?`)) return
    try {
      const res  = await fetch(`/api/agenda-compartilhada/${evento.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loja_id: primaryLojaId }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.mensagem)
      setEventos(prev => prev.filter(ev => ev.id !== evento.id))
      setEventoOpen(false)
      toast.success('Evento excluído')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir evento')
    }
  }

  const canEdit = (ev: Evento) => isAdmin || isGerente || ev.usuario_id === currentUserId

  // ── Render ────────────────────────────────────────────────────────────────

  if (!primaryLojaId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
        <CalendarDays className="h-10 w-10 opacity-20" />
        <p className="text-sm">Nenhuma loja vinculada à sua conta.</p>
      </div>
    )
  }

  const monthLabel = format(currentDate, 'MMMM yyyy', { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())

  return (
    <div className="space-y-4">

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-base font-semibold min-w-47.5 text-center capitalize">
            {monthLabel}
          </span>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="text-xs">
            Hoje
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtro por sala */}
          {salas.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFiltroSala(null)}
                className={cn('text-xs px-2.5 py-1 rounded-full border transition-colors',
                  filtroSala === null
                    ? 'bg-[#16255c] text-white border-[#16255c]'
                    : 'border-border text-muted-foreground hover:border-[#16255c]/40'
                )}
              >
                Todos
              </button>
              {salas.map(s => (
                <button
                  key={s.id}
                  onClick={() => setFiltroSala(filtroSala === s.id ? null : s.id)}
                  className={cn('text-xs px-2.5 py-1 rounded-full border transition-colors',
                    filtroSala === s.id ? 'text-white border-transparent' : 'border-border text-muted-foreground'
                  )}
                  style={filtroSala === s.id ? { backgroundColor: s.cor, borderColor: s.cor } : {}}
                >
                  <span className="inline-block h-1.5 w-1.5 rounded-full mr-1" style={{ backgroundColor: s.cor }} />
                  {s.nome}
                </button>
              ))}
            </div>
          )}

          {(isGerente || isAdmin) && (
            <Button variant="outline" className="gap-2" onClick={() => setSalasOpen(true)}>
              <Settings className="h-4 w-4" />
              Salas
            </Button>
          )}

          <Button
            className="gap-2 bg-[#16255c] hover:bg-[#16255c] hover:opacity-90"
            onClick={() => openCreate(new Date())}
          >
            <Plus className="h-4 w-4" />
            Novo Compromisso
          </Button>
        </div>
      </div>

      {/* ── Grade do calendário ──────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        {/* Cabeçalho dias da semana */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {WEEK_DAYS.map(day => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>

        {/* Dias */}
        <div className={cn('grid grid-cols-7 relative', loading && 'opacity-50')}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {days.map((day, i) => {
            const inMonth   = isSameMonth(day, currentDate)
            const today     = isToday(day)
            const dayEvents = eventosDoDia(day)
            const overflow  = dayEvents.length > 3

            return (
              <div
                key={i}
                onClick={() => openCreate(day)}
                className={cn(
                  'min-h-22.5 lg:min-h-27.5 p-1.5 transition-colors cursor-pointer',
                  inMonth  ? 'hover:bg-muted/30' : 'bg-muted/10 hover:bg-muted/20',
                  i % 7 !== 6 && 'border-r',
                  i < total - 7 && 'border-b',
                )}
              >
                <div className={cn(
                  'h-5 w-5 flex items-center justify-center rounded-full text-xs font-semibold mb-1 select-none',
                  today
                    ? 'bg-[#16255c] text-white'
                    : inMonth ? 'text-foreground' : 'text-muted-foreground/40',
                )}>
                  {format(day, 'd')}
                </div>

                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map(ev => (
                    <button
                      key={ev.id}
                      onClick={e => openView(e, ev)}
                      className="w-full text-left text-[10px] leading-tight px-1.5 py-0.5 rounded font-medium truncate transition-opacity hover:opacity-75 block"
                      style={{
                        backgroundColor: (ev.sala_cor ?? ev.cor) + '25',
                        color: ev.sala_cor ?? ev.cor,
                        borderLeft: `2px solid ${ev.sala_cor ?? ev.cor}`,
                      }}
                    >
                      <span className="font-semibold">{format(parseISO(ev.inicio), 'HH:mm')}</span>{' '}
                      {ev.titulo}
                    </button>
                  ))}
                  {overflow && (
                    <p className="text-[10px] text-muted-foreground px-1.5">+{dayEvents.length - 3} mais</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Legenda de tipos ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {TIPOS.map(t => (
          <div key={t.value} className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: t.cor + '40', border: `2px solid ${t.cor}` }} />
            <span>{t.label}</span>
          </div>
        ))}
      </div>

      {/* ── Dialog: ver evento ───────────────────────────────────────────── */}
      <Dialog
        open={eventoOpen && !!selectedEvento && !editMode}
        onOpenChange={open => { if (!open) setEventoOpen(false) }}
      >
        <DialogContent className="sm:max-w-100">
          {selectedEvento && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: selectedEvento.sala_cor ?? selectedEvento.cor }} />
                  <DialogTitle className="text-base">{selectedEvento.titulo}</DialogTitle>
                </div>
              </DialogHeader>

              <div className="space-y-3 py-1">
                <Badge variant="outline" style={{
                  color:           TIPO_COR[selectedEvento.tipo],
                  borderColor:     TIPO_COR[selectedEvento.tipo] + '60',
                  backgroundColor: TIPO_COR[selectedEvento.tipo] + '10',
                }}>
                  {TIPO_LABEL[selectedEvento.tipo] ?? selectedEvento.tipo}
                </Badge>

                <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-foreground">
                      {format(parseISO(selectedEvento.inicio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    {selectedEvento.fim && (
                      <p className="text-xs">até {format(parseISO(selectedEvento.fim), 'HH:mm')}</p>
                    )}
                  </div>
                </div>

                {selectedEvento.sala_nome && (
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{selectedEvento.sala_nome}</span>
                  </div>
                )}

                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>{selectedEvento.usuario_nome}</span>
                </div>

                {selectedEvento.descricao && (
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {selectedEvento.descricao}
                    </p>
                  </div>
                )}
              </div>

              {canEdit(selectedEvento) && (
                <DialogFooter className="gap-2 sm:justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(selectedEvento)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Excluir
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => enterEditMode(selectedEvento)}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Editar
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog: criar / editar evento ───────────────────────────────── */}
      <Dialog
        open={eventoOpen && (!selectedEvento || editMode)}
        onOpenChange={open => { if (!open) { setEventoOpen(false); setEditMode(false) } }}
      >
        <DialogContent className="sm:max-w-110">
          <DialogHeader>
            <DialogTitle>
              {editMode
                ? 'Editar evento'
                : `Novo Compromisso${selectedDay ? ' — ' + format(selectedDay, "dd 'de' MMM", { locale: ptBR }) : ''}`
              }
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Título */}
            <div className="space-y-1.5">
              <Label htmlFor="ac-titulo">Título <span className="text-destructive">*</span></Label>
              <Input
                id="ac-titulo"
                value={form.titulo}
                onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                placeholder="Nome do evento"
                autoFocus
              />
            </div>

            {/* Tipo */}
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <div className="flex flex-wrap gap-2">
                {TIPOS.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, tipo: t.value, cor: t.cor }))}
                    className={cn(
                      'text-xs px-3 py-1 rounded-full border-2 transition-all font-medium',
                      form.tipo === t.value ? 'text-white border-transparent' : 'border-border text-muted-foreground'
                    )}
                    style={form.tipo === t.value ? { backgroundColor: t.cor, borderColor: t.cor } : {}}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sala */}
            {salas.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="ac-sala">Sala de reunião</Label>
                <Select
                  value={form.sala_id || 'none'}
                  onValueChange={v => setForm(p => ({ ...p, sala_id: v === 'none' ? '' : v }))}
                >
                  <SelectTrigger id="ac-sala">
                    <SelectValue placeholder="Sem sala específica" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem sala específica</SelectItem>
                    {salas.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.cor }} />
                          {s.nome}{s.capacidade ? ` (${s.capacidade} pessoas)` : ''}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Início / Fim */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ac-inicio">Início <span className="text-destructive">*</span></Label>
                <Input
                  id="ac-inicio"
                  type="datetime-local"
                  value={form.inicio}
                  onChange={e => setForm(p => ({ ...p, inicio: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ac-fim">Fim</Label>
                <Input
                  id="ac-fim"
                  type="datetime-local"
                  value={form.fim}
                  onChange={e => setForm(p => ({ ...p, fim: e.target.value }))}
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <Label htmlFor="ac-descricao">Descrição <span className="font-normal text-muted-foreground">(opcional)</span></Label>
              <Textarea
                id="ac-descricao"
                value={form.descricao}
                onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                placeholder="Detalhes opcionais..."
                rows={3}
                className="resize-none text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setEventoOpen(false); setEditMode(false) }}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.titulo.trim() || !form.inicio}
              className="bg-[#16255c] hover:bg-[#16255c] hover:opacity-90"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editMode ? 'Salvar alterações' : 'Criar evento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: gerenciar salas ──────────────────────────────────────── */}
      <SalasDialog
        open={salasOpen}
        onOpenChange={setSalasOpen}
        lojaId={primaryLojaId}
        salas={salas}
        onUpdate={setSalas}
      />
    </div>
  )
}

// ── Diálogo de Salas ───────────────────────────────────────────────────────

interface SalasDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lojaId: number
  salas: Sala[]
  onUpdate: (salas: Sala[]) => void
}

const CORES_SALA = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#6b7280']

function SalasDialog({ open, onOpenChange, lojaId, salas, onUpdate }: SalasDialogProps) {
  const [form, setForm] = useState({ nome: '', capacidade: '', descricao: '', cor: '#3b82f6' })
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    if (!form.nome.trim()) return
    setSaving(true)
    try {
      const res  = await fetch('/api/salas-reuniao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loja_id:    lojaId,
          nome:       form.nome.trim(),
          capacidade: form.capacidade ? Number(form.capacidade) : null,
          descricao:  form.descricao.trim() || null,
          cor:        form.cor,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.mensagem)
      onUpdate([...salas, data.sala])
      setForm({ nome: '', capacidade: '', descricao: '', cor: '#3b82f6' })
      toast.success('Sala criada')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar sala')
    } finally { setSaving(false) }
  }

  const handleDelete = async (sala: Sala) => {
    if (!confirm(`Excluir a sala "${sala.nome}"?`)) return
    try {
      const res  = await fetch(`/api/salas-reuniao/${sala.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loja_id: lojaId }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.mensagem)
      onUpdate(salas.filter(s => s.id !== sala.id))
      toast.success('Sala removida')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover sala')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-110">
        <DialogHeader>
          <DialogTitle>Salas de Reunião</DialogTitle>
        </DialogHeader>

        {/* Salas existentes */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {salas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma sala cadastrada.</p>
          ) : salas.map(s => (
            <div key={s.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
              <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: s.cor }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.nome}</p>
                {(s.capacidade || s.descricao) && (
                  <p className="text-xs text-muted-foreground truncate">
                    {s.capacidade ? `${s.capacidade} pessoas` : ''}
                    {s.capacidade && s.descricao ? ' · ' : ''}
                    {s.descricao ?? ''}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                onClick={() => handleDelete(s)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Nova sala */}
        <div className="space-y-3 border-t pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nova sala</p>

          <Input
            placeholder="Nome da sala *"
            value={form.nome}
            onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Capacidade (pessoas)"
              type="number"
              min={1}
              value={form.capacidade}
              onChange={e => setForm(p => ({ ...p, capacidade: e.target.value }))}
            />
            <div className="flex items-center gap-1.5">
              {CORES_SALA.map(cor => (
                <button
                  key={cor}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, cor }))}
                  className={cn(
                    'h-6 w-6 rounded-full border-2 transition-transform hover:scale-110',
                    form.cor === cor ? 'border-foreground scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: cor }}
                />
              ))}
            </div>
          </div>

          <Input
            placeholder="Descrição (opcional)"
            value={form.descricao}
            onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button
            onClick={handleCreate}
            disabled={saving || !form.nome.trim()}
            className="bg-[#16255c] hover:bg-[#16255c] hover:opacity-90"
          >
            {saving
              ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
              : <Plus className="h-4 w-4 mr-1.5" />
            }
            Criar sala
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
