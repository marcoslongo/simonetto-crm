"use client";

import { useState } from "react";
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
  Trash2,
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
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface LeadDialogProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContatoRealizado?: () => void;
  isAdmin?: boolean;
}

const interestLabels: Record<string, string> = {
  cozinha: "Cozinha",
  lavanderia: "Lavanderia",
  dormitorio: "Dormitório",
  closet: "Closet",
  completo: "Completo",
};

export function LeadDetailsModal({
  lead,
  open,
  onOpenChange,
  onContatoRealizado,
  isAdmin,
}: LeadDialogProps) {
  const router = useRouter();

  const [loadingDelete, setLoadingDelete] = useState(false);
  const [actions, setActions] = useState<any[]>([]);
  const [loadingActions, setLoadingActions] = useState(false);

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
      onContatoRealizado?.();
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const cleanPhone = lead.telefone.replace(/\D/g, "");

  const registrarContato = async (tipo: string) => {
    onContatoRealizado?.();

    try {
      await fetch("/api/lead-contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: lead.id,
          tipo_contato: tipo,
          observacao: `Contato via ${tipo}`,
        }),
      });
    } catch {
      toast.error("Erro ao registrar contato");
    }
  };

  const handleDeleteLead = async () => {
    try {
      setLoadingDelete(true);

      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.mensagem || "Erro ao excluir lead");
        return;
      }

      toast.success("Lead excluído com sucesso");
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Erro ao excluir lead");
    } finally {
      setLoadingDelete(false);
    }
  };

  const fetchActions = async () => {
    if (!isAdmin) return;

    try {
      setLoadingActions(true);

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

      const res = await fetch(`/api/leads/${lead.id}/actions`)

      if (!res.ok) throw new Error("Erro API");

      const data = await res.json();

      setActions(data?.actions || data || []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar histórico");
    } finally {
      setLoadingActions(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[80vh] overflow-hidden w-[90vw] sm:w-[80vw] md:w-[70vw] lg:w-[60vw] xl:w-[50vw] max-w-full md:max-w-4xl">
        <DialogHeader className="flex flex-col items-start gap-3">
          <DialogTitle>{lead.nome}</DialogTitle>

          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                >
                  <Trash2 size={16} />
                  Excluir
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Excluir lead?
                  </AlertDialogTitle>

                  <AlertDialogDescription>
                    Essa ação não pode ser desfeita.
                    <br />
                    Lead: <strong>{lead.nome}</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>
                    Cancelar
                  </AlertDialogCancel>

                  <AlertDialogAction
                    onClick={handleDeleteLead}
                    disabled={loadingDelete}
                    className="bg-destructive text-white"
                  >
                    {loadingDelete
                      ? "Excluindo..."
                      : "Confirmar exclusão"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </DialogHeader>

        <Tabs defaultValue="detalhes" className="h-full flex flex-col">
          <TabsList>
            <TabsTrigger value="detalhes">
              Detalhes
            </TabsTrigger>

            {lead.mensagem && (
              <TabsTrigger value="mensagem">
                Mensagem
              </TabsTrigger>
            )}

            {isAdmin && (
              <TabsTrigger
                value="historico"
                onClick={fetchActions}
              >
                Histórico
              </TabsTrigger>
            )}
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4 min-h-[60vh]">
            {/* DETALHES */}
            <TabsContent value="detalhes" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Contato
                    </CardTitle>
                  </CardHeader>

                  <TooltipProvider>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span>{lead.email}</span>
                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={`mailto:${lead.email}`}
                                onClick={() =>
                                  registrarContato("email")
                                }
                              >
                                <Mail size={16} />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              Enviar email
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() =>
                                  copyToClipboard(lead.email)
                                }
                              >
                                <Copy size={16} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Copiar email
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex justify-between">
                        <span>{lead.telefone}</span>
                        <div className="flex gap-2">
                          <Link
                            href={`tel:${cleanPhone}`}
                            onClick={() =>
                              registrarContato("telefone")
                            }
                          >
                            <Phone size={16} />
                          </Link>

                          <Link
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            onClick={() =>
                              registrarContato("whatsapp")
                            }
                          >
                            <FaWhatsapp size={16} />
                          </Link>

                          <button
                            onClick={() =>
                              copyToClipboard(lead.telefone)
                            }
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>

                      <Separator />

                      <p>
                        <MapPin className="inline mr-2 h-4 w-4" />
                        {lead.cidade}/{lead.estado}
                      </p>
                    </CardContent>
                  </TooltipProvider>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>
                      <DollarSign className="h-5 w-5 inline mr-2" />
                      Interesse
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    {lead.interesse
                      ?.split(",")
                      .map((item) => {
                        const key =
                          item.trim().toLowerCase();
                        return (
                          <Badge key={key}>
                            {interestLabels[key] || key}
                          </Badge>
                        );
                      })}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Store className="h-5 w-5 inline mr-2" />
                      Loja
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lead.loja_nome}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Calendar className="h-5 w-5 inline mr-2" />
                      Datas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    Criado: {formatDate(lead.data_criacao)}
                    <Separator />
                    Atualizado:{" "}
                    {formatDate(lead.data_atualizacao)}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {lead.mensagem && (
              <TabsContent value="mensagem">
                <Card>
                  <CardHeader>
                    <CardTitle>Mensagem</CardTitle>
                    <CardDescription>
                      Mensagem enviada pelo lead
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {lead.mensagem}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {isAdmin && (
              <TabsContent value="historico">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Histórico de ações
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    {loadingActions && (
                      <p>Carregando...</p>
                    )}

                    {!loadingActions &&
                      actions.length === 0 && (
                        <p>Nenhuma ação registrada.</p>
                      )}

                    {actions.map((action, i) => (
                      <div
                        key={i}
                        className="border rounded p-3 mb-3"
                      >
                        <p className="font-medium">
                          {action.tipo_contato}
                        </p>

                        {action.observacao && (
                          <p className="text-sm text-muted-foreground">
                            {action.observacao}
                          </p>
                        )}

                        <p className="text-xs text-muted-foreground">
                          {formatDate(action.criado_em)}
                        </p>
                      </div>
                    ))}
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