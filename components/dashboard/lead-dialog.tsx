"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Phone,
  MapPin,
  Store,
  Calendar,
  DollarSign,
  MessageSquare,
  User,
} from "lucide-react";
import { Lead } from "@/lib/types";

interface LeadDialogProps {
  lead: Lead;
}

const interestLabels: Record<string, string> = {
  cozinha: "Cozinha",
  lavanderia: "Lavanderia",
  dormitorio: "Dormitório",
  closet: "Closet",
  completo: "Completo",
};

// Exemplo de ações estáticas
const exampleActions = [
  {
    id: 1,
    realizado: true,
    observacoes: "Contato realizado, lead demonstrou interesse no produto X.",
    data_criacao: "2026-01-29T15:30:00",
  },
  {
    id: 2,
    realizado: false,
    observacoes: "Agendar nova ligação para próxima semana.",
    data_criacao: "2026-01-30T09:00:00",
  },
];

export function LeadDialog({ lead }: LeadDialogProps) {
  const [open, setOpen] = useState(false);

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-left">
          {lead.nome}
        </Button>
      </DialogTrigger>

      <DialogContent className="h-[80vh] overflow-hidden w-[90vw] sm:w-[80vw] md:w-[70vw] lg:w-[60vw] xl:w-[50vw] max-w-full md:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{lead.nome}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="detalhes" className="h-full flex flex-col">
          <TabsList>
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            {lead.mensagem && <TabsTrigger value="mensagem">Mensagem</TabsTrigger>}
            <TabsTrigger value="acoes">Ações</TabsTrigger>
          </TabsList>

          {/* Container do conteúdo rolável com altura mínima */}
          <div className="flex-1 overflow-y-auto mt-4 min-h-[60vh]">
            {/* Aba Detalhes */}
            <TabsContent value="detalhes" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Contato */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" /> Contato
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <a href={`mailto:${lead.email}`} className="font-medium hover:underline">
                          {lead.email}
                        </a>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Telefone</p>
                        <a href={`tel:${lead.telefone}`} className="font-medium hover:underline">
                          {lead.telefone}
                        </a>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Localização</p>
                        <p className="font-medium">
                          {lead.cidade && lead.estado ? `${lead.cidade}/${lead.estado}` : "Não informado"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Interesse */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" /> Interesse
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Tipo de Interesse</p>
                      {lead.interesse ? (
                        <Badge variant="secondary" className="text-sm">
                          {interestLabels[lead.interesse] || lead.interesse}
                        </Badge>
                      ) : (
                        <p className="text-muted-foreground">Não informado</p>
                      )}
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Expectativa de Investimento</p>
                      <p className="font-medium">{lead.expectativa_investimento || "Não informado"}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Região de Interesse</p>
                      <p className="font-medium">{lead.loja_regiao || "Não informado"}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Loja */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" /> Loja
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lead.loja_nome ? (
                      <div className="space-y-2">
                        <p className="font-medium text-lg">{lead.loja_nome}</p>
                        {(lead.loja_cidade || lead.loja_estado) && (
                          <p className="text-muted-foreground">
                            {[lead.loja_cidade, lead.loja_estado].filter(Boolean).join("/")}
                          </p>
                        )}
                        <Badge variant="outline">ID: {lead.loja_id}</Badge>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nenhuma loja associada</p>
                    )}
                  </CardContent>
                </Card>

                {/* Datas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" /> Datas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Data de Criação</p>
                      <p className="font-medium">{formatDate(lead.data_criacao)}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Última Atualização</p>
                      <p className="font-medium">{formatDate(lead.data_atualizacao)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Aba Mensagem */}
            {lead.mensagem && (
              <TabsContent value="mensagem">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" /> Mensagem
                    </CardTitle>
                    <CardDescription>Mensagem enviada pelo lead</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-foreground">{lead.mensagem}</p>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Aba Ações */}
            <TabsContent value="acoes">
              <Card className="space-y-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" /> Ações do Lead
                  </CardTitle>
                  <CardDescription>Registros de atendimento e observações</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {exampleActions.map((action) => (
                    <Card key={action.id} className="border">
                      <CardHeader className="flex justify-between items-center">
                        <CardTitle className="text-sm font-medium">
                          {action.realizado ? (
                            <Badge variant="default">Realizado</Badge>
                          ) : (
                            <Badge variant="outline">Pendente</Badge>
                          )}
                        </CardTitle>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(action.data_criacao)}
                        </span>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{action.observacoes}</p>
                      </CardContent>
                    </Card>
                  ))}

                  <Button variant="outline" className="w-full mt-2">
                    + Registrar nova ação
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}