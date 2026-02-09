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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  Copy,
} from "lucide-react";
import { Lead } from "@/lib/types";
import Link from "next/link";
import { toast } from "sonner";
import { FaWhatsapp } from "react-icons/fa";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copiado!");
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const cleanPhone = lead.telefone.replace(/\D/g, "");

  const registrarContato = async (tipo: string) => {
    try {
      await fetch("/api/lead-contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: lead.id,
          tipo_contato: tipo,
          usuario_id: 1, // depois pegar do auth
          observacao: `Contato via ${tipo}`,
        }),
      });
    } catch {
      toast.error("Erro ao registrar contato");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[80vh] overflow-hidden w-[90vw] sm:w-[80vw] md:w-[70vw] lg:w-[60vw] xl:w-[50vw] max-w-full md:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{lead.nome}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="detalhes" className="h-full flex flex-col">
          <TabsList>
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            {lead.mensagem && (
              <TabsTrigger value="mensagem">Mensagem</TabsTrigger>
            )}
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

                  <TooltipProvider>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {lead.email}
                        </div>

                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={`mailto:${lead.email}`}
                                className="px-2 py-1 border rounded hover:bg-muted"
                                onClick={() => registrarContato("email")}
                              >
                                <Mail size={16} />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>Enviar email</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => copyToClipboard(lead.email)}
                                className="px-2 py-1 border rounded hover:bg-muted"
                              >
                                <Copy size={16} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Copiar email</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {lead.telefone}
                        </div>

                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={`tel:${cleanPhone}`}
                                className="px-2 py-1 border rounded hover:bg-muted"
                                onClick={() =>
                                  registrarContato("telefone")
                                }
                              >
                                <Phone size={16} />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>Ligar</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                className="px-2 py-1 border rounded hover:bg-muted"
                                onClick={() =>
                                  registrarContato("whatsapp")
                                }
                              >
                                <FaWhatsapp size={16} />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>WhatsApp</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() =>
                                  copyToClipboard(lead.telefone)
                                }
                                className="px-2 py-1 border rounded hover:bg-muted"
                              >
                                <Copy size={16} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Copiar telefone
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      <Separator />

                      <p>
                        <MapPin className="inline h-4 w-4 mr-2" />
                        {lead.cidade}/{lead.estado}
                      </p>
                    </CardContent>
                  </TooltipProvider>
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
                    <p>
                      Atualizado em{" "}
                      {formatDate(lead.data_atualizacao)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {lead.mensagem && (
              <TabsContent value="mensagem">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Mensagem
                    </CardTitle>
                    <CardDescription>
                      Mensagem enviada pelo lead
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">
                      {lead.mensagem}
                    </p>
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