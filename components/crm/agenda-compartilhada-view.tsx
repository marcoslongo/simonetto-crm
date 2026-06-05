'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO, addDays,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import {
  ChevronLeft, ChevronRight, Plus, X, Loader2, Trash2,
  Settings, CalendarDays, Clock, Users, MapPin, Pencil, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

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
  currentUserName,
}: AgendaCompartilhadaViewProps) {
  const primaryLojaId = lojaId ?? lojaIds[0] ?? null

  const [currentDate, setCurrentDate] = useState(new Date())
  const [eventos, setEventos] = useState<Evento[]>([])
  const [salas, setSalas] = useState<Sala[]>([])
  const [loading, setLoading] = useState(false)

  // Modal de evento
  const [showModal, setShowModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null)
  const [editMode, setEditMode] = useState(false)

  // Filtro de sala
  const [filtroSala, setFiltroSala] = useState<number | null>(null)

  // Modal de gerenciar salas
  const [showSalasModal, setShowSalasModal] = useState(false)

  // Form de novo evento
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    inicio: '',
    fim: '',
    tipo: 'evento',
    sala_id: '' as string,
    cor: '#3b82f6',
  })
  const [saving, setSaving] = useState(false)

  // ── Busca de dados ───────────────────────────────────────────────────────

  const fetchEventos = useCallback(async () => {
    if (!primaryLojaId) return
    setLoading(true)
    try {
      const year  = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      const res = await fetch(`/api/agenda-compartilhada?loja_id=${primaryLojaId}&year=${year}&month=${month}`)
      const data = await res.json()
      if (data.success) setEventos(data.eventos ?? [])
    } catch { toast.error('Erro ao carregar eventos') }
    finally { setLoading(false) }
  }, [primaryLojaId, currentDate])

  const fetchSalas = useCallback(async () => {
    if (!primaryLojaId) return
    try {
      const res = await fetch(`/api/salas-reuniao?loja_id=${primaryLojaId}`)
      const data = await res.json()
      if (data.success) setSalas(data.salas ?? [])
    } catch {}
  }, [primaryLojaId])

  useEffect(() => { fetchEventos() }, [fetchEventos])
  useEffect(() => { fetchSalas() }, [fetchSalas])

  // ── Calendário: dias da grade ────────────────────────────────────────────

  const monthStart = startOfMonth(currentDate)
  const monthEnd   = endOfMonth(currentDate)
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd    = endOfWeek(monthEnd,   { weekStartsOn: 0 })

  const days: Date[] = []
  let d = gridStart
  while (d <= gridEnd) { days.push(d); d = addDays(d, 1) }

  const eventosVisiveis = filtroSala
    ? eventos.filter(e => e.sala_id === filtroSala)
    : eventos

  const eventosDoDia = (day: Date) =>
    eventosVisiveis.filter(e => isSameDay(parseISO(e.inicio), day))

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleDayClick = (day: Date) => {
    if (!primaryLojaId) return
    setSelectedDay(day)
    setSelectedEvento(null)
    setEditMode(false)
    const defaultTipo = TIPOS[0]
    setForm({
      titulo: '',
      descricao: '',
      inicio: format(day, 'yyyy-MM-dd') + 'T09:00',
      fim:    format(day, 'yyyy-MM-dd') + 'T10:00',
      tipo: defaultTipo.value,
      sala_id: '',
      cor: defaultTipo.cor,
    })
    setShowModal(true)
  }

  const handleEventoClick = (e: React.MouseEvent, evento: Evento) => {
    e.stopPropagation()
    setSelectedEvento(evento)
    setSelectedDay(null)
    setEditMode(false)
    setShowModal(true)
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
        const res = await fetch(`/api/agenda-compartilhada/${selectedEvento.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, loja_id: primaryLojaId }),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.mensagem)
        setEventos(prev => prev.map(e => e.id === selectedEvento.id ? data.evento : e))
        toast.success('Evento atualizado')
      } else {
        const res = await fetch('/api/agenda-compartilhada', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.mensagem)
        setEventos(prev => [...prev, data.evento])
        toast.success('Evento criado')
      }
      setShowModal(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar evento')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (evento: Evento) => {
    if (!primaryLojaId) return
    if (!confirm(`Excluir "${evento.titulo}"?`)) return
    try {
      const res = await fetch(`/api/agenda-compartilhada/${evento.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loja_id: primaryLojaId }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.mensagem)
      setEventos(prev => prev.filter(e => e.id !== evento.id))
      setShowModal(false)
      toast.success('Evento excluído')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir evento')
    }
  }

  const canEdit = (evento: Evento) =>
    isAdmin || isGerente || evento.usuario_id === currentUserId

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

  // ── Render ────────────────────────────────────────────────────────────────

  if (!primaryLojaId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
        <CalendarDays className="h-10 w-10 opacity-20" />
        <p className="text-sm">Nenhuma loja vinculada à sua conta.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        {/* Navegação do mês */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-base font-semibold text-[#16255c] min-w-32 text-center capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setCurrentDate(new Date())}>
            Hoje
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtro por sala */}
          {salas.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFiltroSala(null)}
                className={cn('text-xs px-2.5 py-1 rounded-full border transition-colors', filtroSala === null ? 'bg-[#16255c] text-white border-[#16255c]' : 'border-border text-muted-foreground hover:border-[#16255c]/40')}
              >
                Todos
              </button>
              {salas.map(s => (
                <button
                  key={s.id}
                  onClick={() => setFiltroSala(filtroSala === s.id ? null : s.id)}
                  className={cn('text-xs px-2.5 py-1 rounded-full border transition-colors', filtroSala === s.id ? 'text-white border-transparent' : 'border-border text-muted-foreground hover:border-opacity-60')}
                  style={filtroSala === s.id ? { backgroundColor: s.cor, borderColor: s.cor } : {}}
                >
                  <span className="inline-block h-1.5 w-1.5 rounded-full mr-1" style={{ backgroundColor: s.cor }} />
                  {s.nome}
                </button>
              ))}
            </div>
          )}

          {/* Gerenciar salas */}
          {(isGerente || isAdmin) && (
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setShowSalasModal(true)}>
              <Settings className="h-3.5 w-3.5" />
              Salas
            </Button>
          )}

          {/* Novo evento */}
          <Button size="sm" className="gap-1.5 h-8 text-xs bg-[#16255c] hover:bg-[#16255c]/90" onClick={() => handleDayClick(new Date())}>
            <Plus className="h-3.5 w-3.5" />
            Novo evento
          </Button>
        </div>
      </div>

      {/* Grade do calendário */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        {/* Cabeçalho: dias da semana */}
        <div className="grid grid-cols-7 border-b">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Dias */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const inMonth   = isSameMonth(day, currentDate)
              const today     = isToday(day)
              const dayEvents = eventosDoDia(day)
              const overflow  = dayEvents.length > 3

              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    'min-h-[90px] lg:min-h-[110px] p-1.5 border-b border-r cursor-pointer transition-colors',
                    !inMonth && 'bg-slate-50/60',
                    inMonth && 'hover:bg-blue-50/40',
                    today && 'bg-blue-50'
                  )}
                >
                  <div className={cn(
                    'text-xs font-semibold mb-1 h-5 w-5 flex items-center justify-center rounded-full',
                    today     && 'bg-[#16255c] text-white',
                    !today && inMonth  && 'text-slate-700',
                    !inMonth && 'text-slate-300',
                  )}>
                    {format(day, 'd')}
                  </div>

                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(evento => (
                      <button
                        key={evento.id}
                        onClick={e => handleEventoClick(e, evento)}
                        className="w-full text-left text-[10px] leading-tight px-1.5 py-0.5 rounded font-medium truncate transition-opacity hover:opacity-80"
                        style={{ backgroundColor: (evento.sala_cor ?? evento.cor) + '25', color: evento.sala_cor ?? evento.cor, borderLeft: `2px solid ${evento.sala_cor ?? evento.cor}` }}
                      >
                        {format(parseISO(evento.inicio), 'HH:mm')} {evento.titulo}
                      </button>
                    ))}
                    {overflow && (
                      <p className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3} mais</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Legenda de tipos */}
      <div className="flex flex-wrap gap-3">
        {TIPOS.map(t => (
          <span key={t.value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.cor }} />
            {t.label}
          </span>
        ))}
      </div>

      {/* ── Modal: ver / criar / editar evento ────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

            {/* Ver evento */}
            {selectedEvento && !editMode && (
              <div>
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: selectedEvento.sala_cor ?? selectedEvento.cor }} />
                    <h3 className="font-semibold text-base text-slate-800 truncate">{selectedEvento.titulo}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {canEdit(selectedEvento) && (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => enterEditMode(selectedEvento)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(selectedEvento)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowModal(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="px-5 py-4 space-y-3">
                  <Badge variant="outline" style={{ color: TIPO_COR[selectedEvento.tipo], borderColor: TIPO_COR[selectedEvento.tipo] + '60', backgroundColor: TIPO_COR[selectedEvento.tipo] + '10' }}>
                    {TIPO_LABEL[selectedEvento.tipo] ?? selectedEvento.tipo}
                  </Badge>

                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <Clock className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                    <div>
                      <p>{format(parseISO(selectedEvento.inicio), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
                      {selectedEvento.fim && (
                        <p className="text-xs text-muted-foreground">até {format(parseISO(selectedEvento.fim), "HH:mm")}</p>
                      )}
                    </div>
                  </div>

                  {selectedEvento.sala_nome && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{selectedEvento.sala_nome}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{selectedEvento.usuario_nome}</span>
                  </div>

                  {selectedEvento.descricao && (
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-lg p-3">
                      {selectedEvento.descricao}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Criar / Editar evento */}
            {(!selectedEvento || editMode) && (
              <div>
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b">
                  <h3 className="font-semibold text-base">
                    {editMode ? 'Editar evento' : `Novo evento${selectedDay ? ' — ' + format(selectedDay, "dd 'de' MMM", { locale: ptBR }) : ''}`}
                  </h3>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setShowModal(false); setEditMode(false) }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="px-5 py-4 space-y-4">
                  {/* Título */}
                  <div className="space-y-1.5">
                    <Label htmlFor="titulo">Título *</Label>
                    <Input id="titulo" value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} placeholder="Nome do evento" autoFocus />
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
                          className={cn('text-xs px-3 py-1 rounded-full border-2 transition-all font-medium', form.tipo === t.value ? 'text-white border-transparent' : 'border-border text-muted-foreground hover:border-opacity-60')}
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
                      <Label htmlFor="sala">Sala de reunião</Label>
                      <select
                        id="sala"
                        value={form.sala_id}
                        onChange={e => setForm(p => ({ ...p, sala_id: e.target.value }))}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Sem sala específica</option>
                        {salas.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.nome}{s.capacidade ? ` (${s.capacidade} pessoas)` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Início / Fim */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="inicio">Início *</Label>
                      <Input id="inicio" type="datetime-local" value={form.inicio} onChange={e => setForm(p => ({ ...p, inicio: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fim">Fim</Label>
                      <Input id="fim" type="datetime-local" value={form.fim} onChange={e => setForm(p => ({ ...p, fim: e.target.value }))} />
                    </div>
                  </div>

                  {/* Descrição */}
                  <div className="space-y-1.5">
                    <Label htmlFor="descricao">Descrição</Label>
                    <textarea
                      id="descricao"
                      value={form.descricao}
                      onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                      placeholder="Detalhes opcionais..."
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 px-5 pb-5">
                  <Button variant="outline" onClick={() => { setShowModal(false); setEditMode(false) }}>Cancelar</Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving || !form.titulo.trim() || !form.inicio}
                    className="bg-[#16255c] hover:bg-[#16255c]/90"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editMode ? 'Salvar' : 'Criar evento')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: gerenciar salas ────────────────────────────────────────── */}
      {showSalasModal && (
        <SalasModal
          lojaId={primaryLojaId}
          salas={salas}
          onClose={() => setShowSalasModal(false)}
          onUpdate={setSalas}
        />
      )}
    </div>
  )
}

// ── Sub-componente: gerenciar salas ────────────────────────────────────────

interface SalasModalProps {
  lojaId: number
  salas: Sala[]
  onClose: () => void
  onUpdate: (salas: Sala[]) => void
}

function SalasModal({ lojaId, salas, onClose, onUpdate }: SalasModalProps) {
  const [form, setForm] = useState({ nome: '', capacidade: '', descricao: '', cor: '#3b82f6' })
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    if (!form.nome.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/salas-reuniao', {
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
      const res = await fetch(`/api/salas-reuniao/${sala.id}`, {
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

  const CORES = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#6b7280']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b">
          <h3 className="font-semibold text-base">Salas de Reunião</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Salas existentes */}
        <div className="px-5 py-4 space-y-2">
          {salas.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma sala cadastrada.</p>
          )}
          {salas.map(s => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border px-3 py-2.5">
              <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: s.cor }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.nome}</p>
                {(s.capacidade || s.descricao) && (
                  <p className="text-xs text-muted-foreground truncate">
                    {s.capacidade ? `${s.capacidade} pessoas` : ''}{s.capacidade && s.descricao ? ' · ' : ''}{s.descricao ?? ''}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive shrink-0" onClick={() => handleDelete(s)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Nova sala */}
        <div className="px-5 pb-5 space-y-3 border-t pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nova sala</p>

          <Input placeholder="Nome da sala *" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />

          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Capacidade (pessoas)" type="number" min={1} value={form.capacidade} onChange={e => setForm(p => ({ ...p, capacidade: e.target.value }))} />
            <div className="flex items-center gap-2">
              {CORES.map(cor => (
                <button
                  key={cor}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, cor }))}
                  className={cn('h-6 w-6 rounded-full border-2 transition-transform hover:scale-110', form.cor === cor ? 'border-slate-700 scale-110' : 'border-transparent')}
                  style={{ backgroundColor: cor }}
                />
              ))}
            </div>
          </div>

          <Input placeholder="Descrição (opcional)" value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />

          <Button
            onClick={handleCreate}
            disabled={saving || !form.nome.trim()}
            className="w-full bg-[#16255c] hover:bg-[#16255c]/90"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1.5" />Criar sala</>}
          </Button>
        </div>
      </div>
    </div>
  )
}
