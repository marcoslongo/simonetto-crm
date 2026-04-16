"use client"

import { useState } from 'react'
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
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { LeadDetailsModal } from './lead-dialog'
import { Lead } from '@/lib/types'

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

type StatusKey = typeof COLUNAS[number]['key']


const colorStyles: Record<string, { icon: string; badge: string; empty: string; dropzone: string }> = {
  amber: {
    icon: 'text-amber-500',
    badge: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    empty: 'text-amber-400',
    dropzone: 'ring-amber-400 bg-amber-50/50'
  },
  blue: {
    icon: 'text-blue-500',
    badge: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
    empty: 'text-blue-400',
    dropzone: 'ring-blue-400 bg-blue-50/50'
  },
  emerald: {
    icon: 'text-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
    empty: 'text-emerald-400',
    dropzone: 'ring-emerald-400 bg-emerald-50/50'
  },
  red: {
    icon: 'text-red-500',
    badge: 'bg-red-100 text-red-700 hover:bg-red-100',
    empty: 'text-red-400',
    dropzone: 'ring-red-400 bg-red-50/50'
  },
}

interface KanbanColumnsProps {
  leads: Lead[]
  onLeadClick?: (lead: Lead) => void
  isAdmin?: boolean
  lojas?: Array<{ id: number; nome: string }>
}

export function KanbanColumns({ leads: initialLeads, onLeadClick, isAdmin, lojas = [] }: KanbanColumnsProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [activeLead, setActiveLead] = useState<Lead | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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
    if (lead && novoStatus !== (lead.status ?? 'nao_atendido')) {
      moverLead(lead, novoStatus)
    }
  }

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead)
    setIsModalOpen(true)
    onLeadClick?.(lead)
  }

  return (
    <>
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
          isAdmin={isAdmin}
          lojas={lojas}
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
}

function KanbanColumn({ coluna, items, styles, onLeadClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: coluna.key,
  })

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "bg-gradient-to-br from-slate-50 to-slate-100 transition-all duration-200 min-h-75",
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
            {items.length}
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
            items.map((lead) => (
              <DraggableLeadRow
                key={lead.id}
                lead={lead}
                onOpen={() => onLeadClick?.(lead)}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface DraggableLeadRowProps {
  lead: Lead
  onOpen: () => void
}

function DraggableLeadRow({ lead, onOpen }: DraggableLeadRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: String(lead.id),
  })

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

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onOpen}
              className="min-w-0 flex-1 text-left focus-visible:outline-none cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
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

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onOpen}
            title="Ver detalhes"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </TooltipProvider>
  )
}