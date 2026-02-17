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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Phone,
  MapPin,
  Store,
  Calendar,
  DollarSign,
  User,
  Copy,
  Trash2,
  Clock,
  MessageSquare,
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

      const res = await fetch(`/api/leads/${lead.id}/actions`);

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
      <DialogContent className="flex flex-col h-[80vh] overflow-hidden w-[90vw] sm:w-[80vw] md:w-[70vw] lg:w-[60vw] xl:w-[50vw] max-w-full md:max-w-4xl">
        <div className="px-6 pt-6">
          <DialogHeader className="border-b border-border pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <DialogTitle className="text-2xl font-semibold text-card-foreground">
                    {lead.nome}
                  </DialogTitle>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>{lead.cidade}, {lead.estado}</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>Criado em {formatDate(lead.data_criacao)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex">
                  {isAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-2 mt-1 cursor-pointer">
                          <Trash2 size={16} />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Essa ação não pode ser desfeita.
                            <br />
                            Lead: <strong>{lead.nome}</strong>
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteLead}
                            disabled={loadingDelete}
                            className="bg-destructive text-white"
                          >
                            {loadingDelete ? "Excluindo..." : "Confirmar exclusão"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <Tabs defaultValue="detalhes" className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 border-b border-border">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              {lead.mensagem && (
                <TabsTrigger value="mensagem">Mensagem</TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger value="historico" onClick={fetchActions}>
                  Histórico
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <TabsContent value="detalhes" className="mt-0 space-y-6">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Informações de Contato
                  </h3>
                </div>

                <TooltipProvider>
                  <div className="space-y-4">
                    {/* Email */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-sm text-card-foreground truncate">
                          {lead.email}
                        </span>
                      </div>
                      <div className="flex gap-2 ml-3">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={`mailto:${lead.email}`}
                              onClick={() => registrarContato("email")}
                              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-background transition-colors"
                            >
                              <Mail className="h-4 w-4 text-muted-foreground hover:text-card-foreground" />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>Enviar email</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => copyToClipboard(lead.email)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-background transition-colors"
                            >
                              <Copy className="h-4 w-4 text-muted-foreground hover:text-card-foreground" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Copiar email</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-sm text-card-foreground">
                          {lead.telefone}
                        </span>
                      </div>
                      <div className="flex gap-2 ml-3">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={`tel:${cleanPhone}`}
                              onClick={() => registrarContato("telefone")}
                              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-background transition-colors"
                            >
                              <Phone className="h-4 w-4 text-muted-foreground hover:text-card-foreground" />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>Ligar</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              onClick={() => registrarContato("whatsapp")}
                              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-background transition-colors"
                            >
                              <FaWhatsapp className="h-4 w-4 text-emerald-500 hover:text-emerald-600" />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>WhatsApp</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => copyToClipboard(lead.telefone)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-background transition-colors"
                            >
                              <Copy className="h-4 w-4 text-muted-foreground hover:text-card-foreground" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Copiar telefone</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </TooltipProvider>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Áreas de Interesse
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {lead.interesse?.split(",").map((item) => {
                      const key = item.trim().toLowerCase();
                      return (
                        <Badge
                          key={key}
                          variant="outline"
                          className={`text-xs font-medium px-3 py-1 ${interestColors[key] ||
                            "bg-secondary text-secondary-foreground border-border"
                            }`}
                        >
                          {interestLabels[key] || key}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                    </div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Expectativa de Investimento
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-card-foreground">
                      {lead.expectativa_investimento}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Store className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Loja de Origem
                    </h3>
                  </div>
                  <p className="text-base font-medium text-card-foreground">
                    {lead.loja_nome}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Registro
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Criado:</span>
                      <span className="text-card-foreground font-medium">
                        {formatDate(lead.data_criacao)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Atualizado:</span>
                      <span className="text-card-foreground font-medium">
                        {formatDate(lead.data_atualizacao)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {lead.mensagem && (
              <TabsContent value="mensagem" className="mt-0">
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Mensagem do Lead
                    </h3>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/40">
                    <p className="text-sm text-card-foreground leading-relaxed whitespace-pre-wrap">
                      {lead.mensagem}
                    </p>
                  </div>
                </div>
              </TabsContent>
            )}

            {isAdmin && (
              <TabsContent value="historico" className="mt-0">
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Histórico de Ações
                    </h3>
                  </div>

                  {loadingActions && (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )}

                  {!loadingActions && actions.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        Nenhuma ação registrada ainda.
                      </p>
                    </div>
                  )}

                  {!loadingActions && actions.length > 0 && (
                    <div className="space-y-3">
                      {actions.map((action, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline" className="font-medium">
                              {action.tipo_contato}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(action.criado_em)}
                            </span>
                          </div>
                          {action.observacao && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {action.observacao}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}