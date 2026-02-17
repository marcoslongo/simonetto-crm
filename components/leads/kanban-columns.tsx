"use client"

import { useState, useRef } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, ChevronRight, CircleCheckBig } from 'lucide-react'
import { Lead } from '@/lib/types'
import { LeadDetailsModal } from '@/components/leads/lead-dialog'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface KanbanColumnsProps {
  leads: Lead[]
}

async function registrarContato(leadId: string) {
  const res = await fetch('/api/lead-contato', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lead_id: leadId,
      tipo_contato: 'manual',
      observacao: 'Marcado como atendido pelo lojista',
    }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.mensagem ?? 'Erro ao registrar contato.')
  }
}

export function KanbanColumns({ leads: initialLeads }: KanbanColumnsProps) {
  const [leads, setLeads]               = useState<Lead[]>(initialLeads)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [pendingId, setPendingId]       = useState<string | null>(null)

  // Rastreia se houve interação real dentro do modal (copy, whatsapp, tel, email)
  const contatoRealizadoRef = useRef(false)

  const naoAtendidos = leads.filter((l) => !l.atendido)
  const atendidos    = leads.filter((l) => l.atendido)

  const marcarAtendidoLocalmente = (id: string) => {
    setLeads((prev) =>
      prev.map((l) => String(l.id) === id ? { ...l, atendido: true } : l)
    )
  }

  const handleMarcarAtendido = async (lead: Lead) => {
    const id = String(lead.id)

    marcarAtendidoLocalmente(id)
    setPendingId(id)

    try {
      await registrarContato(id)
      toast.success('Lead marcado como atendido.')
    } catch (err: any) {
      // Reverte se der erro
      setLeads((prev) =>
        prev.map((l) => String(l.id) === id ? { ...l, atendido: false } : l)
      )
      toast.error(err?.message ?? 'Erro ao atualizar lead.')
    } finally {
      setPendingId(null)
    }
  }

  const handleOpenModal = (lead: Lead) => {
    contatoRealizadoRef.current = false // reseta ao abrir
    setSelectedLead(lead)
  }

  const handleModalClose = () => {
    // Só move para atendido se houve interação real (copy, whatsapp, tel, email)
    if (contatoRealizadoRef.current && selectedLead) {
      marcarAtendidoLocalmente(String(selectedLead.id))
    }
    contatoRealizadoRef.current = false
    setSelectedLead(null)
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-base">Não Atendidos</CardTitle>
              </div>
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-700 hover:bg-amber-100"
              >
                {naoAtendidos.length}
              </Badge>
            </div>
            <CardDescription>Leads aguardando primeiro contato</CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y">
              {naoAtendidos.length === 0 ? (
                <div className='flex justify-center'>
                  <p className="px-6 py-8 text-center text-lg text-muted-foreground flex items-center gap-2">
                    Nenhum lead pendente <CircleCheckBig size={20} className='text-emerald-500' />
                  </p>
                </div>
              ) : (
                naoAtendidos.map((lead) => (
                  <LeadKanbanRow
                    key={lead.id}
                    lead={lead}
                    isPending={pendingId === String(lead.id)}
                    onOpen={() => handleOpenModal(lead)}
                    onMarcarAtendido={() => handleMarcarAtendido(lead)}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <CardTitle className="text-base">Atendidos</CardTitle>
              </div>
              <Badge
                variant="secondary"
                className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
              >
                {atendidos.length}
              </Badge>
            </div>
            <CardDescription>Leads que já foram contactados</CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y">
              {atendidos.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Nenhum lead atendido ainda
                </p>
              ) : (
                atendidos.map((lead) => (
                  <LeadKanbanRow
                    key={lead.id}
                    lead={lead}
                    attended
                    isPending={false}
                    onOpen={() => handleOpenModal(lead)}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          open={!!selectedLead}
          onContatoRealizado={() => {
            contatoRealizadoRef.current = true
          }}
          onOpenChange={(open) => {
            if (!open) handleModalClose()
          }}
        />
      )}
    </>
  )
}

// ─── Row ─────────────────────────────────────────────────────────────────────

interface LeadKanbanRowProps {
  lead: Lead
  attended?: boolean
  isPending: boolean
  onOpen: () => void
  onMarcarAtendido?: () => void
}

function LeadKanbanRow({
  lead,
  attended = false,
  isPending,
  onOpen,
  onMarcarAtendido,
}: LeadKanbanRowProps) {
  const criado = formatDistanceToNow(new Date(lead.data_criacao), {
    addSuffix: true,
    locale: ptBR,
  })

  return (
    <div className="group flex items-start gap-3 px-5 py-4 transition-colors hover:bg-muted/40">
      <button
        onClick={onOpen}
        className="min-w-0 flex-1 text-left focus-visible:outline-none"
      >
        <p className={`truncate text-sm font-medium ${attended ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
          {lead.nome}
        </p>

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

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={onOpen}
          title="Ver detalhes"
          className="rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}