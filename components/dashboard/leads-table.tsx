"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Lead } from "@/lib/types";
import { LeadDialog } from "./lead-dialog";

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

export function LeadsTable({ leads, showLoja = false }: LeadsTableProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Interesse</TableHead>
              <TableHead>Investimento</TableHead>
              {showLoja && <TableHead>Loja</TableHead>}
              <TableHead>Criado</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {leads.map((lead) => (
              <TableRow
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell className="font-medium">
                  {lead.nome}
                </TableCell>

                <TableCell className="text-sm text-muted-foreground">
                  {lead.email}
                </TableCell>

                <TableCell className="text-sm">
                  {lead.telefone}
                </TableCell>

                <TableCell className="text-sm">
                  {lead.cidade}, {lead.estado}
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {lead.interesse?.split(",").map((item) => {
                      const key = item.trim().toLowerCase();
                      return (
                        <Badge key={key} variant="secondary" className="text-xs">
                          {interestLabels[key] || key}
                        </Badge>
                      );
                    })}
                  </div>
                </TableCell>

                <TableCell className="text-sm">
                  {lead.expectativa_investimento}
                </TableCell>

                {showLoja && (
                  <TableCell className="text-sm">
                    {lead.loja_nome}
                  </TableCell>
                )}

                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(lead.data_criacao), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {selectedLead && (
        <LeadDialog
          lead={selectedLead}
          open={!!selectedLead}
          onOpenChange={(open) => !open && setSelectedLead(null)}
        />
      )}
    </>
  );
}