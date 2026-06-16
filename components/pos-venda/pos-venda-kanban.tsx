"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
  pointerWithin,
} from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  X,
  Plus,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  User,
  ChevronDown,
  AlertTriangle,
  Wrench,
  Package,
  LayoutGrid,
  GripVertical,
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useIsMobile } from '@/components/ui/use-mobile'
import type { PosVenda, PosVendaColuna } from '@/lib/types'
import { PosVendaCardDialog } from './pos-venda-card-dialog'

// ── cores ────────────────────────────────────────────────────────────────────
const colorStyles: Record<string, { icon: string; badge: string; empty: string; dropzone: string; loadMore: string }> = {
  blue:    { icon: 'text-blue-500',    badge: 'bg-blue-100 text-blue-700 hover:bg-blue-100',       empty: 'text-blue-400',    dropzone: 'ring-blue-400 bg-blue-50/50',       loadMore: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50' },
  indigo:  { icon: 'text-indigo-500',  badge: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100', empty: 'text-indigo-400',  dropzone: 'ring-indigo-400 bg-indigo-50/50',   loadMore: 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50' },
  purple:  { icon: 'text-purple-500',  badge: 'bg-purple-100 text-purple-700 hover:bg-purple-100', empty: 'text-purple-400',  dropzone: 'ring-purple-400 bg-purple-50/50',   loadMore: 'text-purple-600 hover:text-purple-800 hover:bg-purple-50' },
  teal:    { icon: 'text-teal-500',    badge: 'bg-teal-100 text-teal-700 hover:bg-teal-100',       empty: 'text-teal-400',    dropzone: 'ring-teal-400 bg-teal-50/50',       loadMore: 'text-teal-600 hover:text-teal-800 hover:bg-teal-50' },
  orange:  { icon: 'text-orange-500',  badge: 'bg-orange-100 text-orange-700 hover:bg-orange-100', empty: 'text-orange-400',  dropzone: 'ring-orange-400 bg-orange-50/50',   loadMore: 'text-orange-600 hover:text-orange-800 hover:bg-orange-50' },
  cyan:    { icon: 'text-cyan-500',    badge: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-100',       empty: 'text-cyan-400',    dropzone: 'ring-cyan-400 bg-cyan-50/50',       loadMore: 'text-cyan-600 hover:text-cyan-800 hover:bg-cyan-50' },
  emerald: { icon: 'text-emerald-500', badge: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100', empty: 'text-emerald-400', dropzone: 'ring-emerald-400 bg-emerald-50/50', loadMore: 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50' },
  red:     { icon: 'text-red-500',     badge: 'bg-red-100 text-red-700 hover:bg-red-100',          empty: 'text-red-400',     dropzone: 'ring-red-400 bg-red-50/50',         loadMore: 'text-red-600 hover:text-red-800 hover:bg-red-50' },
  pink:    { icon: 'text-pink-500',    badge: 'bg-pink-100 text-pink-700 hover:bg-pink-100',       empty: 'text-pink-400',    dropzone: 'ring-pink-400 bg-pink-50/50',       loadMore: 'text-pink-600 hover:text-pink-800 hover:bg-pink-50' },
  violet:  { icon: 'text-violet-500',  badge: 'bg-violet-100 text-violet-700 hover:bg-violet-100', empty: 'text-violet-400',  dropzone: 'ring-violet-400 bg-violet-50/50',   loadMore: 'text-violet-600 hover:text-violet-800 hover:bg-violet-50' },
  gray:    { icon: 'text-gray-500',    badge: 'bg-gray-100 text-gray-700 hover:bg-gray-100',       empty: 'text-gray-400',    dropzone: 'ring-gray-400 bg-gray-50/50',       loadMore: 'text-gray-600 hover:text-gray-800 hover:bg-gray-50' },
  lime:    { icon: 'text-lime-500',    badge: 'bg-lime-100 text-lime-700 hover:bg-lime-100',       empty: 'text-lime-400',    dropzone: 'ring-lime-400 bg-lime-50/50',       loadMore: 'text-lime-600 hover:text-lime-800 hover:bg-lime-50' },
  yellow:  { icon: 'text-yellow-500',  badge: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100', empty: 'text-yellow-400',  dropzone: 'ring-yellow-400 bg-yellow-50/50',   loadMore: 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50' },
}

const CUSTOM_COLORS = [
  { value: 'purple', bg: 'bg-purple-400', label: 'Roxo' },
  { value: 'indigo', bg: 'bg-indigo-400', label: 'Índigo' },
  { value: 'teal',   bg: 'bg-teal-400',   label: 'Teal' },
  { value: 'orange', bg: 'bg-orange-400', label: 'Laranja' },
  { value: 'pink',   bg: 'bg-pink-400',   label: 'Rosa' },
  { value: 'violet', bg: 'bg-violet-400', label: 'Violeta' },
  { value: 'cyan',   bg: 'bg-cyan-400',   label: 'Ciano' },
  { value: 'gray',   bg: 'bg-gray-400',   label: 'Cinza' },
]

// ── collision ─────────────────────────────────────────────────────────────────
function columnCollision(args: Parameters<typeof pointerWithin>[0]) {
  const p = pointerWithin(args)
  return p.length > 0 ? p : closestCenter(args)
}

// ── helpers ───────────────────────────────────────────────────────────────────
function formatTempoNaEtapa(desde: string): string {
  const mins = (Date.now() - new Date(desde).getTime()) / 60000
  if (mins < 60) return `${Math.round(mins)}m`
  if (mins < 24 * 60) return `${Math.floor(mins / 60)}h`
  return `${Math.floor(mins / (24 * 60))}d`
}

function formatMoeda(valor?: number | null): string {
  if (valor == null) return ''
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('')
}

const INITIAL_VISIBLE = 20
const LOAD_MORE_STEP = 20

interface PosVendaFilters {
  responsavelId: number | null
  search: string
}

const EMPTY_FILTERS: PosVendaFilters = { responsavelId: null, search: '' }

// ── DraggableCard ─────────────────────────────────────────────────────────────
function DraggableCard({
  pv,
  onClick,
  isSaving,
}: {
  pv: PosVenda
  etapaLabel: string
  onClick: (pv: PosVenda) => void
  isSaving: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: pv.id })
  const style = { transform: CSS.Translate.toString(transform) }
  const tempoNaEtapa = formatTempoNaEtapa(pv.etapa_desde)
  const hasAssistencia = (pv.assistencias_abertas ?? 0) > 0
  const isAssistencia = pv.etapa === 'assistencia_tecnica'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-start gap-3 px-5 py-4 transition-all hover:bg-muted/40 bg-white/50 border-l-2',
        isAssistencia ? 'border-l-red-500' : hasAssistencia ? 'border-l-orange-400' : 'border-l-transparent',
        isDragging && 'opacity-50 shadow-lg z-50',
        isSaving && 'opacity-60'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-1 cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
        aria-label="Arrastar"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {isSaving && (
        <div className="absolute top-2 right-2 z-10">
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/60" />
        </div>
      )}

      <button
        className="w-full text-left focus-visible:outline-none cursor-pointer min-w-0 flex-1"
        onClick={() => onClick(pv)}
      >
        {/* nome + assistência */}
        <div className="flex items-center gap-1.5 mb-1">
          <p className="truncate text-sm font-medium text-foreground flex-1">
            {pv.lead_nome || '—'}
          </p>
          {hasAssistencia && (
            <span title="Assistência técnica aberta" className="shrink-0">
              <Wrench className="h-3.5 w-3.5 text-orange-500" />
            </span>
          )}
        </div>

        {/* pedido + valor + data */}
        {(pv.venda_numero_pedido || pv.venda_valor != null || pv.venda_data_venda) && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {pv.venda_numero_pedido && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600">
                #{pv.venda_numero_pedido}
              </span>
            )}
            {pv.venda_valor != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                {formatMoeda(pv.venda_valor)}
              </span>
            )}
            {pv.venda_data_venda && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-600 border border-emerald-200">
                {format(new Date(pv.venda_data_venda + 'T00:00:00'), 'dd/MM/yyyy')}
              </span>
            )}
          </div>
        )}

        {/* responsável + tempo na etapa */}
        <div className="mt-2 flex items-center justify-between gap-2">
          {pv.responsavel_nome ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#2463eb]/15 text-[#2463eb] font-semibold text-[9px] shrink-0">
                {getInitials(pv.responsavel_nome)}
              </span>
              <span className="max-w-24 truncate">{pv.responsavel_nome}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-muted-foreground/30 px-2.5 py-1 text-[11px] text-muted-foreground/60">
              <User className="h-3 w-3 shrink-0" />
              Sem responsável
            </span>
          )}
          <div className="flex items-center gap-1 shrink-0 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {tempoNaEtapa}
          </div>
        </div>
      </button>
    </div>
  )
}

