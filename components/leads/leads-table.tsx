"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { LeadDetailsModal } from "../dashboard/lead-dialog";
import { Lead } from "@/lib/types";


interface LeadsTableProps {
  leads: Lead[];
  showLoja?: boolean;
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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const avatarColors = [
  "bg-[hsl(199,89%,48%)] text-[hsl(0,0%,100%)]",
  "bg-[hsl(224,56%,22%)] text-[hsl(0,0%,98%)]",
  "bg-emerald-500 text-white",
  "bg-amber-500 text-white",
  "bg-rose-500 text-white",
  "bg-teal-500 text-white",
  "bg-indigo-500 text-white",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function LeadsTable({ leads, showLoja = false }: LeadsTableProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState<"table" | "card" | "compact">("table");

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  return (
    <TooltipProvider>
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
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
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback
                        className={`text-xs font-semibold ${getAvatarColor(
                          lead.nome
                        )}`}
                      >
                        {getInitials(lead.nome)}
                      </AvatarFallback>
                    </Avatar>
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
        />
      )}
    </TooltipProvider>
  );
}


export function LeadsCardGrid({ leads, showLoja = false }: LeadsTableProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {leads.map((lead) => (
          <div
            key={lead.id}
            onClick={() => handleCardClick(lead)}
            className="group relative rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-accent/40 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11">
                  <AvatarFallback
                    className={`text-sm font-semibold ${getAvatarColor(
                      lead.nome
                    )}`}
                  >
                    {getInitials(lead.nome)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-card-foreground text-sm">
                    {lead.nome}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {lead.cidade}, {lead.estado}
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(lead.data_criacao), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{lead.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span>{lead.telefone}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
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

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5">
                <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-sm font-semibold text-card-foreground">
                  {lead.expectativa_investimento}
                </span>
              </div>
              {showLoja && lead.loja_nome && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Store className="h-3 w-3" />
                  {lead.loja_nome}
                </div>
              )}
            </div>

            <div className="absolute left-0 top-0 h-full w-0.5 rounded-l-xl bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      )}
    </>
  );
}


export function LeadsCompactList({ leads, showLoja = false }: LeadsTableProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden divide-y divide-border">
        {leads.map((lead) => (
          <div
            key={lead.id}
            onClick={() => handleRowClick(lead)}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors cursor-pointer group"
          >
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback
                className={`text-xs font-semibold ${getAvatarColor(lead.nome)}`}
              >
                {getInitials(lead.nome)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm text-card-foreground">
                  {lead.nome}
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {lead.cidade}, {lead.estado}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-0.5">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span className="truncate max-w-[160px]">{lead.email}</span>
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {lead.telefone}
                </span>
              </div>
            </div>

            <div className="hidden lg:flex flex-wrap gap-1 max-w-[200px]">
              {lead.interesse
                ?.split(",")
                .slice(0, 2)
                .map((item) => {
                  const key = item.trim().toLowerCase();
                  return (
                    <Badge
                      key={key}
                      variant="outline"
                      className={`text-[10px] font-medium px-1.5 py-0 ${interestColors[key] || "bg-secondary text-secondary-foreground border-border"
                        }`}
                    >
                      {interestLabels[key] || key}
                    </Badge>
                  );
                })}
              {(lead.interesse?.split(",").length || 0) > 2 && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 text-muted-foreground border-border"
                >
                  +{(lead.interesse?.split(",").length || 0) - 2}
                </Badge>
              )}
            </div>

            <div className="hidden md:flex items-center gap-1 text-sm font-semibold text-card-foreground whitespace-nowrap">
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
              {lead.expectativa_investimento}
            </div>

            {showLoja && lead.loja_nome && (
              <span className="hidden xl:inline text-xs text-muted-foreground">
                {lead.loja_nome}
              </span>
            )}

            <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
              {formatDistanceToNow(new Date(lead.data_criacao), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>

            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        ))}
      </div>

      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      )}
    </>
  );
}
