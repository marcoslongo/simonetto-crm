"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Store,
  DollarSign,
  ChevronRight,
} from "lucide-react";
import { LeadDetailsModal } from "./lead-dialog";
import { Lead } from "@/lib/types";


interface LeadsTableProps {
  leads: Lead[];
  showLoja?: boolean;
  isAdmin?: boolean;
}

const interestLabels: Record<string, string> = {
  cozinha: "Cozinha",
  lavanderia: "Lavanderia",
  dormitorio: "Dormitório",
  closet: "Closet",
  completo: "Completo",
  banheiro: "Banheiro",
  escritorio: "Escritório",
};

const interestColors: Record<string, string> = {
  cozinha: "bg-[hsl(199,89%,48%)]/10 text-[hsl(199,89%,48%)] border-[hsl(199,89%,48%)]/20",
  lavanderia: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  dormitorio: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  closet: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  completo: "bg-[hsl(224,56%,22%)]/10 text-[hsl(224,56%,22%)] border-[hsl(224,56%,22%)]/20",
  banheiro: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  escritorio: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
};


export function LeadsTable({ leads, showLoja = false, isAdmin }: LeadsTableProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  return (
    <TooltipProvider>
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table className="bg-linear-to-br from-slate-50 to-slate-100">
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Lead
              </TableHead>
              <TableHead className="h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contato
              </TableHead>
              <TableHead className="h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Localidade
                </div>
              </TableHead>
              <TableHead className="h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Interesses
              </TableHead>
              <TableHead className="h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  Investimento
                </div>
              </TableHead>
              {showLoja && (
                <TableHead className="h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5" />
                    Loja
                  </div>
                </TableHead>
              )}
              <TableHead className="h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Criado
                </div>
              </TableHead>
              <TableHead className="h-11 w-10" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {leads.map((lead) => (
              <TableRow
                key={lead.id}
                onClick={() => handleRowClick(lead)}
                className="cursor-pointer transition-all duration-150 group hover:bg-muted/40"
              >
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-card-foreground truncate">
                        {lead.nome}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-3">
                  <div className="flex flex-col gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-sm truncate max-w-[180px]">
                            {lead.email}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{lead.email}</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-sm">{lead.telefone}</span>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">
                        {lead.cidade}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lead.estado}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {lead.interesse?.split(",").map((item) => {
                      const key = item.trim().toLowerCase();
                      return (
                        <Badge
                          key={key}
                          variant="outline"
                          className={`text-[11px] font-medium px-2 py-0.5 ${interestColors[key] || "bg-secondary text-secondary-foreground border-border"
                            }`}
                        >
                          {interestLabels[key] || key}
                        </Badge>
                      );
                    })}
                  </div>
                </TableCell>

                <TableCell className="py-3">
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-sm font-semibold text-card-foreground">
                      {lead.expectativa_investimento}
                    </span>
                  </div>
                </TableCell>

                {showLoja && (
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                        <Store className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm text-card-foreground">
                        {lead.loja_nome}
                      </span>
                    </div>
                  </TableCell>
                )}

                <TableCell className="py-3">
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(lead.data_criacao), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </TableCell>

                <TableCell className="py-3">
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          isAdmin={isAdmin}
        />
      )}
    </TooltipProvider>
  );
}