// ── MobileCard ────────────────────────────────────────────────────────────────
function MobileCard({ pv, onClick }: { pv: PosVenda; onClick: (pv: PosVenda) => void }) {
  const hasAssistencia = (pv.assistencias_abertas ?? 0) > 0
  return (
    <button
      type="button"
      className="w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-muted/40 transition-colors active:bg-muted"
      onClick={() => onClick(pv)}
    >
      <div className={cn('h-2 w-2 rounded-full shrink-0', hasAssistencia ? 'bg-orange-400' : 'bg-slate-300')} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground truncate">{pv.lead_nome || '—'}</p>
        <p className="text-xs text-muted-foreground truncate">
          {pv.venda_numero_pedido ? `#${pv.venda_numero_pedido} · ` : ''}
          {pv.venda_valor != null ? formatMoeda(pv.venda_valor) : ''}
        </p>
      </div>
      <span className="shrink-0 text-[10px] text-muted-foreground">
        {formatTempoNaEtapa(pv.etapa_desde)}
      </span>
    </button>
  )
}

// ── KanbanColumn ──────────────────────────────────────────────────────────────
interface KanbanColProps {
  coluna: PosVendaColuna
  items: PosVenda[]
  styles: typeof colorStyles[string]
  onCardClick: (pv: PosVenda) => void
  visibleCount: number
  onLoadMore: () => void
  isLoadingMore?: boolean
  savingIds: Set<number>
  isGerente?: boolean
  onDeleteColuna?: (c: PosVendaColuna) => void
  onMoveColuna?: (c: PosVendaColuna, d: 'left' | 'right') => void
  isFirst?: boolean
  isLast?: boolean
}

