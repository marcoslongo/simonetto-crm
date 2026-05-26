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
import type { Lead } from "@/lib/types"

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  nao_atendido:        { label: "Não Atendido",       className: "bg-amber-100 text-amber-800 border-amber-200" },
  em_negociacao:       { label: "Em Negociação",       className: "bg-blue-100 text-blue-800 border-blue-200" },
  venda_realizada:     { label: "Venda Realizada",     className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  venda_nao_realizada: { label: "Venda Não Realizada", className: "bg-red-100 text-red-800 border-red-200" },
}

interface LeadsRecentesProps {
  leads: Lead[]
  total: number
  lojaId: number
  isAdmin?: boolean
  currentUserId?: number
}

export function LeadsRecentes({ leads: initialLeads, total, lojaId, isAdmin, currentUserId }: LeadsRecentesProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [page, setPage] = useState(1)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isPending, startTransition] = useTransition()

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
                  const s = STATUS_CONFIG[lead.status] ?? { label: lead.status, className: "bg-slate-100 text-slate-600 border-slate-200" }
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
          currentUserId={currentUserId}
        />
      )}
    </>
  )
}
