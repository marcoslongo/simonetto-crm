"use client"

import { useState, useEffect, useRef } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
} from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Clock,
  ChevronRight,
  CircleCheckBig,
  Handshake,
  CheckCircle2,
  XCircle,
  GripVertical,
  Snowflake,
  Thermometer,
  Flame,
  ChevronDown,
  UserPlus,
  Check,
  User,
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { LeadDetailsModal } from './lead-dialog'
import { NovoLeadDialog } from './novo-lead-dialog'
import { VendaNaoRealizadaDialog } from './venda-nao-realizada-dialog'
import { Lead } from '@/lib/types'
import { OrigemBadge } from './origem-badge'

export type LeadStatus = 'nao_atendido' | 'em_negociacao' | 'venda_realizada' | 'venda_nao_realizada'

const statusLabels: Record<string, string> = {
  nao_atendido: 'Não Atendido',
  em_negociacao: 'Em Negociação',
  venda_realizada: 'Venda Realizada',
  venda_nao_realizada: 'Venda Não Realizada',
}

const COLUNAS = [
  {
    key: 'nao_atendido',
    label: 'Não Atendidos',
    description: 'Leads aguardando primeiro contato',
    color: 'amber',
    Icon: Clock,
  },
  {
    key: 'em_negociacao',
    label: 'Em Negociação',
    description: 'Leads em processo de negociação',
    color: 'blue',
    Icon: Handshake,
  },
  {
    key: 'venda_realizada',
    label: 'Venda Realizada',
    description: 'Leads que fecharam negócio',
    color: 'emerald',
    Icon: CheckCircle2,
  },
  {
    key: 'venda_nao_realizada',
    label: 'Venda Não Realizada',
    description: 'Leads que não fecharam negócio',
    color: 'red',
    Icon: XCircle,
  },
] as const

const INITIAL_VISIBLE = 20
const LOAD_MORE_STEP = 20
const FETCH_PER_PAGE = 200

const colorStyles: Record<string, { icon: string; badge: string; empty: string; dropzone: string; loadMore: string }> = {
  amber: {
    icon: 'text-amber-500',
    badge: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    empty: 'text-amber-400',
    dropzone: 'ring-amber-400 bg-amber-50/50',
    loadMore: 'text-amber-600 hover:text-amber-800 hover:bg-amber-50',
  },
  blue: {
    icon: 'text-blue-500',
    badge: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
    empty: 'text-blue-400',
    dropzone: 'ring-blue-400 bg-blue-50/50',
    loadMore: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50',
  },
  emerald: {
    icon: 'text-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
    empty: 'text-emerald-400',
    dropzone: 'ring-emerald-400 bg-emerald-50/50',
    loadMore: 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50',
  },
  red: {
    icon: 'text-red-500',
    badge: 'bg-red-100 text-red-700 hover:bg-red-100',
    empty: 'text-red-400',
    dropzone: 'ring-red-400 bg-red-50/50',
    loadMore: 'text-red-600 hover:text-red-800 hover:bg-red-50',
  },
}

interface KanbanColumnsProps {
  leads: Lead[]
  initialTotal?: number
  onLeadClick?: (lead: Lead) => void
  isAdmin?: boolean
  lojas?: Array<{ id: number; nome: string }>
  lojaId?: string | number
  lojaIds?: number[]
  currentUser?: { id: number; nome: string }
}

const POLL_INTERVAL = 30_000

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0, ctx.currentTime)

    const notes = [1046.5, 1318.5] // C6 → E6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(gain)
      const t = ctx.currentTime + i * 0.18
      gain.gain.setValueAtTime(0.25, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
      osc.start(t)
      osc.stop(t + 0.35)
    })
  } catch {}
}

