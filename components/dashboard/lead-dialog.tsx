"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const interestLabels: Record<string, string> = {
  cozinha: "Cozinha",
  lavanderia: "Lavanderia",
  dormitorio: "Dormitório",
  closet: "Closet",
  completo: "Completo",
};

export function LeadDialog({ lead, open, onOpenChange }: LeadDialogProps) {
  const formatDate = (date: string) =>
    new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

          <div className="flex-1 overflow-y-auto mt-4 min-h-[60vh]">
            <TabsContent value="detalhes" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" /> Contato
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p><Mail className="inline h-4 w-4 mr-2" /> {lead.email}</p>
                    <Separator />
                    <p><Phone className="inline h-4 w-4 mr-2" /> {lead.telefone}</p>
                    <Separator />
                    <p><MapPin className="inline h-4 w-4 mr-2" /> {lead.cidade}/{lead.estado}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" /> Interesse
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {lead.interesse?.split(",").map((item) => {
                        const key = item.trim().toLowerCase();
                        return (
                          <Badge key={key} variant="secondary">
                            {interestLabels[key] || key}
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" /> Loja
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{lead.loja_nome}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" /> Datas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Criado em {formatDate(lead.data_criacao)}</p>
                    <Separator />
                    <p>Atualizado em {formatDate(lead.data_atualizacao)}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

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
                    <p className="whitespace-pre-wrap">{lead.mensagem}</p>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
