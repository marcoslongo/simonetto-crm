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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Clock,
  ChevronLeft,
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
  RefreshCw,
  AlertTriangle,
  Bell,
  Loader2,
  Search,
  X,
  Plus,
  Trash2,
  LayoutGrid,
  Phone,
  MessageCircle,
  CalendarPlus,
  SlidersHorizontal,
  DollarSign,
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
import { LeadDetailsModal } from './lead-dialog'
import { NovoLeadDialog } from './novo-lead-dialog'
import { VendaNaoRealizadaDialog } from './venda-nao-realizada-dialog'
import { VendaRealizadaDialog } from './venda-realizada-dialog'
import { Lead, KanbanColuna, Etiqueta, VendasRealizadasConfig, VendaRealizada, VENDAS_CONFIG_PADRAO } from '@/lib/types'
import { OrigemBadge } from './origem-badge'
import { EtiquetaBadge, EtiquetasPicker } from './etiquetas-picker'
import { useIsMobile } from '@/components/ui/use-mobile'

export type LeadStatus = string

// ── Avatar helper ─────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('')
}

interface AvatarBadgeProps {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md'
}

function AvatarBadge({ name, avatarUrl, size = 'sm' }: AvatarBadgeProps) {
  const dim = size === 'md' ? 'h-7 w-7 text-xs' : 'h-5 w-5 text-[9px]'
  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={name}
      className={cn('rounded-full object-cover shrink-0 ring-1 ring-white', dim)}
    />
  ) : (
    <span className={cn('inline-flex items-center justify-center rounded-full bg-[#2463eb]/15 text-[#2463eb] font-semibold shrink-0', dim)}>
      {getInitials(name)}
    </span>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

function columnCollision(args: Parameters<typeof pointerWithin>[0]) {
  const pointer = pointerWithin(args)
  if (pointer.length > 0) return pointer
  return closestCenter(args)
}

// ── SLA helpers ──────────────────────────────────────────────────────────────
type SLALevel = 'warning' | 'critical'

function formatSLAElapsed(minutes: number): string {
  if (minutes >= 24 * 60) return `${Math.floor(minutes / (24 * 60))}d`
  if (minutes >= 60)      return `${Math.floor(minutes / 60)}h`
  return `${Math.round(minutes)}m`
}

function getSLAInfo(lead: Lead): { level: SLALevel; elapsed: string } | null {
  const now = Date.now()
  if (lead.status === 'nao_atendido') {
    const min = (now - new Date(lead.data_criacao).getTime()) / 60000
    if (min >= 24 * 60) return { level: 'critical', elapsed: formatSLAElapsed(min) }
    if (min >= 2 * 60)  return { level: 'warning',  elapsed: formatSLAElapsed(min) }
  } else if (lead.status === 'em_negociacao') {
    const min = (now - new Date(lead.data_atualizacao).getTime()) / 60000
    if (min >= 7 * 24 * 60) return { level: 'critical', elapsed: formatSLAElapsed(min) }
    if (min >= 3 * 24 * 60) return { level: 'warning',  elapsed: formatSLAElapsed(min) }
  }
  return null
}
// ─────────────────────────────────────────────────────────────────────────────

const SLUG_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  nao_atendido: Clock,
  em_negociacao: Handshake,
  venda_realizada: CheckCircle2,
  venda_nao_realizada: XCircle,
}

function getColumnIcon(slug: string): React.ComponentType<{ className?: string }> {
  return SLUG_ICONS[slug] ?? LayoutGrid
}

const CUSTOM_COLORS: { value: string; bg: string; label: string }[] = [
  { value: 'purple', bg: 'bg-purple-400',  label: 'Roxo'      },
  { value: 'indigo', bg: 'bg-indigo-400',  label: 'Índigo'    },
  { value: 'teal',   bg: 'bg-teal-400',    label: 'Teal'      },
  { value: 'orange', bg: 'bg-orange-400',  label: 'Laranja'   },
  { value: 'pink',   bg: 'bg-pink-400',    label: 'Rosa'      },
  { value: 'violet', bg: 'bg-violet-400',  label: 'Violeta'   },
  { value: 'cyan',   bg: 'bg-cyan-400',    label: 'Ciano'     },
  { value: 'gray',   bg: 'bg-gray-400',    label: 'Cinza'     },
]

const INITIAL_VISIBLE = 20
const LOAD_MORE_STEP = 20
const FETCH_PER_PAGE = 200

interface KanbanFilters {
  classificacao: string[]
  origem: string[]
  responsavelId: number | null
  slaRisco: boolean
  naoLidos: boolean
  followupPendente: boolean
  etiquetas: number[]
}

const EMPTY_FILTERS: KanbanFilters = {
  classificacao: [],
  origem: [],
  responsavelId: null,
  slaRisco: false,
  naoLidos: false,
  followupPendente: false,
  etiquetas: [],
}

function hasActiveFilters(f: KanbanFilters) {
  return (
    f.classificacao.length > 0 ||
    f.origem.length > 0 ||
    f.responsavelId !== null ||
    f.slaRisco ||
    f.naoLidos ||
    f.followupPendente ||
    f.etiquetas.length > 0
  )
}

function countActiveFilters(f: KanbanFilters) {
  return (
    (f.classificacao.length > 0 ? 1 : 0) +
    (f.origem.length > 0 ? 1 : 0) +
    (f.responsavelId !== null ? 1 : 0) +
    (f.slaRisco ? 1 : 0) +
    (f.naoLidos ? 1 : 0) +
    (f.followupPendente ? 1 : 0) +
    (f.etiquetas.length > 0 ? 1 : 0)
  )
}

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
  purple: {
    icon: 'text-purple-500',
    badge: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
    empty: 'text-purple-400',
    dropzone: 'ring-purple-400 bg-purple-50/50',
    loadMore: 'text-purple-600 hover:text-purple-800 hover:bg-purple-50',
  },
  indigo: {
    icon: 'text-indigo-500',
    badge: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100',
    empty: 'text-indigo-400',
    dropzone: 'ring-indigo-400 bg-indigo-50/50',
    loadMore: 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50',
  },
  teal: {
    icon: 'text-teal-500',
    badge: 'bg-teal-100 text-teal-700 hover:bg-teal-100',
    empty: 'text-teal-400',
    dropzone: 'ring-teal-400 bg-teal-50/50',
    loadMore: 'text-teal-600 hover:text-teal-800 hover:bg-teal-50',
  },
  orange: {
    icon: 'text-orange-500',
    badge: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
    empty: 'text-orange-400',
    dropzone: 'ring-orange-400 bg-orange-50/50',
    loadMore: 'text-orange-600 hover:text-orange-800 hover:bg-orange-50',
  },
  pink: {
    icon: 'text-pink-500',
    badge: 'bg-pink-100 text-pink-700 hover:bg-pink-100',
    empty: 'text-pink-400',
    dropzone: 'ring-pink-400 bg-pink-50/50',
    loadMore: 'text-pink-600 hover:text-pink-800 hover:bg-pink-50',
  },
  violet: {
    icon: 'text-violet-500',
    badge: 'bg-violet-100 text-violet-700 hover:bg-violet-100',
    empty: 'text-violet-400',
    dropzone: 'ring-violet-400 bg-violet-50/50',
    loadMore: 'text-violet-600 hover:text-violet-800 hover:bg-violet-50',
  },
  cyan: {
    icon: 'text-cyan-500',
    badge: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-100',
    empty: 'text-cyan-400',
    dropzone: 'ring-cyan-400 bg-cyan-50/50',
    loadMore: 'text-cyan-600 hover:text-cyan-800 hover:bg-cyan-50',
  },
  gray: {
    icon: 'text-gray-500',
    badge: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
    empty: 'text-gray-400',
    dropzone: 'ring-gray-400 bg-gray-50/50',
    loadMore: 'text-gray-600 hover:text-gray-800 hover:bg-gray-50',
  },
}

