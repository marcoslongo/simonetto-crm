import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Lead } from "@/lib/types";

interface LeadsTableProps {
  leads: Lead[];
  basePath: string;
  showLoja?: boolean;
}

const interestLabels: Record<string, string> = {
  cozinha: "Cozinha",
  lavanderia: "Lavanderia",
  dormitorio: "Dormitório",
  closet: "Closet",
  completo: "Completo",
};

const investmentLabels: Record<string, string> = {
  "50-100k": "R$ 50-100k",
  "100-150k": "R$ 100-150k",
  "150-200k": "R$ 150-200k",
  "200-250k": "R$ 200-250k",
  "acima-250k": "Acima R$ 250k",
};

export function LeadsTable({ leads, basePath, showLoja = false }: LeadsTableProps) {
  return (
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
            <TableRow key={lead.id}>
              <TableCell>
                <Link
                  href={`${basePath}/leads/${lead.id}`}
                  className="font-medium hover:underline"
                >
                  {lead.nome}
                </Link>
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
                <Badge variant="secondary" className="text-xs">
                  {interestLabels[lead.interesse] || lead.interesse}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {investmentLabels[lead.expectativa_investimento] || lead.expectativa_investimento}
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
  );
}