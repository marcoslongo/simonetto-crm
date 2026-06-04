"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LeadDetailsModal } from "@/components/leads/lead-dialog"
import { Users, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import { fetchLojaLeadsPaginated } from "@/actions/leads-actions"
import type { Lead, KanbanColuna } from "@/lib/types"
import { STATUS_LABELS, STATUS_BADGE_CLASSES, COR_TO_BADGE_CLASS } from "@/lib/kanban-config"

const DEFAULT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  nao_atendido:        { label: STATUS_LABELS.nao_atendido,        className: STATUS_BADGE_CLASSES.nao_atendido },
  em_negociacao:       { label: STATUS_LABELS.em_negociacao,       className: STATUS_BADGE_CLASSES.em_negociacao },
  venda_realizada:     { label: STATUS_LABELS.venda_realizada,     className: STATUS_BADGE_CLASSES.venda_realizada },
  venda_nao_realizada: { label: STATUS_LABELS.venda_nao_realizada, className: STATUS_BADGE_CLASSES.venda_nao_realizada },
}

// kept for backward compat — use COR_TO_BADGE_CLASS from kanban-config instead
const COR_TO_CLASS: Record<string, string> = {
  amber:   COR_TO_BADGE_CLASS.amber,
  blue:    COR_TO_BADGE_CLASS.blue,
  emerald: COR_TO_BADGE_CLASS.emerald,
  red:     COR_TO_BADGE_CLASS.red,
  rose:    COR_TO_BADGE_CLASS.rose,
  slate:   COR_TO_BADGE_CLASS.slate,
  purple:  COR_TO_BADGE_CLASS.purple,
  indigo:  COR_TO_BADGE_CLASS.indigo,
  teal:    COR_TO_BADGE_CLASS.teal,
  orange:  "bg-orange-100 text-orange-800 border-orange-200",
  pink:    "bg-pink-100 text-pink-800 border-pink-200",
  violet:  "bg-violet-100 text-violet-800 border-violet-200",
  cyan:    "bg-cyan-100 text-cyan-800 border-cyan-200",
  gray:    "bg-gray-100 text-gray-700 border-gray-200",
}

interface LeadsRecentesProps {
  leads: Lead[]
  total: number
  lojaId: number
  isAdmin?: boolean
  isGerente?: boolean
  currentUserId?: number
  colunas?: KanbanColuna[]
}

export function LeadsRecentes({ leads: initialLeads, total, lojaId, isAdmin, isGerente, currentUserId, colunas }: LeadsRecentesProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [page, setPage] = useState(1)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isPending, startTransition] = useTransition()

  const statusConfig: Record<string, { label: string; className: string }> = { ...DEFAULT_STATUS_CONFIG }
  if (colunas) {
    for (const col of colunas) {
      statusConfig[col.slug] = {
        label: col.label,
        className: COR_TO_CLASS[col.cor] ?? "bg-slate-100 text-slate-600 border-slate-200",
      }
    }
  }

  const totalPages = Math.ceil(total / 10) || 1

  function goTo(next: number) {
    startTransition(async () => {
      const { leads: fetched } = await fetchLojaLeadsPaginated(lojaId, next)
      setLeads(fetched)
      setPage(next)
    })
  }

  if (!total && !initialLeads.length) {
    return (
      <Card className="border-0 shadow-lg bg-linear-to-br from-slate-50 to-slate-100">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#16255c]">Leads Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex flex-col items-center justify-center gap-2">
            <Users className="h-8 w-8 text-slate-300" />
            <p className="text-slate-400 text-sm">Nenhum lead cadastrado</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-0 shadow-lg bg-linear-to-br from-slate-50 to-slate-100">
        <CardHeader>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#16255c]/10">
              <Users className="h-4 w-4 text-[#16255c]" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-[#16255c]">Leads Recentes</CardTitle>
              <CardDescription className="text-slate-500">
                {total} lead{total !== 1 ? "s" : ""} · clique para abrir
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 pb-2">
          <div className={`overflow-x-auto transition-opacity duration-150 ${isPending ? "opacity-50" : ""}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="text-left px-5 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Nome</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wider hidden sm:table-cell">Atendente</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wider hidden md:table-cell">Entrada</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => {
                  const s = statusConfig[lead.status] ?? { label: lead.status, className: "bg-slate-100 text-slate-600 border-slate-200" }
                  return (
                    <tr
                      key={lead.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-white/70 transition-colors cursor-pointer group"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-800 leading-tight">{lead.nome}</p>
                        {lead.telefone && (
                          <p className="text-xs text-slate-400 mt-0.5 tabular-nums">{lead.telefone}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-[11px] font-semibold whitespace-nowrap ${s.className}`}>
                          {s.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {lead.responsavel_nome
                          ? <span className="text-slate-600 text-xs">{lead.responsavel_nome}</span>
                          : <span className="text-slate-400 text-xs italic">Não atribuído</span>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-slate-500 text-xs tabular-nums">
                          {format(new Date(lead.data_criacao), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </td>
                      <td className="pr-4 py-3">
                        <ExternalLink className="h-3.5 w-3.5 text-slate-300 group-hover:text-[#16255c] transition-colors" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 pt-3 pb-1 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                Página {page} de {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page === 1 || isPending}
                  onClick={() => goTo(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page === totalPages || isPending}
                  onClick={() => goTo(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          open
          onOpenChange={(o: boolean) => { if (!o) setSelectedLead(null) }}
          isAdmin={isAdmin}
          isGerente={isGerente}
          currentUserId={currentUserId}
        />
      )}
    </>
  )
}