export function KanbanColumns({ leads: initialLeads, initialTotal, onLeadClick, isAdmin, lojas = [], lojaId, lojaIds, currentUser }: KanbanColumnsProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [totalLeads, setTotalLeads] = useState(initialTotal ?? initialLeads.length)
  const [fetchPage, setFetchPage] = useState(1)
  const [loadingAll, setLoadingAll] = useState(false)
  const [columnLoading, setColumnLoading] = useState<Record<string, boolean>>({})

  const [activeLead, setActiveLead] = useState<Lead | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pendingQuiz, setPendingQuiz] = useState<Lead | null>(null)
  const [visibleCount, setVisibleCount] = useState<Record<string, number>>({})
  const isModalOpenRef = useRef(isModalOpen)
  const prevUnreadRef = useRef<Set<string>>(new Set())
  const isFirstPollRef = useRef(true)

  useEffect(() => {
    isModalOpenRef.current = isModalOpen
  }, [isModalOpen])

  // Busca todas as páginas restantes em background após o carregamento inicial
  useEffect(() => {
    const total = initialTotal ?? initialLeads.length
    if (initialLeads.length >= total) return

    const ids = lojaIds?.length ? lojaIds : lojaId ? [Number(lojaId)] : []
    if (!ids.length) return

    let cancelled = false

    const fetchAll = async () => {
      setLoadingAll(true)
      // Começa da página 1 com FETCH_PER_PAGE para não pular leads entre
      // a carga inicial (per_page=100) e o background (per_page=200).
      // Os leads já carregados são removidos pelo dedup.
      let page = 1
      let loaded = 0
      let currentTotal = total

      while (!cancelled && loaded < currentTotal) {
        try {
          const res = await fetch(`/api/kanban/leads?loja_ids=${ids.join(',')}&page=${page}&per_page=${FETCH_PER_PAGE}`)
          if (!res.ok || cancelled) break
          const data = await res.json()
          if (!data.success || cancelled) break

          const newLeads = data.leads as Lead[]
          if (!newLeads.length) break

          setLeads(prev => {
            const existingIds = new Set(prev.map(l => String(l.id)))
            const fresh = newLeads.filter(l => !existingIds.has(String(l.id)))
            return fresh.length ? [...prev, ...fresh] : prev
          })

          currentTotal = data.total
          setTotalLeads(data.total)
          setFetchPage(page)
          loaded += newLeads.length
          page++
        } catch {
          break
        }
      }

      if (!cancelled) setLoadingAll(false)
    }

    fetchAll()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const ids = lojaIds?.length ? lojaIds : lojaId ? [lojaId] : []
    const qs = ids.length ? `?loja_id=${ids.join(',')}` : ''

    const poll = async () => {
      if (isModalOpenRef.current) return
      try {
        const res = await fetch(`/api/mensagens/unread${qs}`)
        if (!res.ok) return
        const data = await res.json()
        if (!data.success) return
        const unread: Record<string, number> = data.unread ?? {}
        const currentUnreadIds = new Set(
          Object.keys(unread).filter(id => (unread[id] ?? 0) > 0)
        )

        // Toca som apenas quando um lead novo fica não lido (ignora primeiro poll)
        if (!isFirstPollRef.current) {
          const hasNew = [...currentUnreadIds].some(id => !prevUnreadRef.current.has(id))
          if (hasNew) playNotificationSound()
        }

        prevUnreadRef.current = currentUnreadIds
        isFirstPollRef.current = false

        setLeads(prev =>
          prev.map(l => {
            const next = currentUnreadIds.has(String(l.id)) ? 1 : 0
            return l.unread_count === next ? l : { ...l, unread_count: next }
          })
        )
      } catch {}
    }

    poll()
    const id = setInterval(poll, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [lojaId, lojaIds])

  const getVisible = (status: string) => visibleCount[status] ?? INITIAL_VISIBLE

  const loadMore = async (status: string) => {
    const currentVisible = visibleCount[status] ?? INITIAL_VISIBLE
    const colLeads = leads.filter(l => (l.status ?? 'nao_atendido') === status)

    if (currentVisible < colLeads.length) {
      setVisibleCount(prev => ({ ...prev, [status]: currentVisible + LOAD_MORE_STEP }))
      return
    }

    if (leads.length >= totalLeads) return

    const ids = lojaIds?.length ? lojaIds : lojaId ? [Number(lojaId)] : []
    if (!ids.length) return

    setColumnLoading(prev => ({ ...prev, [status]: true }))
    try {
      const nextPage = fetchPage + 1
      const res = await fetch(`/api/kanban/leads?loja_ids=${ids.join(',')}&page=${nextPage}&per_page=${FETCH_PER_PAGE}`)
      if (!res.ok) return
      const data = await res.json()
      if (!data.success) return

      setLeads(prev => {
        const existingIds = new Set(prev.map(l => String(l.id)))
        const fresh = (data.leads as Lead[]).filter(l => !existingIds.has(String(l.id)))
        return [...prev, ...fresh]
      })
      setTotalLeads(data.total)
      setFetchPage(nextPage)
      setVisibleCount(prev => ({ ...prev, [status]: currentVisible + LOAD_MORE_STEP }))
    } finally {
      setColumnLoading(prev => ({ ...prev, [status]: false }))
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  )

  const leadsByStatus = (status: string) =>
    leads.filter((l) => (l.status ?? 'nao_atendido') === status)

  const registrarContato = async (leadId: string | number, tipoContato: string, observacao?: string) => {
    try {
      await fetch("/api/lead-contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          tipo_contato: tipoContato,
          observacao: observacao || `Contato via ${tipoContato}`,
        }),
      });
    } catch (error) {
      console.error("Erro ao registrar contato:", error);
    }
  };

  const moverLead = async (lead: Lead, novoStatus: LeadStatus) => {
    const statusAnterior = lead.status ?? 'nao_atendido'

    if (statusAnterior === novoStatus) return

    setLeads((prev) =>
      prev.map((l) =>
        String(l.id) === String(lead.id) ? { ...l, status: novoStatus } : l
      )
    )

    try {
      const res = await fetch('/api/lead-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id, status: novoStatus }),
      })

      if (!res.ok) throw new Error()

      await registrarContato(
        lead.id,
        "movimentacao",
        `Status alterado de ${statusLabels[statusAnterior]} para ${statusLabels[novoStatus]}`
      )

      if (currentUser) {
        await fetch(`/api/leads/${lead.id}/responsavel`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ responsavel_id: currentUser.id }),
        })
        setLeads(prev =>
          prev.map(l =>
            String(l.id) === String(lead.id)
              ? { ...l, responsavel_id: currentUser.id, responsavel_nome: currentUser.nome }
              : l
          )
        )
      }

      toast.success('Lead movido com sucesso.')
    } catch {
      setLeads((prev) =>
        prev.map((l) =>
          String(l.id) === String(lead.id) ? { ...l, status: statusAnterior } : l
        )
      )
      toast.error('Erro ao mover lead.')
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const lead = leads.find((l) => String(l.id) === String(active.id))
    if (lead) {
      setActiveLead(lead)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveLead(null)

    if (!over) return

    const leadId = active.id
    const novoStatus = over.id as LeadStatus

    const lead = leads.find((l) => String(l.id) === String(leadId))
    if (!lead || novoStatus === (lead.status ?? 'nao_atendido')) return

    if (novoStatus === 'venda_nao_realizada') {
      setPendingQuiz(lead)
    } else {
      moverLead(lead, novoStatus)
    }
  }

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead)
    setIsModalOpen(true)
    onLeadClick?.(lead)
  }

  const handleMessagesRead = (leadId: string) => {
    setLeads(prev =>
      prev.map(l => String(l.id) === leadId ? { ...l, unread_count: 0 } : l)
    )
  }

  const handleLeadCriado = (lead: Lead) => {
    setLeads(prev => [lead, ...prev])
  }

  const handleLeadUpdate = (updated: Lead) => {
    setLeads(prev => prev.map(l => String(l.id) === String(updated.id) ? updated : l))
  }

  // Lojas disponíveis para o seletor: filtra pelo lojaIds se fornecido
  const lojasSeletor = lojaIds?.length
    ? lojas.filter(l => lojaIds.includes(l.id))
    : lojas

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        {loadingAll && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Carregando leads…
          </span>
        )}
        {!loadingAll && <span />}
        {lojasSeletor.length > 0 && (
          <NovoLeadDialog lojas={lojasSeletor} onLeadCriado={handleLeadCriado} />
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {COLUNAS.map((coluna) => {
            const items = leadsByStatus(coluna.key)
            const styles = colorStyles[coluna.color]

            return (
              <KanbanColumn
                key={coluna.key}
                coluna={coluna}
                items={items}
                styles={styles}
                onLeadClick={handleLeadClick}
                onLeadUpdate={handleLeadUpdate}
                visibleCount={getVisible(coluna.key)}
                onLoadMore={() => loadMore(coluna.key)}
                isLoadingMore={columnLoading[coluna.key] ?? false}
                hasMoreGlobal={leads.length < totalLeads}
                isLoadingAll={loadingAll}
              />
            )
          })}
        </div>

        <DragOverlay>
          {activeLead && (
            <div className="rounded-lg border bg-card p-4 shadow-lg opacity-90">
              <p className="truncate text-sm font-medium text-foreground">{activeLead.nome}</p>
              {activeLead.email && (
                <p className="truncate text-xs text-muted-foreground">{activeLead.email}</p>
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onMessagesRead={handleMessagesRead}
          isAdmin={isAdmin}
          lojas={lojas}
        />
      )}

      {pendingQuiz && (
        <VendaNaoRealizadaDialog
          open={!!pendingQuiz}
          leadId={String(pendingQuiz.id)}
          leadNome={pendingQuiz.nome}
          onClose={() => setPendingQuiz(null)}
          onSaved={() => {
            moverLead(pendingQuiz, 'venda_nao_realizada')
            setPendingQuiz(null)
          }}
        />
      )}
    </>
  )
}

interface KanbanColumnProps {
  coluna: typeof COLUNAS[number]
  items: Lead[]
  styles: typeof colorStyles[string]
  onLeadClick?: (lead: Lead) => void
  onLeadUpdate: (updated: Lead) => void
  visibleCount: number
  onLoadMore: () => void
  isLoadingMore?: boolean
  hasMoreGlobal?: boolean
  isLoadingAll?: boolean
}

function KanbanColumn({ coluna, items, styles, onLeadClick, onLeadUpdate, visibleCount, onLoadMore, isLoadingMore, hasMoreGlobal, isLoadingAll }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: coluna.key,
  })

  const visibleItems = items.slice(0, visibleCount)
  const remaining = items.length - visibleCount
  const hasMore = remaining > 0 || (hasMoreGlobal ?? false)

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "bg-linear-to-br from-slate-50 to-slate-100 transition-all duration-200 min-h-75",
        isOver && `ring-2 ${styles.dropzone}`
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <coluna.Icon className={`h-4 w-4 ${styles.icon}`} />
            <CardTitle className="text-base">{coluna.label}</CardTitle>
          </div>
          <Badge variant="secondary" className={styles.badge}>
            {items.length}{isLoadingAll ? '+' : ''}
          </Badge>
        </div>
        <CardDescription>{coluna.description}</CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y min-h-25">
          {items.length === 0 ? (
            <div className="flex justify-center">
              <p className={`px-6 py-8 text-center text-sm text-muted-foreground flex items-center gap-2`}>
                {isOver ? 'Solte aqui' : 'Nenhum lead aqui'}
                <CircleCheckBig size={16} className={styles.empty} />
              </p>
            </div>
          ) : (
            <>
              {visibleItems.map((lead) => (
                <DraggableLeadRow
                  key={lead.id}
                  lead={lead}
                  onOpen={() => onLeadClick?.(lead)}
                  onLeadUpdate={onLeadUpdate}
                />
              ))}

              {hasMore && (
                <div className="px-5 py-3">
                  <button
                    onClick={onLoadMore}
                    disabled={isLoadingMore}
                    className={cn(
                      "w-full flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed",
                      styles.loadMore
                    )}
                  >
                    {isLoadingMore ? (
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                    {isLoadingMore
                      ? 'Carregando...'
                      : remaining > 0
                        ? `Ver mais (${remaining} restante${remaining !== 1 ? 's' : ''})`
                        : 'Ver mais'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface DraggableLeadRowProps {
  lead: Lead
  onOpen: () => void
  onLeadUpdate: (updated: Lead) => void
}

function DraggableLeadRow({ lead, onOpen, onLeadUpdate }: DraggableLeadRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: String(lead.id),
  })

  const [popoverOpen, setPopoverOpen] = useState(false)
  const [usuarios, setUsuarios] = useState<{ id: number; nome: string }[]>([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(false)
  const [saving, setSaving] = useState(false)

  const handlePopoverOpen = async (open: boolean) => {
    setPopoverOpen(open)
    if (open && lead.loja_id && usuarios.length === 0) {
      setLoadingUsuarios(true)
      try {
        const res = await fetch(`/api/lojas/${lead.loja_id}/usuarios`)
        const data = await res.json()
        if (res.ok) setUsuarios(data.usuarios || [])
      } catch {
        toast.error('Erro ao carregar usuários')
      } finally {
        setLoadingUsuarios(false)
      }
    }
  }

  const handleSelectAtendente = async (userId: number | null) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}/responsavel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responsavel_id: userId }),
      })
      if (!res.ok) { toast.error('Erro ao atualizar atendente'); return }
      const nome = userId ? (usuarios.find(u => u.id === userId)?.nome ?? '') : null
      onLeadUpdate({ ...lead, responsavel_id: userId, responsavel_nome: nome })
      setPopoverOpen(false)
    } catch {
      toast.error('Erro ao atualizar atendente')
    } finally {
      setSaving(false)
    }
  }

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  const criado = formatDistanceToNow(new Date(lead.data_criacao), {
    addSuffix: true,
    locale: ptBR,
  })

  return (
    <TooltipProvider>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group relative flex items-start gap-3 px-5 py-4 transition-colors hover:bg-muted/40 bg-white/50",
          isDragging && "opacity-50 shadow-lg z-50"
        )}
      >
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
          aria-label="Arrastar lead"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onOpen}
                className="w-full text-left focus-visible:outline-none cursor-pointer"
              >
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <OrigemBadge lead={lead} size="xs" />

                  {lead.classificacao === "quente" && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
                      <Flame size={12} />
                      Quente
                    </span>
                  )}

                  {lead.classificacao === "morno" && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700">
                      <Thermometer size={12} />
                      Morno
                    </span>
                  )}

                  {lead.classificacao === "frio" && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                      <Snowflake size={12} />
                      Frio
                    </span>
                  )}
                </div>

                <p className="truncate text-sm font-medium text-foreground">{lead.nome}</p>

                {lead.email && (
                  <p className="truncate text-xs text-muted-foreground">{lead.email}</p>
                )}

                {lead.cidade && (
                  <p className="text-xs text-muted-foreground">
                    {lead.cidade}{lead.estado ? `, ${lead.estado}` : ''}
                  </p>
                )}

                <div className="mt-1.5 flex items-center gap-2">
                  {lead.expectativa_investimento && (
                    <span className="text-xs font-medium text-emerald-600">
                      {lead.expectativa_investimento}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">{criado}</span>
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Ver informações completas
            </TooltipContent>
          </Tooltip>

          <div className="mt-2">
            {lead.loja_id ? (
              <Popover open={popoverOpen} onOpenChange={handlePopoverOpen}>
                <PopoverTrigger asChild>
                  {lead.responsavel_nome ? (
                    <button className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors cursor-pointer">
                      <User className="h-3 w-3 shrink-0" />
                      {lead.responsavel_nome}
                    </button>
                  ) : (
                    <button className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-muted-foreground/30 px-2.5 py-1 text-[11px] text-muted-foreground/60 hover:border-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-pointer">
                      <UserPlus className="h-3 w-3 shrink-0" />
                      Sem atendente
                    </button>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-52 p-1.5" side="bottom" align="start">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-2 py-1">
                    Atendente
                  </p>
                  {loadingUsuarios || saving ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <button
                        onClick={() => handleSelectAtendente(null)}
                        className={cn(
                          "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-left transition-colors hover:bg-muted",
                          !lead.responsavel_id && "font-medium text-foreground"
                        )}
                      >
                        {!lead.responsavel_id && <Check className="h-3 w-3 shrink-0" />}
                        <span className={lead.responsavel_id ? "ml-5" : ""}>— Sem atendente —</span>
                      </button>
                      {usuarios.map(u => (
                        <button
                          key={u.id}
                          onClick={() => handleSelectAtendente(u.id)}
                          className={cn(
                            "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-left transition-colors hover:bg-muted",
                            lead.responsavel_id === u.id && "font-medium text-foreground"
                          )}
                        >
                          {lead.responsavel_id === u.id
                            ? <Check className="h-3 w-3 shrink-0" />
                            : <span className="w-3 shrink-0" />
                          }
                          {u.nome}
                        </button>
                      ))}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            ) : (
              lead.responsavel_nome ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                  <User className="h-3 w-3 shrink-0" />
                  {lead.responsavel_nome}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-muted-foreground/30 px-2.5 py-1 text-[11px] text-muted-foreground/60">
                  <UserPlus className="h-3 w-3 shrink-0" />
                  Sem atendente
                </span>
              )
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {(lead.unread_count ?? 0) > 0 && (
            <span className="relative flex h-2.5 w-2.5 mt-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          )}

          <div className="opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={onOpen}
              title="Ver detalhes"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}