interface KanbanColumnsProps {
  leads: Lead[]
  initialTotal?: number
  onLeadClick?: (lead: Lead) => void
  isAdmin?: boolean
  isGerente?: boolean
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

export function KanbanColumns({ leads: initialLeads, initialTotal, onLeadClick, isAdmin, isGerente, lojas = [], lojaId, lojaIds, currentUser }: KanbanColumnsProps) {
  const isMobile = useIsMobile()
  const [mobileActiveTab, setMobileActiveTab] = useState<string>('nao_atendido')
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
  const [savingLeads, setSavingLeads] = useState<Set<string>>(new Set())
  const [colunas, setColunas] = useState<KanbanColuna[]>([
    { id: 0, loja_id: 0, slug: 'nao_atendido',       label: 'Não Atendidos',      cor: 'amber',   ordem: 0, fixo: 1 },
    { id: 0, loja_id: 0, slug: 'em_negociacao',      label: 'Em Negociação',      cor: 'blue',    ordem: 1, fixo: 1 },
    { id: 0, loja_id: 0, slug: 'venda_realizada',    label: 'Venda Realizada',    cor: 'emerald', ordem: 2, fixo: 1 },
    { id: 0, loja_id: 0, slug: 'venda_nao_realizada',label: 'Venda Não Realizada',cor: 'red',     ordem: 3, fixo: 1 },
  ])
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false)
  const [novaColuna, setNovaColuna] = useState({ label: '', cor: 'gray', after_id: null as number | null })
  const [savingColumn, setSavingColumn] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Lead[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchTotal, setSearchTotal] = useState(0)
  const [activeFilters, setActiveFilters] = useState<KanbanFilters>(EMPTY_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isModalOpenRef = useRef(isModalOpen)
  const prevUnreadRef = useRef<Set<string>>(new Set())
  const isFirstPollRef = useRef(true)
  const leadsRef = useRef<Lead[]>(initialLeads)
  const isDraggingRef = useRef(false)
  const isFirstKanbanPollRef = useRef(true)
  const [lastUnreadAt, setLastUnreadAt] = useState<Record<string, number>>({})
  const [autoAtribuirResponsavel, setAutoAtribuirResponsavel] = useState(true)
  const [permitirEdicaoAtendente, setPermitirEdicaoAtendente] = useState(false)
  const [vendasConfig, setVendasConfig] = useState<VendasRealizadasConfig>(VENDAS_CONFIG_PADRAO)
  const [pendingVendaRealizada, setPendingVendaRealizada] = useState<Lead | null>(null)
  const [vendasCache, setVendasCache] = useState<Record<string, VendaRealizada>>({})

  useEffect(() => {
    isModalOpenRef.current = isModalOpen
  }, [isModalOpen])

  useEffect(() => {
    const el = scrollContainerRef.current
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
    const el = scrollContainerRef.current
    if (!el) return
    requestAnimationFrame(() => {
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
    })
  }, [colunas])

  useEffect(() => {
    leadsRef.current = leads
  }, [leads])

  const ids = lojaIds?.length ? lojaIds : lojaId ? [Number(lojaId)] : []
  const primaryLojaId = ids[0] ?? null

  // Busca as colunas do kanban para a loja ativa
  useEffect(() => {
    if (!primaryLojaId) return
    fetch(`/api/kanban/columns?loja_id=${primaryLojaId}`)
      .then(r => r.json())
      .then(data => { if (data.success) setColunas(data.data) })
      .catch(() => {})
  }, [primaryLojaId])

  // Busca configurações da loja (atribuição automática etc.)
  useEffect(() => {
    if (!primaryLojaId) return
    fetch(`/api/lojas/${primaryLojaId}/leads-config`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setAutoAtribuirResponsavel(data.auto_atribuir_responsavel ?? true)
          setPermitirEdicaoAtendente(data.permitir_edicao_lead_atendente ?? false)
        }
      })
      .catch(() => {})
  }, [primaryLojaId])

  // Busca configurações de vendas realizadas
  useEffect(() => {
    if (!primaryLojaId) return
    fetch(`/api/lojas/${primaryLojaId}/vendas-config`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.config) {
          setVendasConfig({
            ...VENDAS_CONFIG_PADRAO,
            ...data.config,
            campos: { ...VENDAS_CONFIG_PADRAO.campos, ...(data.config.campos ?? {}) },
          })
        }
      })
      .catch(() => {})
  }, [primaryLojaId])

  // statusLabels derivado das colunas carregadas
  const statusLabels = useMemo(() => {
    const map: Record<string, string> = {}
    for (const col of colunas) {
      map[col.slug] = col.label
    }
    return map
  }, [colunas])

  const addColuna = async () => {
    if (!novaColuna.label.trim() || !primaryLojaId) return
    setSavingColumn(true)
    try {
      const body: Record<string, unknown> = {
        loja_id: primaryLojaId,
        label: novaColuna.label.trim(),
        cor: novaColuna.cor,
      }
      if (novaColuna.after_id !== null) body.after_id = novaColuna.after_id

      const res = await fetch('/api/kanban/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        // Recarrega as colunas para refletir a ordem correta do servidor
        const fresh = await fetch(`/api/kanban/columns?loja_id=${primaryLojaId}`).then(r => r.json())
        if (fresh.success) setColunas(fresh.data)
        else setColunas(prev => [...prev, data.data])
        setNovaColuna({ label: '', cor: 'gray', after_id: null })
        setIsAddColumnOpen(false)
        toast.success('Coluna criada com sucesso.')
      } else {
        toast.error(data.mensagem ?? 'Erro ao criar coluna.')
      }
    } catch {
      toast.error('Erro ao criar coluna.')
    } finally {
      setSavingColumn(false)
    }
  }

  const moveColuna = async (coluna: KanbanColuna, direction: 'left' | 'right') => {
    if (!primaryLojaId) return
    // Atualiza localmente de imediato (otimista)
    setColunas(prev => {
      const idx = prev.findIndex(c => c.id === coluna.id)
      const target = direction === 'left' ? idx - 1 : idx + 1
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
    try {
      const res = await fetch(`/api/kanban/columns/${coluna.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loja_id: primaryLojaId, direction }),
      })
      const data = await res.json()
      if (data.success) {
        setColunas(data.data)
      } else {
        // Reverte buscando novamente do servidor
        const fresh = await fetch(`/api/kanban/columns?loja_id=${primaryLojaId}`).then(r => r.json())
        if (fresh.success) setColunas(fresh.data)
        toast.error(data.mensagem ?? 'Erro ao mover coluna.')
      }
    } catch {
      const fresh = await fetch(`/api/kanban/columns?loja_id=${primaryLojaId}`).then(r => r.json())
      if (fresh.success) setColunas(fresh.data)
      toast.error('Erro ao mover coluna.')
    }
  }

  const deleteColuna = async (coluna: KanbanColuna) => {
    if (!primaryLojaId) return
    try {
      const res = await fetch(`/api/kanban/columns/${coluna.id}?loja_id=${primaryLojaId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setColunas(prev => prev.filter(c => c.id !== coluna.id))
        toast.success('Coluna excluída.')
      } else {
        toast.error(data.mensagem ?? 'Erro ao excluir coluna.')
      }
    } catch {
      toast.error('Erro ao excluir coluna.')
    }
  }

  const fetchAllLeads = useCallback(async (isManualRefresh = false) => {
    if (!ids.length) return
    const total = initialTotal ?? initialLeads.length
    if (!isManualRefresh && initialLeads.length >= total) return

    setLoadingAll(true)
    let page = 1
    let loaded = 0
    let currentTotal = isManualRefresh ? Infinity : total

    while (loaded < currentTotal) {
      try {
        const res = await fetch(`/api/kanban/leads?loja_ids=${ids.join(',')}&page=${page}&per_page=${FETCH_PER_PAGE}`)
        if (!res.ok) break
        const data = await res.json()
        if (!data.success) break

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

    setLoadingAll(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')])

  useEffect(() => {
    fetchAllLeads(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    const q = searchQuery.trim()
    if (!q) { setSearchResults([]); setSearchTotal(0); return }

    searchDebounceRef.current = setTimeout(async () => {
      if (!ids.length) return
      setSearchLoading(true)
      try {
        const res = await fetch(`/api/kanban/leads?loja_ids=${ids.join(',')}&page=1&per_page=50&search=${encodeURIComponent(q)}`)
        if (!res.ok) return
        const data = await res.json()
        if (!data.success) return
        setSearchResults(data.leads ?? [])
        setSearchTotal(data.total ?? 0)
      } catch {
        // silencioso
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, ids.join(',')])

  const handleRefresh = useCallback(() => {
    setLeads([])
    setFetchPage(1)
    setTotalLeads(0)
    fetchAllLeads(true)
  }, [fetchAllLeads])

  const backgroundPoll = useCallback(async () => {
    if (!ids.length || isModalOpenRef.current || isDraggingRef.current) return
    try {
      const res = await fetch(`/api/kanban/leads?loja_ids=${ids.join(',')}&page=1&per_page=200`)
      if (!res.ok) return
      const data = await res.json()
      if (!data.success || !Array.isArray(data.leads)) return

      const freshLeads = data.leads as Lead[]
      const freshMap = new Map(freshLeads.map(l => [String(l.id), l]))
      const prev = leadsRef.current

      let movedCount = 0
      const updated = prev.map(l => {
        const fresh = freshMap.get(String(l.id))
        if (!fresh) return l
        if (fresh.status !== l.status) movedCount++
        if (fresh.data_atualizacao !== l.data_atualizacao) return { ...l, ...fresh }
        return l
      })

      const existingIds = new Set(prev.map(l => String(l.id)))
      const newLeads = freshLeads.filter(f => !existingIds.has(String(f.id)))

      const hasChanges = movedCount > 0 || newLeads.length > 0
      if (hasChanges) setLeads(newLeads.length ? [...updated, ...newLeads] : updated)
      setTotalLeads(data.total)

      if (!isFirstKanbanPollRef.current && hasChanges) {
        if (movedCount > 0)
          toast.info(`${movedCount} lead${movedCount > 1 ? 's foram movidos' : ' foi movido'} por outro atendente`)
        if (newLeads.length > 0)
          toast.info(`${newLeads.length} novo${newLeads.length > 1 ? 's leads chegaram' : ' lead chegou'}`)
      }
      isFirstKanbanPollRef.current = false
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')])

  useEffect(() => {
    const timer = setInterval(backgroundPoll, POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [backgroundPoll])

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

        // Registra timestamp para leads que acabaram de receber mensagem
        if (!isFirstPollRef.current) {
          const newlyUnread = [...currentUnreadIds].filter(id => !prevUnreadRef.current.has(id))
          if (newlyUnread.length > 0) {
            const now = Date.now()
            setLastUnreadAt(prev => {
              const next = { ...prev }
              for (const id of newlyUnread) next[id] = now
              return next
            })
          }
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

  const responsaveisDisponiveis = useMemo(() => {
    const map = new Map<number, string>()
    for (const lead of leads) {
      if (lead.responsavel_id && lead.responsavel_nome) {
        map.set(lead.responsavel_id, lead.responsavel_nome)
      }
    }
    return Array.from(map.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [leads])

  const etiquetasDisponiveis = useMemo(() => {
    const map = new Map<number, Etiqueta>()
    for (const lead of leads) {
      for (const et of (lead.etiquetas ?? [])) map.set(et.id, et)
    }
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [leads])

  const filteredLeads = useMemo(() => {
    if (!hasActiveFilters(activeFilters)) return leads
    return leads.filter(l => {
      if (activeFilters.classificacao.length && !activeFilters.classificacao.includes(l.classificacao ?? '')) return false
      if (activeFilters.origem.length && !activeFilters.origem.includes(l.origem)) return false
      if (activeFilters.responsavelId !== null && l.responsavel_id !== activeFilters.responsavelId) return false
      if (activeFilters.slaRisco && !getSLAInfo(l)) return false
      if (activeFilters.naoLidos && !((l.unread_count ?? 0) > 0)) return false
      if (activeFilters.followupPendente && !l.proximo_followup_em) return false
      if (activeFilters.etiquetas.length && !l.etiquetas?.some(e => activeFilters.etiquetas.includes(e.id))) return false
      return true
    })
  }, [leads, activeFilters])

  const filterCount = countActiveFilters(activeFilters)

  const itemsByStatus = useMemo(() => {
    const map: Record<string, Lead[]> = {}
    for (const col of colunas) {
      const colLeads = filteredLeads.filter(l => (l.status ?? 'nao_atendido') === col.slug)
      map[col.slug] = colLeads.sort((a, b) => {
        const aUnread = (a.unread_count ?? 0) > 0
        const bUnread = (b.unread_count ?? 0) > 0
        if (aUnread && !bUnread) return -1
        if (!aUnread && bUnread) return 1
        if (aUnread && bUnread) {
          const aTime = lastUnreadAt[String(a.id)] ?? 0
          const bTime = lastUnreadAt[String(b.id)] ?? 0
          return bTime - aTime
        }
        return new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()
      })
    }
    return map
  }, [filteredLeads, colunas, lastUnreadAt])

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

    const leadId = String(lead.id)

    setLeads((prev) =>
      prev.map((l) => String(l.id) === leadId ? { ...l, status: novoStatus } : l)
    )
    setSavingLeads(prev => new Set(prev).add(leadId))

    try {
      const res = await fetch('/api/lead-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id, status: novoStatus }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData?.mensagem || `HTTP ${res.status}`)
      }

      await registrarContato(
        lead.id,
        "movimentacao",
        `Status alterado de ${statusLabels[statusAnterior]} para ${statusLabels[novoStatus]}`
      )

      if (currentUser && autoAtribuirResponsavel) {
        await fetch(`/api/leads/${lead.id}/responsavel`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ responsavel_id: currentUser.id }),
        })
        setLeads(prev =>
          prev.map(l =>
            String(l.id) === leadId
              ? { ...l, responsavel_id: currentUser.id, responsavel_nome: currentUser.nome }
              : l
          )
        )
      }

      toast.success('Lead movido com sucesso.')

      // Cria pós-venda automaticamente ao mover para venda_realizada
      if (novoStatus === 'venda_realizada' && lead.loja_id) {
        fetch('/api/pos-vendas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_id: lead.id, loja_id: Number(lead.loja_id) }),
        }).catch(() => {})
      }
    } catch {
      setLeads((prev) =>
        prev.map((l) => String(l.id) === leadId ? { ...l, status: statusAnterior } : l)
      )
      toast.error('Erro ao mover lead.')
    } finally {
      setSavingLeads(prev => { const s = new Set(prev); s.delete(leadId); return s })
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const lead = leads.find((l) => String(l.id) === String(active.id))
    if (lead) {
      setActiveLead(lead)
      isDraggingRef.current = true
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveLead(null)
    isDraggingRef.current = false

    if (!over) return

    const leadId = active.id
    const novoStatus = over.id as LeadStatus

    const lead = leads.find((l) => String(l.id) === String(leadId))
    if (!lead || novoStatus === (lead.status ?? 'nao_atendido')) return

    if (novoStatus === 'venda_nao_realizada') {
      setPendingQuiz(lead)
    } else if (novoStatus === 'venda_realizada' && vendasConfig.ativo) {
      setPendingVendaRealizada(lead)
    } else {
      moverLead(lead, novoStatus)
    }
  }

  const handleLeadClick = useCallback((lead: Lead) => {
    setSelectedLead(lead)
    setIsModalOpen(true)
    onLeadClick?.(lead)
  }, [onLeadClick])

  const handleMessagesRead = useCallback((leadId: string) => {
    setLeads(prev =>
      prev.map(l => String(l.id) === leadId ? { ...l, unread_count: 0 } : l)
    )
  }, [])

  const handleLeadCriado = useCallback((lead: Lead) => {
    setLeads(prev => [lead, ...prev])
  }, [])

  const handleLeadUpdate = useCallback((updated: Lead) => {
    setLeads(prev => prev.map(l => String(l.id) === String(updated.id) ? updated : l))
  }, [])

  // Lojas disponíveis para o seletor: filtra pelo lojaIds se fornecido
  const lojasSeletor = lojaIds?.length
    ? lojas.filter(l => lojaIds.includes(l.id))
    : lojas

  // ── helpers de filtro ─────────────────────────────────────────────────────
  function toggleArray<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
  }

  function FilterChip({ active, onClick, icon: Icon, children }: {
    active: boolean
    onClick: () => void
    icon?: React.ComponentType<{ className?: string }>
    children: React.ReactNode
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 cursor-pointer select-none',
          active
            ? 'bg-[#16255c] text-white border-[#16255c] shadow-sm'
            : 'bg-background text-muted-foreground border-border hover:border-[#16255c]/50 hover:text-[#16255c] hover:bg-[#16255c]/5'
        )}
      >
        {Icon && <Icon className="h-3 w-3 shrink-0" />}
        {children}
      </button>
    )
  }

  function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</p>
        <div className="flex flex-wrap gap-2">{children}</div>
      </div>
    )
  }

  // ── Shared toolbar ────────────────────────────────────────────────────────
  const toolbar = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 shrink-0">
          {loadingAll ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Carregando leads…
            </span>
          ) : (
            <Button
              onClick={handleRefresh}
              size={isMobile ? 'sm' : 'default'}
              className="bg-[#16255c] hover:bg-[#16255c] hover:opacity-90 gap-2 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          )}
          {lojasSeletor.length > 0 && (
            <NovoLeadDialog lojas={lojasSeletor} onLeadCriado={handleLeadCriado} />
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, e-mail ou telefone…"
              className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-8 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size={isMobile ? 'sm' : 'default'}
                className={cn(
                  'shrink-0 gap-2 relative transition-colors duration-150',
                  filterCount > 0 && 'border-[#16255c] text-[#16255c] bg-[#16255c]/5 hover:bg-[#16255c]/10'
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filtros</span>
                {filterCount > 0 && (
                  <Badge className="ml-0.5 h-4 min-w-4 px-1 py-0 text-[9px] font-bold bg-[#16255c] text-white rounded-full">
                    {filterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={8}
              className="w-80 p-0 shadow-lg rounded-xl border-border overflow-hidden"
            >
              {/* cabeçalho */}
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">Filtros</p>
                  {filterCount > 0 && (
                    <Badge variant="secondary" className="h-4 px-1.5 text-[9px] font-bold">
                      {filterCount} ativo{filterCount !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                {filterCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveFilters(EMPTY_FILTERS)}
                    className="text-xs text-muted-foreground hover:text-[#16255c] transition-colors duration-150 flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Limpar
                  </button>
                )}
              </div>

              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Temperatura */}
                <FilterSection label="Temperatura">
                  <FilterChip
                    active={activeFilters.classificacao.includes('frio')}
                    icon={Snowflake}
                    onClick={() => setActiveFilters(f => ({ ...f, classificacao: toggleArray(f.classificacao, 'frio') }))}
                  >
                    Frio
                  </FilterChip>
                  <FilterChip
                    active={activeFilters.classificacao.includes('morno')}
                    icon={Thermometer}
                    onClick={() => setActiveFilters(f => ({ ...f, classificacao: toggleArray(f.classificacao, 'morno') }))}
                  >
                    Morno
                  </FilterChip>
                  <FilterChip
                    active={activeFilters.classificacao.includes('quente')}
                    icon={Flame}
                    onClick={() => setActiveFilters(f => ({ ...f, classificacao: toggleArray(f.classificacao, 'quente') }))}
                  >
                    Quente
                  </FilterChip>
                </FilterSection>

                {/* Origem */}
                <FilterSection label="Origem">
                  <FilterChip
                    active={activeFilters.origem.includes('industria')}
                    onClick={() => setActiveFilters(f => ({ ...f, origem: toggleArray(f.origem, 'industria') }))}
                  >
                    Indústria
                  </FilterChip>
                  <FilterChip
                    active={activeFilters.origem.includes('proprio')}
                    onClick={() => setActiveFilters(f => ({ ...f, origem: toggleArray(f.origem, 'proprio') }))}
                  >
                    Próprio
                  </FilterChip>
                </FilterSection>

                {/* Indicadores */}
                <FilterSection label="Indicadores">
                  <FilterChip
                    active={activeFilters.slaRisco}
                    icon={AlertTriangle}
                    onClick={() => setActiveFilters(f => ({ ...f, slaRisco: !f.slaRisco }))}
                  >
                    SLA em risco
                  </FilterChip>
                  <FilterChip
                    active={activeFilters.naoLidos}
                    icon={MessageCircle}
                    onClick={() => setActiveFilters(f => ({ ...f, naoLidos: !f.naoLidos }))}
                  >
                    Não lidos
                  </FilterChip>
                  <FilterChip
                    active={activeFilters.followupPendente}
                    icon={CalendarPlus}
                    onClick={() => setActiveFilters(f => ({ ...f, followupPendente: !f.followupPendente }))}
                  >
                    Retorno agendado
                  </FilterChip>
                </FilterSection>

                {/* Responsável */}
                {responsaveisDisponiveis.length > 0 && (
                  <FilterSection label="Responsável">
                    {responsaveisDisponiveis.map(r => (
                      <FilterChip
                        key={r.id}
                        icon={User}
                        active={activeFilters.responsavelId === r.id}
                        onClick={() => setActiveFilters(f => ({ ...f, responsavelId: f.responsavelId === r.id ? null : r.id }))}
                      >
                        {r.nome}
                      </FilterChip>
                    ))}
                  </FilterSection>
                )}

                {/* Etiquetas */}
                {etiquetasDisponiveis.length > 0 && (
                  <FilterSection label="Etiquetas">
                    {etiquetasDisponiveis.map(et => (
                      <FilterChip
                        key={et.id}
                        active={activeFilters.etiquetas.includes(et.id)}
                        onClick={() => setActiveFilters(f => ({ ...f, etiquetas: toggleArray(f.etiquetas, et.id) }))}
                      >
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: et.cor }} />
                        {et.nome}
                      </FilterChip>
                    ))}
                  </FilterSection>
                )}
              </div>

              {/* rodapé com contagem */}
              {filterCount > 0 && (
                <div className="px-4 py-3 border-t bg-muted/20 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">{filteredLeads.length}</strong> de <strong className="text-foreground">{leads.length}</strong> leads
                  </p>
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(false)}
                    className="text-xs font-medium text-[#16255c] hover:opacity-80 transition-opacity"
                  >
                    Aplicar
                  </button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )

  // ── Shared search results ──────────────────────────────────────────────────
  const searchResultsBlock = searchQuery.trim() && (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {searchLoading
          ? <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Buscando…</span>
          : <span className="text-xs text-muted-foreground">{searchTotal} resultado{searchTotal !== 1 ? 's' : ''} para <strong className="text-foreground">"{searchQuery.trim()}"</strong></span>
        }
      </div>

      {!searchLoading && searchResults.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-12 text-muted-foreground">
          <Search className="h-7 w-7 opacity-30" />
          <p className="text-sm">Nenhum lead encontrado</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {searchResults.map(lead => {
          const sla = getSLAInfo(lead)
          const statusLabel = statusLabels[lead.status ?? 'nao_atendido']
          return (
            <button
              key={lead.id}
              onClick={() => handleLeadClick(lead)}
              className={cn(
                "group text-left rounded-xl border bg-card px-4 py-3 shadow-sm transition-shadow hover:shadow-md space-y-1.5",
                "border-l-[3px]",
                sla?.level === 'critical' ? "border-l-red-500" :
                sla?.level === 'warning'  ? "border-l-orange-400" :
                "border-l-slate-200"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-foreground">{lead.nome}</p>
                <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {statusLabel}
                </span>
              </div>
              {lead.email && <p className="truncate text-xs text-muted-foreground">{lead.email}</p>}
              {lead.telefone && <p className="text-xs text-muted-foreground">{lead.telefone}</p>}
              {lead.loja_nome && <p className="text-[10px] text-muted-foreground/70">{lead.loja_nome}</p>}
            </button>
          )
        })}
      </div>
    </div>
  )

  // ── Shared modals ──────────────────────────────────────────────────────────
  const modals = (
    <>
      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onMessagesRead={handleMessagesRead}
          isAdmin={isAdmin}
          isGerente={isGerente}
          permitirEdicaoAtendente={permitirEdicaoAtendente}
          lojas={lojas}
          currentUserId={currentUser?.id}
          onFollowupUpdate={(next) => {
            setLeads(prev => prev.map(l =>
              String(l.id) === String(selectedLead.id)
                ? { ...l, proximo_followup_em: next?.em ?? null, proximo_followup_descricao: next?.descricao ?? null }
                : l
            ))
          }}
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

      {pendingVendaRealizada && (
        <VendaRealizadaDialog
          open={!!pendingVendaRealizada}
          leadId={String(pendingVendaRealizada.id)}
          leadNome={pendingVendaRealizada.nome}
          config={vendasConfig}
          onClose={() => setPendingVendaRealizada(null)}
          onSaved={(venda) => {
            const leadId = String(pendingVendaRealizada.id)
            if (venda.valor || venda.data_venda || venda.forma_pagamento || venda.numero_pedido || venda.numero_nf || venda.observacoes) {
              setVendasCache(prev => ({ ...prev, [leadId]: venda }))
            }
            moverLead(pendingVendaRealizada, 'venda_realizada')
            setPendingVendaRealizada(null)
          }}
        />
      )}

      <Dialog open={isAddColumnOpen} onOpenChange={setIsAddColumnOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova coluna</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="col-label">Nome da coluna</Label>
              <Input
                id="col-label"
                value={novaColuna.label}
                onChange={e => setNovaColuna(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Ex: Aguardando Projeto"
                onKeyDown={e => { if (e.key === 'Enter') addColuna() }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="col-position">Inserir após</Label>
              <select
                id="col-position"
                value={novaColuna.after_id ?? ''}
                onChange={e => setNovaColuna(prev => ({ ...prev, after_id: e.target.value ? Number(e.target.value) : null }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">No final</option>
                {colunas.map(c => (
                  <option key={c.id} value={c.id}>Após: {c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {CUSTOM_COLORS.map(({ value, bg, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setNovaColuna(prev => ({ ...prev, cor: value }))}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                      novaColuna.cor === value ? "border-foreground scale-110" : "border-transparent",
                      bg
                    )}
                    title={label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddColumnOpen(false)}>Cancelar</Button>
            <Button
              onClick={addColuna}
              disabled={savingColumn || !novaColuna.label.trim()}
              className="bg-[#16255c] hover:bg-[#16255c] hover:opacity-90"
            >
              {savingColumn ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar coluna'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )

  // ── Mobile: tab list view ──────────────────────────────────────────────────
  if (isMobile) {
    const activeColuna = colunas.find(c => c.slug === mobileActiveTab) ?? colunas[0]
    const activeItems = activeColuna ? (itemsByStatus[activeColuna.slug] ?? []) : []

    return (
      <>
        {toolbar}
        {searchResultsBlock}

        {!searchQuery.trim() && (
          <div className="flex flex-col gap-0 -mx-4">
            {/* Status tabs — horizontal scroll */}
            <div className="flex overflow-x-auto no-scrollbar border-b bg-white sticky top-14 z-20">
              {colunas.map((col) => {
                const count = (itemsByStatus[col.slug] ?? []).length
                const active = col.slug === mobileActiveTab
                const styles = colorStyles[col.cor] ?? colorStyles.gray
                return (
                  <button
                    key={col.slug}
                    onClick={() => setMobileActiveTab(col.slug)}
                    className={cn(
                      'flex flex-col items-center gap-0.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors border-b-2',
                      active
                        ? 'border-[#2463eb] text-[#2463eb]'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span>{col.label}</span>
                    <Badge
                      variant="secondary"
                      className={cn('text-[10px] px-1.5 py-0', active ? styles.badge : '')}
                    >
                      {count}{loadingAll ? '+' : ''}
                    </Badge>
                  </button>
                )
              })}
            </div>

            {/* Lead list for active tab */}
            <div className="divide-y bg-white">
              {activeItems.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                  <CircleCheckBig className="h-8 w-8 opacity-20" />
                  <p className="text-sm">Nenhum lead nesta etapa</p>
                </div>
              ) : (
                activeItems.map((lead) => (
                  <MobileLeadCard
                    key={lead.id}
                    lead={lead}
                    onLeadClick={handleLeadClick}
                    isSaving={savingLeads.has(String(lead.id))}
                  />
                ))
              )}

              {/* Load more */}
              {activeColuna && leads.length < totalLeads && (
                <div className="px-4 py-3">
                  <button
                    onClick={() => loadMore(activeColuna.slug)}
                    disabled={columnLoading[activeColuna.slug]}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-medium py-2.5 rounded-xl border border-dashed text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
                  >
                    {columnLoading[activeColuna.slug]
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <ChevronDown className="h-3.5 w-3.5" />
                    }
                    Ver mais leads
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {modals}
      </>
    )
  }

  // ── Desktop: classic kanban ────────────────────────────────────────────────
  return (
    <>
      {toolbar}
      {searchResultsBlock}

      <div className={cn("relative", searchQuery.trim() && "hidden")}>
        <button
          onClick={() => scrollContainerRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
          className={cn(
            "absolute left-0 top-6 z-20 flex h-8 w-8 items-center justify-center rounded-full border bg-white shadow-md transition-all duration-200",
            canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          aria-label="Rolar para esquerda"
        >
          <ChevronLeft className="h-4 w-4 text-slate-600" />
        </button>

        <button
          onClick={() => scrollContainerRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
          className={cn(
            "absolute right-0 top-6 z-20 flex h-8 w-8 items-center justify-center rounded-full border bg-white shadow-md transition-all duration-200",
            canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          aria-label="Rolar para direita"
        >
          <ChevronRight className="h-4 w-4 text-slate-600" />
        </button>

        <div ref={scrollContainerRef} className="w-full overflow-x-auto pb-4 kanban-scroll">
          <DndContext
            sensors={sensors}
            collisionDetection={columnCollision}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 items-stretch min-w-max">
              {colunas.map((coluna) => (
                <div key={coluna.slug} className="min-w-70 flex-1 flex flex-col">
                  <KanbanColumn
                    coluna={coluna}
                    items={itemsByStatus[coluna.slug] ?? []}
                    styles={colorStyles[coluna.cor] ?? colorStyles.gray}
                    onLeadClick={handleLeadClick}
                    onLeadUpdate={handleLeadUpdate}
                    visibleCount={getVisible(coluna.slug)}
                    onLoadMore={() => loadMore(coluna.slug)}
                    isLoadingMore={columnLoading[coluna.slug] ?? false}
                    hasMoreGlobal={leads.length < totalLeads}
                    isLoadingAll={loadingAll}
                    savingLeads={savingLeads}
                    isGerente={isGerente}
                    onDeleteColuna={deleteColuna}
                    onMoveColuna={moveColuna}
                    isFirst={colunas.indexOf(coluna) === 0}
                    isLast={colunas.indexOf(coluna) === colunas.length - 1}
                    vendasCache={coluna.slug === 'venda_realizada' ? vendasCache : undefined}
                  />
                </div>
              ))}

              {isGerente && (
                <div className="min-w-50 shrink-0 flex items-start pt-1">
                  <button
                    onClick={() => setIsAddColumnOpen(true)}
                    className="flex items-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/25 px-5 py-4 text-sm text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:text-foreground w-full justify-center"
                  >
                    <Plus className="h-4 w-4" />
                    Nova coluna
                  </button>
                </div>
              )}
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
        </div>
      </div>

      {modals}
    </>
  )
}

interface KanbanColumnProps {
  coluna: KanbanColuna
  items: Lead[]
  styles: typeof colorStyles[string]
  onLeadClick?: (lead: Lead) => void
  onLeadUpdate: (updated: Lead) => void
  visibleCount: number
  onLoadMore: () => void
  isLoadingMore?: boolean
  hasMoreGlobal?: boolean
  isLoadingAll?: boolean
  savingLeads?: Set<string>
  isGerente?: boolean
  onDeleteColuna?: (coluna: KanbanColuna) => void
  onMoveColuna?: (coluna: KanbanColuna, direction: 'left' | 'right') => void
  isFirst?: boolean
  isLast?: boolean
  vendasCache?: Record<string, VendaRealizada>
}

const KanbanColumn = React.memo(function KanbanColumn({ coluna, items, styles, onLeadClick, onLeadUpdate, visibleCount, onLoadMore, isLoadingMore, hasMoreGlobal, isLoadingAll, savingLeads, isGerente, onDeleteColuna, onMoveColuna, isFirst, isLast, vendasCache }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: coluna.slug,
  })

  const [colSearch, setColSearch] = useState('')

  const displayedItems = colSearch.trim()
    ? items.filter(l => {
        const q = colSearch.toLowerCase()
        return (
          l.nome?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.telefone?.toLowerCase().includes(q)
        )
      })
    : items

  const visibleItems = displayedItems.slice(0, visibleCount)
  const remaining = displayedItems.length - visibleCount
  const hasMore = remaining > 0 || (!colSearch.trim() && (hasMoreGlobal ?? false))
  const Icon = getColumnIcon(coluna.slug)

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "bg-linear-to-br from-slate-50 to-slate-100 transition-all duration-200 flex flex-col h-full max-h-[calc(100vh-300px)] overflow-y-auto pt-0",
        isOver && `ring-2 ${styles.dropzone}`
      )}
    >
      <CardHeader className="pt-4 pb-3 sticky top-0 z-10 bg-slate-50 border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${styles.icon}`} />
            <CardTitle className="text-base">{coluna.label}</CardTitle>
          </div>
          <Badge variant="secondary" className={styles.badge}>
            {colSearch.trim() ? `${displayedItems.length}/` : ''}{items.length}{isLoadingAll ? '+' : ''}
          </Badge>
        </div>

        {/* Busca dentro da coluna */}
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            value={colSearch}
            onChange={e => setColSearch(e.target.value)}
            placeholder="Filtrar nesta coluna…"
            className="w-full rounded-md border border-input bg-white/80 py-1.5 pl-8 pr-7 text-xs placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-shadow"
          />
          {colSearch && (
            <button
              onClick={() => setColSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {isGerente && (
          <div className="mt-2 flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">Mover</span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => onMoveColuna?.(coluna, 'left')}
                disabled={isFirst}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-white hover:text-foreground hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-25"
                title="Mover para esquerda"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onMoveColuna?.(coluna, 'right')}
                disabled={isLast}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-white hover:text-foreground hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-25"
                title="Mover para direita"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {Number(coluna.fixo) === 0 && (
              <>
                <div className="mx-1 h-3.5 w-px bg-border" />
                <button
                  onClick={() => onDeleteColuna?.(coluna)}
                  className="ml-auto flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 ring-1 ring-red-200 transition-all hover:bg-red-600 hover:text-white hover:ring-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                  Excluir
                </button>
              </>
            )}
          </div>
        )}
        <CardDescription />
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y min-h-25">
          {displayedItems.length === 0 ? (
            <div className="flex justify-center">
              <p className={`px-6 py-8 text-center text-sm text-muted-foreground flex items-center gap-2`}>
                {isOver ? 'Solte aqui' : colSearch.trim() ? 'Nenhum resultado' : 'Nenhum lead aqui'}
                <CircleCheckBig size={16} className={styles.empty} />
              </p>
            </div>
          ) : (
            <>
              {visibleItems.map((lead) => (
                <DraggableLeadRow
                  key={lead.id}
                  lead={lead}
                  onLeadClick={onLeadClick}
                  onLeadUpdate={onLeadUpdate}
                  isSaving={savingLeads?.has(String(lead.id)) ?? false}
                  isGerente={isGerente}
                  vendaRealizada={vendasCache?.[String(lead.id)]}
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
})

interface DraggableLeadRowProps {
  lead: Lead
  onLeadClick?: (lead: Lead) => void
  onLeadUpdate: (updated: Lead) => void
  isSaving?: boolean
  isGerente?: boolean
  vendaRealizada?: VendaRealizada
}

const DraggableLeadRow = React.memo(function DraggableLeadRow({ lead, onLeadClick, onLeadUpdate, isSaving = false, isGerente, vendaRealizada }: DraggableLeadRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: String(lead.id),
  })

  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>(lead.etiquetas ?? [])

  const handleEtiquetasUpdate = (updated: Etiqueta[]) => {
    setEtiquetas(updated)
    onLeadUpdate({ ...lead, etiquetas: updated })
  }

  const [popoverOpen, setPopoverOpen] = useState(false)
  const [usuarios, setUsuarios] = useState<{ id: number; nome: string; avatar_url?: string | null }[]>([])
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

  const sla = getSLAInfo(lead)

  const followupInfo = useMemo(() => {
    if (!lead.proximo_followup_em) return null
    const dt = new Date(lead.proximo_followup_em)
    const now = new Date()
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    const isOverdue = dt < now
    const isToday = dt <= todayEnd && !isOverdue
    return { dt, isOverdue, isToday }
  }, [lead.proximo_followup_em])

  return (
    <TooltipProvider>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group relative flex items-start gap-3 px-5 py-4 transition-all hover:bg-muted/40 bg-white/50 border-l-2",
          sla?.level === 'critical' ? "border-l-red-500"   :
          sla?.level === 'warning'  ? "border-l-orange-400" :
          "border-l-transparent",
          isDragging && "opacity-50 shadow-lg z-50",
          isSaving && "opacity-60"
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

        {isSaving && (
          <div className="absolute top-2 right-2 z-10">
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/60" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onLeadClick?.(lead)}
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

                <div className="flex items-center gap-2">
                  {lead.avatar_url ? (
                    <img
                      src={lead.avatar_url}
                      alt={lead.nome}
                      className="h-7 w-7 rounded-full object-cover shrink-0 border border-border"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full shrink-0 bg-[#075e54]/10 flex items-center justify-center text-[11px] font-semibold text-[#075e54]">
                      {lead.nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <p className="truncate text-sm font-medium text-foreground">{lead.nome}</p>
                </div>

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

          {vendaRealizada && (vendaRealizada.valor || vendaRealizada.data_venda || vendaRealizada.forma_pagamento) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {vendaRealizada.valor != null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <DollarSign className="h-2.5 w-2.5" />
                  {vendaRealizada.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              )}
              {vendaRealizada.data_venda && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-600 border border-emerald-200">
                  {new Date(vendaRealizada.data_venda + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
              )}
              {vendaRealizada.forma_pagamento && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                  {vendaRealizada.forma_pagamento.split(',').map(v => ({
                    dinheiro: 'Dinheiro', cartao_credito: 'Crédito', cartao_debito: 'Débito',
                    pix: 'Pix', boleto: 'Boleto', financiamento: 'Financ.', cheque: 'Cheque', outro: 'Outro',
                  } as Record<string, string>)[v] ?? v).join(' + ')}
                </span>
              )}
            </div>
          )}

          {lead.loja_id && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {etiquetas.map(e => (
                <EtiquetaBadge key={e.id} etiqueta={e} size="xs" />
              ))}
              <EtiquetasPicker
                leadId={lead.id}
                lojaId={lead.loja_id}
                etiquetas={etiquetas}
                isGerente={isGerente}
                onUpdate={handleEtiquetasUpdate}
              />
            </div>
          )}

          <div className="mt-2">
            {lead.loja_id ? (
              <Popover open={popoverOpen} onOpenChange={handlePopoverOpen}>
                <PopoverTrigger asChild>
                  {lead.responsavel_nome ? (
                    <button className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors cursor-pointer">
                      <AvatarBadge name={lead.responsavel_nome} avatarUrl={lead.responsavel_avatar_url} />
                      <span className="max-w-24 truncate">{lead.responsavel_nome}</span>
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
                          <AvatarBadge name={u.nome} avatarUrl={u.avatar_url} />
                          <span className="truncate">{u.nome}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            ) : (
              lead.responsavel_nome ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                  <AvatarBadge name={lead.responsavel_nome} avatarUrl={lead.responsavel_avatar_url} />
                  <span className="max-w-24 truncate">{lead.responsavel_nome}</span>
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
          {followupInfo && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  followupInfo.isOverdue ? "bg-red-100 text-red-600" :
                  followupInfo.isToday   ? "bg-orange-100 text-orange-600" :
                                           "bg-blue-100 text-blue-600"
                )}>
                  <Bell className="h-2.5 w-2.5" />
                  {format(followupInfo.dt, "dd/MM HH:mm")}
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                {followupInfo.isOverdue ? "Follow-up atrasado" :
                 followupInfo.isToday   ? "Follow-up hoje" :
                                          "Follow-up agendado"}
                {lead.proximo_followup_descricao && `: ${lead.proximo_followup_descricao}`}
              </TooltipContent>
            </Tooltip>
          )}
          {sla && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  sla.level === 'critical'
                    ? "bg-red-100 text-red-600"
                    : "bg-orange-100 text-orange-600"
                )}>
                  <AlertTriangle className="h-2.5 w-2.5" />
                  {sla.elapsed}
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                {lead.status === 'nao_atendido'
                  ? `Sem contato há ${sla.elapsed}`
                  : `Sem atualização há ${sla.elapsed}`}
              </TooltipContent>
            </Tooltip>
          )}
          {(lead.unread_count ?? 0) > 0 && (
            <span className="relative flex h-2.5 w-2.5 mt-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          )}

          <div className="opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => onLeadClick?.(lead)}
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
})

// ── Mobile Lead Card ──────────────────────────────────────────────────────────

interface MobileLeadCardProps {
  lead: Lead
  onLeadClick: (lead: Lead) => void
  isSaving?: boolean
}

const MobileLeadCard = React.memo(function MobileLeadCard({ lead, onLeadClick, isSaving }: MobileLeadCardProps) {
  const sla = getSLAInfo(lead)

  const followupInfo = useMemo(() => {
    if (!lead.proximo_followup_em) return null
    const dt = new Date(lead.proximo_followup_em)
    const now = new Date()
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    const isOverdue = dt < now
    const isToday = dt <= todayEnd && !isOverdue
    return { dt, isOverdue, isToday }
  }, [lead.proximo_followup_em])

  const criado = formatDistanceToNow(new Date(lead.data_criacao), { addSuffix: true, locale: ptBR })

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!lead.telefone) return
    const num = lead.telefone.replace(/\D/g, '')
    window.open(`https://wa.me/55${num}`, '_blank')
  }

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!lead.telefone) return
    window.location.href = `tel:${lead.telefone}`
  }

  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 px-4 py-4 bg-white active:bg-muted/40 transition-colors border-l-[3px]',
        sla?.level === 'critical' ? 'border-l-red-500' :
        sla?.level === 'warning'  ? 'border-l-orange-400' :
        'border-l-transparent',
        isSaving && 'opacity-60'
      )}
      onClick={() => onLeadClick(lead)}
    >
      {isSaving && (
        <span className="absolute top-3 right-3">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/60" />
        </span>
      )}

      {/* Row 1: name + badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <OrigemBadge lead={lead} size="xs" />
            {lead.classificacao === 'quente' && (
              <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
                <Flame size={10} /> Quente
              </span>
            )}
            {lead.classificacao === 'morno' && (
              <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700">
                <Thermometer size={10} /> Morno
              </span>
            )}
            {lead.classificacao === 'frio' && (
              <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                <Snowflake size={10} /> Frio
              </span>
            )}
          </div>
          <p className="text-base font-semibold text-foreground leading-tight">{lead.nome}</p>
          {lead.telefone && (
            <p className="text-sm text-muted-foreground mt-0.5">{lead.telefone}</p>
          )}
        </div>

        {/* SLA + follow-up badges */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {followupInfo && (
            <span className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold',
              followupInfo.isOverdue ? 'bg-red-100 text-red-600' :
              followupInfo.isToday   ? 'bg-orange-100 text-orange-600' :
                                       'bg-blue-100 text-blue-600'
            )}>
              <Bell className="h-2.5 w-2.5" />
              {format(followupInfo.dt, 'dd/MM HH:mm')}
            </span>
          )}
          {sla && (
            <span className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold',
              sla.level === 'critical' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
            )}>
              <AlertTriangle className="h-2.5 w-2.5" />
              {sla.elapsed}
            </span>
          )}
          {(lead.unread_count ?? 0) > 0 && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          )}
        </div>
      </div>

      {/* Row 2: meta */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {lead.responsavel_nome && (
          <span className="flex items-center gap-1.5">
            <AvatarBadge name={lead.responsavel_nome} avatarUrl={lead.responsavel_avatar_url} size="md" />
            {lead.responsavel_nome}
          </span>
        )}
        {lead.expectativa_investimento && (
          <span className="font-medium text-emerald-600">{lead.expectativa_investimento}</span>
        )}
        <span className="ml-auto">{criado}</span>
      </div>

      {/* Row 3: quick actions */}
      {lead.telefone && (
        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
          <button
            onClick={handleWhatsApp}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-50 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200 transition-colors min-h-[40px]"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </button>
          <button
            onClick={handleCall}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-50 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 active:bg-blue-200 transition-colors min-h-[40px]"
          >
            <Phone className="h-4 w-4" />
            Ligar
          </button>
          <button
            onClick={() => onLeadClick(lead)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-100 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 active:bg-slate-300 transition-colors min-h-[40px]"
          >
            <ChevronRight className="h-4 w-4" />
            Abrir
          </button>
        </div>
      )}
    </div>
  )
})