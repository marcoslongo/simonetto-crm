'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Phone, Store, Calendar, ChevronLeft, ChevronRight, User } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { fetchLeadsByStatusPaginated } from '@/actions/leads-actions'
import type { Lead } from '@/lib/types'

const CLASSIF_COLORS: Record<string, string> = {
  quente: 'bg-orange-100 text-orange-700',
  morno:  'bg-yellow-100 text-yellow-700',
  frio:   'bg-sky-100 text-sky-700',
}

interface LeadsStatusModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  status: string
  statusLabel: string
  statusBadgeClass: string
  from?: string
  to?: string
}

export function LeadsStatusModal({
  open,
  onOpenChange,
  status,
  statusLabel,
  statusBadgeClass,
  from,
  to,
}: LeadsStatusModalProps) {
  const [page, setPage] = useState(1)
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) setPage(1)
  }, [open, status])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetchLeadsByStatusPaginated({ status, page, from, to })
      .then(r => { setLeads(r.leads); setTotal(r.total); setTotalPages(r.totalPages) })
      .finally(() => setLoading(false))
  }, [open, status, page, from, to])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2.5">
            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${statusBadgeClass}`}>
              {statusLabel}
            </span>
            {loading
              ? <span className="text-sm text-muted-foreground font-normal">carregando...</span>
              : <span className="text-base font-bold text-[#16255c]">
                  {total.toLocaleString('pt-BR')} lead{total !== 1 ? 's' : ''}
                </span>
            }
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : leads.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
              Nenhum lead neste status
            </div>
          ) : (
            <div className="space-y-2">
              {leads.map(lead => (
                <div
                  key={lead.id}
                  className="rounded-lg border border-border/60 bg-card p-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-[#16255c]">{lead.nome}</p>
                        {lead.classificacao && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize ${CLASSIF_COLORS[lead.classificacao] ?? 'bg-slate-100 text-slate-600'}`}>
                            {lead.classificacao}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3 shrink-0" />
                          {lead.telefone}
                        </span>
                        {lead.loja_nome && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground max-w-52 truncate">
                            <Store className="h-3 w-3 shrink-0" />
                            {lead.loja_nome}
                          </span>
                        )}
                        {lead.responsavel_nome && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3 shrink-0" />
                            {lead.responsavel_nome}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(lead.data_criacao), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      {lead.interesse && (
                        <p className="text-[10px] text-muted-foreground max-w-36 truncate text-right">
                          {lead.interesse}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-6 py-3">
            <span className="text-xs text-muted-foreground">
              {(page - 1) * 10 + 1}–{Math.min(page * 10, total)} de {total.toLocaleString('pt-BR')}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline" size="sm" className="h-7 text-xs"
                disabled={page === 1 || loading}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="h-3 w-3 mr-1" /> Anterior
              </Button>
              <span className="text-xs text-muted-foreground px-1 tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline" size="sm" className="h-7 text-xs"
                disabled={page === totalPages || loading}
                onClick={() => setPage(p => p + 1)}
              >
                Próxima <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