const KanbanCol = React.memo(function KanbanCol({
  coluna, items, styles, onCardClick, visibleCount, onLoadMore, isLoadingMore, savingIds, isGerente, onDeleteColuna, onMoveColuna, isFirst, isLast,
}: KanbanColProps) {
  const { setNodeRef, isOver } = useDroppable({ id: coluna.slug })
  const [colSearch, setColSearch] = useState('')

  const displayedItems = colSearch.trim()
    ? items.filter(pv => {
        const q = colSearch.toLowerCase()
        return (
          pv.lead_nome?.toLowerCase().includes(q) ||
          pv.venda_numero_pedido?.toLowerCase().includes(q) ||
          pv.lead_telefone?.includes(q)
        )
      })
    : items

  const visibleItems = displayedItems.slice(0, visibleCount)
  const remaining = displayedItems.length - visibleCount
  const hasMore = remaining > 0

  const Icon = coluna.slug === 'assistencia_tecnica' ? Wrench :
               coluna.slug === 'concluido' ? Package : LayoutGrid

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        'bg-linear-to-br from-slate-50 to-slate-100 transition-all duration-200 flex flex-col h-full max-h-[calc(100vh-300px)] overflow-y-auto pt-0',
        isOver && `ring-2 ${styles.dropzone}`
      )}
    >
      <CardHeader className="pt-4 pb-3 sticky top-0 z-10 bg-slate-50 border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn('h-4 w-4', styles.icon)} />
            <CardTitle className="text-base">{coluna.label}</CardTitle>
          </div>
          <Badge variant="secondary" className={styles.badge}>
            {colSearch.trim() ? `${displayedItems.length}/` : ''}{items.length}
          </Badge>
        </div>

        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            value={colSearch}
            onChange={e => setColSearch(e.target.value)}
            placeholder="Filtrar nesta etapa…"
            className="w-full rounded-md border border-input bg-white/80 py-1.5 pl-8 pr-7 text-xs placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {colSearch && (
            <button onClick={() => setColSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {isGerente && (
          <div className="mt-2 flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">Mover</span>
            <div className="flex items-center gap-0.5">
              <button onClick={() => onMoveColuna?.(coluna, 'left')} disabled={isFirst} className="rounded p-1 text-muted-foreground transition-colors hover:bg-white hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed"><ChevronLeft className="h-3.5 w-3.5" /></button>
              <button onClick={() => onMoveColuna?.(coluna, 'right')} disabled={isLast} className="rounded p-1 text-muted-foreground transition-colors hover:bg-white hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed"><ChevronRight className="h-3.5 w-3.5" /></button>
            </div>
            {Number(coluna.fixo) === 0 && (
              <>
                <div className="mx-1 h-3.5 w-px bg-border" />
                <button onClick={() => onDeleteColuna?.(coluna)} className="ml-auto flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 ring-1 ring-red-200 transition-all hover:bg-red-600 hover:text-white hover:ring-red-600">
                  <Trash2 className="h-3 w-3" /> Excluir
                </button>
              </>
            )}
          </div>
        )}
        <CardDescription />
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y min-h-25">
          {visibleItems.length === 0 ? (
            <div className={cn('flex flex-col items-center gap-2 py-10', styles.empty)}>
              <Package className="h-7 w-7 opacity-30" />
              <p className="text-xs text-center opacity-60">Nenhum projeto nesta etapa</p>
            </div>
          ) : (
            visibleItems.map(pv => (
              <DraggableCard
                key={pv.id}
                pv={pv}
                etapaLabel={coluna.label}
                onClick={onCardClick}
                isSaving={savingIds.has(pv.id)}
              />
            ))
          )}
        </div>

        {hasMore && (
          <div className="px-5 py-3">
            <button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className={cn('flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors disabled:opacity-50', styles.loadMore)}
            >
              {isLoadingMore ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {remaining > 0 ? `Ver mais ${remaining}` : 'Ver mais'}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

// ── PosVendaKanban (principal) ────────────────────────────────────────────────

interface PosVendaKanbanProps {
  lojaIds: number[]
  currentUser: { id: number; nome: string }
  isGerente?: boolean
}

export function PosVendaKanban({ lojaIds, currentUser, isGerente }: PosVendaKanbanProps) {
  const isMobile = useIsMobile()
  const [mobileActiveTab, setMobileActiveTab] = useState<string>('')

  const [items, setItems] = useState<PosVenda[]>([])
  const [colunas, setColunas] = useState<PosVendaColuna[]>([])
  const [loading, setLoading] = useState(true)
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set())
  const [visibleCount, setVisibleCount] = useState<Record<string, number>>({})
  const [filters, setFilters] = useState<PosVendaFilters>(EMPTY_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [selectedPv, setSelectedPv] = useState<PosVenda | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeDrag, setActiveDrag] = useState<PosVenda | null>(null)

  const [isAddColOpen, setIsAddColOpen] = useState(false)
  const [novaCol, setNovaCol] = useState({ label: '', cor: 'gray' })
  const [savingCol, setSavingCol] = useState(false)

  const isDraggingRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const primaryLojaId = lojaIds[0] ?? null

  // ── buscar colunas ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!primaryLojaId) return
    fetch(`/api/pos-venda-colunas?loja_id=${primaryLojaId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setColunas(d.data)
          setMobileActiveTab(prev => prev || d.data[0]?.slug || '')
        }
      })
      .catch(() => {})
  }, [primaryLojaId])

  // ── buscar itens ───────────────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    if (!lojaIds.length) return
    setLoading(true)
    try {
      const qs = new URLSearchParams({ loja_ids: lojaIds.join(',') })
      if (filters.responsavelId) qs.set('responsavel_id', String(filters.responsavelId))
      if (filters.search) qs.set('search', filters.search)
      const res = await fetch(`/api/pos-vendas?${qs}`)
      const data = await res.json()
      if (data.success) setItems(data.items ?? [])
    } catch { /* silencioso */ }
    finally { setLoading(false) }
  }, [lojaIds.join(','), filters.responsavelId, filters.search]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchItems() }, [fetchItems])

  // ── scroll indicators ──────────────────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 0)
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
    }
    update()
    el.addEventListener('scroll', update)
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', update); ro.disconnect() }
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    requestAnimationFrame(() => setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1))
  }, [colunas])

  // ── agrupamento por etapa ──────────────────────────────────────────────────
  const itemsByEtapa = useMemo(() => {
    const map: Record<string, PosVenda[]> = {}
    for (const col of colunas) {
      map[col.slug] = items
        .filter(pv => pv.etapa === col.slug)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    }
    return map
  }, [items, colunas])

  const responsaveisDisponiveis = useMemo(() => {
    const map = new Map<number, string>()
    for (const pv of items) {
      if (pv.responsavel_id && pv.responsavel_nome) map.set(pv.responsavel_id, pv.responsavel_nome)
    }
    return Array.from(map.entries()).map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [items])

  // ── drag & drop ────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const handleDragStart = (e: DragStartEvent) => {
    const pv = items.find(p => p.id === e.active.id)
    if (pv) { setActiveDrag(pv); isDraggingRef.current = true }
  }

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveDrag(null)
    isDraggingRef.current = false
    const { active, over } = e
    if (!over) return

    const pvId = Number(active.id)
    const novaEtapa = String(over.id)
    const pv = items.find(p => p.id === pvId)
    if (!pv || pv.etapa === novaEtapa) return

    // Otimista
    setItems(prev => prev.map(p => p.id === pvId ? { ...p, etapa: novaEtapa, etapa_desde: new Date().toISOString() } : p))
    setSavingIds(prev => new Set(prev).add(pvId))

    try {
      const res = await fetch(`/api/pos-vendas/${pvId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapa: novaEtapa }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.mensagem)
      if (data.data) setItems(prev => prev.map(p => p.id === pvId ? data.data : p))
      toast.success('Etapa atualizada.')
    } catch {
      setItems(prev => prev.map(p => p.id === pvId ? { ...p, etapa: pv.etapa, etapa_desde: pv.etapa_desde } : p))
      toast.error('Erro ao mover projeto.')
    } finally {
      setSavingIds(prev => { const s = new Set(prev); s.delete(pvId); return s })
    }
  }

  // ── colunas (gerente) ──────────────────────────────────────────────────────
  const addColuna = async () => {
    if (!novaCol.label.trim() || !primaryLojaId) return
    setSavingCol(true)
    try {
      const res = await fetch('/api/pos-venda-colunas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loja_id: primaryLojaId, label: novaCol.label.trim(), cor: novaCol.cor }),
      })
      const data = await res.json()
      if (data.success) {
        const fresh = await fetch(`/api/pos-venda-colunas?loja_id=${primaryLojaId}`).then(r => r.json())
        if (fresh.success) setColunas(fresh.data)
        setNovaCol({ label: '', cor: 'gray' })
        setIsAddColOpen(false)
        toast.success('Etapa criada.')
      } else {
        toast.error(data.mensagem ?? 'Erro ao criar etapa.')
      }
    } catch { toast.error('Erro ao criar etapa.') }
    finally { setSavingCol(false) }
  }

  const moveColuna = async (coluna: PosVendaColuna, direction: 'left' | 'right') => {
    if (!primaryLojaId) return
    setColunas(prev => {
      const idx = prev.findIndex(c => c.id === coluna.id)
      const target = direction === 'left' ? idx - 1 : idx + 1
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
    try {
      const res = await fetch(`/api/pos-venda-colunas/${coluna.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loja_id: primaryLojaId, direction }),
      })
      const data = await res.json()
      if (data.success) setColunas(data.data)
      else {
        const fresh = await fetch(`/api/pos-venda-colunas?loja_id=${primaryLojaId}`).then(r => r.json())
        if (fresh.success) setColunas(fresh.data)
        toast.error(data.mensagem ?? 'Erro ao mover etapa.')
      }
    } catch {
      const fresh = await fetch(`/api/pos-venda-colunas?loja_id=${primaryLojaId}`).then(r => r.json())
      if (fresh.success) setColunas(fresh.data)
    }
  }

  const deleteColuna = async (coluna: PosVendaColuna) => {
    if (!primaryLojaId) return
    try {
      const res = await fetch(`/api/pos-venda-colunas/${coluna.id}?loja_id=${primaryLojaId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) { setColunas(prev => prev.filter(c => c.id !== coluna.id)); toast.success('Etapa excluída.') }
      else toast.error(data.mensagem ?? 'Erro ao excluir etapa.')
    } catch { toast.error('Erro ao excluir etapa.') }
  }

  const getVisible = (slug: string) => visibleCount[slug] ?? INITIAL_VISIBLE
  const loadMore = (slug: string) => setVisibleCount(prev => ({ ...prev, [slug]: (prev[slug] ?? INITIAL_VISIBLE) + LOAD_MORE_STEP }))

  const filterCount = (filters.responsavelId !== null ? 1 : 0) + (filters.search ? 1 : 0)

  // ── toolbar ────────────────────────────────────────────────────────────────
  const toolbar = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 shrink-0">
        {loading ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando…
          </span>
        ) : (
          <Button onClick={fetchItems} size={isMobile ? 'sm' : 'default'} className="bg-[#16255c] hover:bg-[#16255c] hover:opacity-90 gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            placeholder="Buscar por cliente ou pedido…"
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-8 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {filters.search && (
            <button onClick={() => setFilters(f => ({ ...f, search: '' }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {responsaveisDisponiveis.length > 0 && (
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size={isMobile ? 'sm' : 'default'}
                className={cn('shrink-0 gap-2', filterCount > 0 && 'border-[#16255c] text-[#16255c] bg-[#16255c]/5')}>
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filtros</span>
                {filterCount > 0 && (
                  <Badge className="ml-0.5 h-4 min-w-4 px-1 py-0 text-[9px] font-bold bg-[#16255c] text-white rounded-full">{filterCount}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="w-72 p-0 shadow-lg rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                <p className="text-sm font-semibold">Filtros</p>
                {filterCount > 0 && (
                  <button onClick={() => setFilters(EMPTY_FILTERS)} className="text-xs text-muted-foreground hover:text-[#16255c] flex items-center gap-1">
                    <X className="h-3 w-3" /> Limpar
                  </button>
                )}
              </div>
              <div className="p-4 space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Responsável</p>
                <div className="flex flex-wrap gap-2">
                  {responsaveisDisponiveis.map(r => (
                    <button key={r.id} type="button"
                      onClick={() => setFilters(f => ({ ...f, responsavelId: f.responsavelId === r.id ? null : r.id }))}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer',
                        filters.responsavelId === r.id
                          ? 'bg-[#16255c] text-white border-[#16255c]'
                          : 'bg-background text-muted-foreground border-border hover:border-[#16255c]/50 hover:text-[#16255c]'
                      )}
                    >
                      <User className="h-3 w-3 shrink-0" /> {r.nome}
                    </button>
                  ))}
                </div>
              </div>
              {filterCount > 0 && (
                <div className="px-4 py-3 border-t bg-muted/20 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    <strong>{items.length}</strong> projetos
                  </p>
                  <button onClick={() => setFiltersOpen(false)} className="text-xs font-medium text-[#16255c] hover:opacity-80">
                    Aplicar
                  </button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  )

  // ── mobile ─────────────────────────────────────────────────────────────────
  if (isMobile) {
    const activeCol = colunas.find(c => c.slug === mobileActiveTab) ?? colunas[0]
    const activeItems = activeCol ? (itemsByEtapa[activeCol.slug] ?? []) : []

    return (
      <>
        {toolbar}
        <div className="flex flex-col gap-0 -mx-4">
          <div className="flex overflow-x-auto no-scrollbar border-b bg-white sticky top-14 z-20">
            {colunas.map(col => {
              const count = (itemsByEtapa[col.slug] ?? []).length
              const active = col.slug === mobileActiveTab
              const st = colorStyles[col.cor] ?? colorStyles.gray
              return (
                <button key={col.slug} onClick={() => setMobileActiveTab(col.slug)}
                  className={cn('flex flex-col items-center gap-0.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap shrink-0 border-b-2',
                    active ? 'border-[#2463eb] text-[#2463eb]' : 'border-transparent text-muted-foreground hover:text-foreground')}>
                  <span>{col.label}</span>
                  <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', active ? st.badge : '')}>{count}</Badge>
                </button>
              )
            })}
          </div>
          <div className="divide-y bg-white">
            {activeItems.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                <Package className="h-8 w-8 opacity-20" />
                <p className="text-sm">Nenhum projeto nesta etapa</p>
              </div>
            ) : (
              activeItems.map(pv => (
                <MobileCard key={pv.id} pv={pv} onClick={pv => { setSelectedPv(pv); setIsDialogOpen(true) }} />
              ))
            )}
          </div>
        </div>
        {selectedPv && (
          <PosVendaCardDialog
            posVenda={selectedPv}
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            isGerente={isGerente}
            currentUserId={currentUser.id}
            onUpdated={updated => setItems(prev => prev.map(p => p.id === updated.id ? updated : p))}
          />
        )}
      </>
    )
  }

  // ── desktop kanban ────────────────────────────────────────────────────────
  return (
    <>
      {toolbar}

      <div className="relative">
        <button onClick={() => scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
          className={cn('absolute left-0 top-6 z-20 flex h-8 w-8 items-center justify-center rounded-full border bg-white shadow-md transition-all duration-200',
            canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
          <ChevronLeft className="h-4 w-4 text-slate-600" />
        </button>
        <button onClick={() => scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
          className={cn('absolute right-0 top-6 z-20 flex h-8 w-8 items-center justify-center rounded-full border bg-white shadow-md transition-all duration-200',
            canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
          <ChevronRight className="h-4 w-4 text-slate-600" />
        </button>

        <div ref={scrollRef} className="w-full overflow-x-auto pb-4 kanban-scroll">
          <DndContext sensors={sensors} collisionDetection={columnCollision} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-6 items-stretch min-w-max">
              {colunas.map((col, idx) => (
                <div key={col.slug} className="min-w-70 flex-1 flex flex-col">
                  <KanbanCol
                    coluna={col}
                    items={itemsByEtapa[col.slug] ?? []}
                    styles={colorStyles[col.cor] ?? colorStyles.gray}
                    onCardClick={pv => { setSelectedPv(pv); setIsDialogOpen(true) }}
                    visibleCount={getVisible(col.slug)}
                    onLoadMore={() => loadMore(col.slug)}
                    savingIds={savingIds}
                    isGerente={isGerente}
                    onDeleteColuna={deleteColuna}
                    onMoveColuna={moveColuna}
                    isFirst={idx === 0}
                    isLast={idx === colunas.length - 1}
                  />
                </div>
              ))}

              {isGerente && (
                <div className="min-w-50 shrink-0 flex items-start pt-1">
                  <button onClick={() => setIsAddColOpen(true)}
                    className="flex items-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/25 px-5 py-4 text-sm text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground w-full justify-center transition-colors">
                    <Plus className="h-4 w-4" /> Nova etapa
                  </button>
                </div>
              )}
            </div>

            <DragOverlay>
              {activeDrag && (
                <div className="rounded-lg border bg-card p-4 shadow-lg opacity-90">
                  <p className="truncate text-sm font-medium">{activeDrag.lead_nome}</p>
                  {activeDrag.venda_numero_pedido && (
                    <p className="text-xs text-muted-foreground">#{activeDrag.venda_numero_pedido}</p>
                  )}
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {selectedPv && (
        <PosVendaCardDialog
          posVenda={selectedPv}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          isGerente={isGerente}
          currentUserId={currentUser.id}
          onUpdated={updated => setItems(prev => prev.map(p => p.id === updated.id ? updated : p))}
        />
      )}

      <Dialog open={isAddColOpen} onOpenChange={setIsAddColOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova etapa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome da etapa</Label>
              <Input
                value={novaCol.label}
                onChange={e => setNovaCol(p => ({ ...p, label: e.target.value }))}
                placeholder="Ex: Aprovação do Projeto"
                onKeyDown={e => { if (e.key === 'Enter') addColuna() }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {CUSTOM_COLORS.map(({ value, bg, label }) => (
                  <button key={value} type="button" title={label}
                    onClick={() => setNovaCol(p => ({ ...p, cor: value }))}
                    className={cn('h-7 w-7 rounded-full border-2 transition-transform hover:scale-110', novaCol.cor === value ? 'border-foreground scale-110' : 'border-transparent', bg)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddColOpen(false)}>Cancelar</Button>
            <Button onClick={addColuna} disabled={savingCol || !novaCol.label.trim()} className="bg-[#16255c] hover:bg-[#16255c] hover:opacity-90">
              {savingCol ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar etapa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
