"use client";

import { useState, useEffect } from "react";
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
  Pencil,
  Check,
  X,
  XCircle,
} from "lucide-react";
import { Lead, VendaNaoRealizada } from "@/lib/types";
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
import { ChatPanel } from "@/components/chat/chat-panel";
import { NotasLead } from "@/components/leads/notas-lead";
import { FollowupLead } from "@/components/leads/followup-lead";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LojaOption {
  id: number;
  nome: string;
}

interface LeadDialogProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContatoRealizado?: () => void;
  onMessagesRead?: (leadId: string) => void;
  isAdmin?: boolean;
  lojas?: LojaOption[];
  currentUserId?: number;
  onFollowupUpdate?: (next: { em: string; descricao?: string | null } | null) => void;
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
  onMessagesRead,
  isAdmin,
  lojas = [],
  currentUserId,
  onFollowupUpdate,
}: LeadDialogProps) {
  const router = useRouter();

  // Marca mensagens como lidas quando o dialog abre
  useEffect(() => {
    if (open && lead.id) {
      fetch(`/api/mensagens/${lead.id}/read`, { method: 'POST' })
        .then(() => onMessagesRead?.(String(lead.id)))
        .catch(() => {})
    }
  }, [open, lead.id])

  const [loadingDelete, setLoadingDelete] = useState(false);
  const [actions, setActions] = useState<any[]>([]);
  const [loadingActions, setLoadingActions] = useState(false);

  const [editingLoja, setEditingLoja] = useState(false);
  const [selectedLojaId, setSelectedLojaId] = useState<string>(lead.loja_id ?? "");
  const [currentLojaNome, setCurrentLojaNome] = useState(lead.loja_nome ?? "");
  const [savingLoja, setSavingLoja] = useState(false);

  const [editingResponsavel, setEditingResponsavel] = useState(false);
  const [selectedResponsavelId, setSelectedResponsavelId] = useState<string>(
    lead.responsavel_id ? String(lead.responsavel_id) : "none"
  );
  const [currentResponsavelNome, setCurrentResponsavelNome] = useState(
    lead.responsavel_nome ?? ""
  );
  const [savingResponsavel, setSavingResponsavel] = useState(false);
  const [usuarios, setUsuarios] = useState<{ id: number; nome: string; email: string }[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  const [vendaNaoRealizada, setVendaNaoRealizada] = useState<VendaNaoRealizada | null>(null);
  const [loadingVnr, setLoadingVnr] = useState(false);

  useEffect(() => {
    setSelectedLojaId(lead.loja_id ?? "");
    setCurrentLojaNome(lead.loja_nome ?? "");
    setEditingLoja(false);
    setSelectedResponsavelId(lead.responsavel_id ? String(lead.responsavel_id) : "none");
    setCurrentResponsavelNome(lead.responsavel_nome ?? "");
    setEditingResponsavel(false);
    setUsuarios([]);
    setVendaNaoRealizada(null);
  }, [lead.id]);

  useEffect(() => {
    if (lead.status !== "venda_nao_realizada" || !open) return;
    setLoadingVnr(true);
    fetch(`/api/leads/${lead.id}/venda-nao-realizada`)
      .then(r => r.json())
      .then(d => setVendaNaoRealizada(d.data ?? null))
      .catch(() => {})
      .finally(() => setLoadingVnr(false));
  }, [lead.id, lead.status, open]);

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
          loja_id: lead.loja_id ? Number(lead.loja_id) : undefined,
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
      const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
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

  const handleSaveLoja = async () => {
    try {
      setSavingLoja(true);
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loja_id: selectedLojaId ? Number(selectedLojaId) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.mensagem || "Erro ao atualizar loja");
        return;
      }
      const novaLoja = lojas.find((l) => String(l.id) === selectedLojaId);
      setCurrentLojaNome(novaLoja?.nome ?? "—");
      setEditingLoja(false);
      toast.success("Loja atualizada com sucesso");
      router.refresh();
    } catch {
      toast.error("Erro ao atualizar loja");
    } finally {
      setSavingLoja(false);
    }
  };

  const handleCancelEditLoja = () => {
    setSelectedLojaId(lead.loja_id ?? "");
    setEditingLoja(false);
  };

  const handleEditResponsavel = async () => {
    setEditingResponsavel(true);
    if (!lead.loja_id) return;
    setLoadingUsuarios(true);
    try {
      const res = await fetch(`/api/lojas/${lead.loja_id}/usuarios`);
      const data = await res.json();
      if (res.ok) setUsuarios(data.usuarios || []);
    } catch {
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const handleSaveResponsavel = async () => {
    try {
      setSavingResponsavel(true);
      const responsavelId =
        selectedResponsavelId && selectedResponsavelId !== "none"
          ? Number(selectedResponsavelId)
          : null;
      const res = await fetch(`/api/leads/${lead.id}/responsavel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responsavel_id: responsavelId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.mensagem || "Erro ao atualizar atendente");
        return;
      }
      const novoResponsavel = responsavelId
        ? usuarios.find((u) => u.id === responsavelId)
        : null;
      setCurrentResponsavelNome(novoResponsavel?.nome ?? "");
      setEditingResponsavel(false);
      toast.success("Atendente atualizado com sucesso");
      router.refresh();
    } catch {
      toast.error("Erro ao atualizar atendente");
    } finally {
      setSavingResponsavel(false);
    }
  };

  const handleCancelEditResponsavel = () => {
    setSelectedResponsavelId(
      lead.responsavel_id ? String(lead.responsavel_id) : "none"
    );
    setEditingResponsavel(false);
  };

  const fetchActions = async () => {
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
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex flex-col h-[90vh] overflow-hidden w-[90vw] sm:max-w-[90vw]">
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
                  {isAdmin && (
                    <div className="flex">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2 mt-1 cursor-pointer"
                          >
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
                    </div>
                  )}
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
                <TabsTrigger value="atendimento">Atendimento</TabsTrigger>
                <TabsTrigger value="notas">Notas</TabsTrigger>
                <TabsTrigger value="followup">Retornos</TabsTrigger>
                <TabsTrigger value="historico" onClick={fetchActions}>
                  Histórico
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <TabsContent value="detalhes" className="mt-0 space-y-6">
                {/* Informações de Contato */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Informações de Contato
                    </h3>
                  </div>
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
                              onClick={() => copyToClipboard(lead.email ?? '')}
                              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-background transition-colors"
                            >
                              <Copy className="h-4 w-4 text-muted-foreground hover:text-card-foreground" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Copiar email</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    {/* Telefone */}
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
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Áreas de Interesse */}
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
                            className={`text-xs font-medium px-3 py-1 ${
                              interestColors[key] ||
                              "bg-secondary text-secondary-foreground border-border"
                            }`}
                          >
                            {interestLabels[key] || key}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expectativa de Investimento */}
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                      </div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Expectativa de Investimento
                      </h3>
                    </div>
                    <span className="text-2xl font-bold text-card-foreground">
                      {lead.expectativa_investimento}
                    </span>
                  </div>

                  {/* Loja de Origem — editável para admin */}
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Store className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                          Loja de Origem
                        </h3>
                      </div>
                      {isAdmin && !editingLoja && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setEditingLoja(true)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-card-foreground"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Alterar loja</TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    {editingLoja ? (
                      <div className="space-y-3">
                        <Select
                          value={selectedLojaId}
                          onValueChange={setSelectedLojaId}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione uma loja..." />
                          </SelectTrigger>
                          <SelectContent>
                            {lojas.map((loja) => (
                              <SelectItem key={loja.id} value={String(loja.id)}>
                                {loja.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveLoja}
                            disabled={savingLoja}
                            className="gap-1.5 flex-1"
                          >
                            <Check className="h-3.5 w-3.5" />
                            {savingLoja ? "Salvando..." : "Confirmar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEditLoja}
                            disabled={savingLoja}
                            className="gap-1.5"
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-base font-medium text-card-foreground">
                        {currentLojaNome || "—"}
                      </p>
                    )}
                  </div>

                  {/* Atendente */}
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                          Atendente
                        </h3>
                      </div>
                      {lead.loja_id && !editingResponsavel && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={handleEditResponsavel}
                              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-card-foreground"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Alterar atendente</TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    {editingResponsavel ? (
                      <div className="space-y-3">
                        {loadingUsuarios ? (
                          <div className="flex items-center justify-center py-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                          </div>
                        ) : (
                          <Select
                            value={selectedResponsavelId}
                            onValueChange={setSelectedResponsavelId}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione um atendente..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">— Sem atendente —</SelectItem>
                              {usuarios.map((u) => (
                                <SelectItem key={u.id} value={String(u.id)}>
                                  {u.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveResponsavel}
                            disabled={savingResponsavel || loadingUsuarios}
                            className="gap-1.5 flex-1"
                          >
                            <Check className="h-3.5 w-3.5" />
                            {savingResponsavel ? "Salvando..." : "Confirmar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEditResponsavel}
                            disabled={savingResponsavel}
                            className="gap-1.5"
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-base font-medium text-card-foreground">
                        {currentResponsavelNome || "—"}
                      </p>
                    )}
                  </div>

                  {/* Registro */}
                  <div className="rounded-xl border border-border bg-card p-5 md:col-span-2">
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

                {/* Motivos de Venda Não Realizada */}
                {lead.status === "venda_nao_realizada" && (
                  <div className="rounded-xl border border-red-200 bg-red-50/50 p-5 mt-2">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                        <XCircle className="h-4 w-4 text-red-600" />
                      </div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-red-700">
                        Motivos da Não Realização
                      </h3>
                    </div>

                    {loadingVnr ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500" />
                      </div>
                    ) : !vendaNaoRealizada ? (
                      <p className="text-sm text-muted-foreground italic">
                        Nenhum motivo registrado para este lead.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {/* Chips dos motivos selecionados */}
                        {(() => {
                          const LABELS: Record<string, string> = {
                            motivo_preco:              "Preço acima do orçamento",
                            motivo_concorrencia:       "Perdeu para a concorrência",
                            motivo_prazo_entrega:      "Prazo de entrega muito longo",
                            motivo_pagamento:          "Condições de pagamento inadequadas",
                            motivo_financiamento:      "Cliente não conseguiu financiamento",
                            motivo_obra_pendente:      "Obra / imóvel ainda não finalizado",
                            motivo_indecisao:          "Cliente indeciso / adiou a decisão",
                            motivo_produto_inadequado: "Produto não atendeu a necessidade",
                            motivo_contato_perdido:    "Contato perdido / cliente sumiu",
                            motivo_atendimento:        "Problema no atendimento",
                            motivo_outro:              "Outro motivo",
                          };
                          const ativos = Object.entries(LABELS).filter(
                            ([key]) => vendaNaoRealizada[key as keyof VendaNaoRealizada]
                          );
                          return ativos.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {ativos.map(([key, label]) => (
                                <span
                                  key={key}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800"
                                >
                                  <X className="h-3 w-3" />
                                  {label}
                                </span>
                              ))}
                            </div>
                          ) : null;
                        })()}

                        {/* Observação */}
                        {vendaNaoRealizada.observacao && (
                          <div className="rounded-lg bg-white border border-red-100 p-3">
                            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">
                              Observações do atendente
                            </p>
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                              {vendaNaoRealizada.observacao}
                            </p>
                          </div>
                        )}

                        {/* Rodapé com atendente e data */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-red-100">
                          {vendaNaoRealizada.atendente_nome && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {vendaNaoRealizada.atendente_nome}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(vendaNaoRealizada.created_at).toLocaleString("pt-BR", {
                              day: "2-digit", month: "2-digit", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Mensagem */}
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

              {/* Atendimento — chat WhatsApp */}
              <TabsContent value="atendimento" className="mt-0">
                <ChatPanel
                  leadId={lead.id}
                  telefone={lead.telefone}
                  lojaId={lead.loja_id ? Number(lead.loja_id) : null}
                />
              </TabsContent>

              {/* Notas internas */}
              <TabsContent value="notas" className="mt-0">
                <div className="rounded-xl border border-border bg-card p-5">
                  <NotasLead leadId={String(lead.id)} currentUserId={currentUserId} />
                </div>
              </TabsContent>

              {/* Follow-up */}
              <TabsContent value="followup" className="mt-0">
                <div className="rounded-xl border border-border bg-card p-5">
                  <FollowupLead
                    leadId={String(lead.id)}
                    currentUserId={currentUserId}
                    onFollowupChange={onFollowupUpdate}
                  />
                </div>
              </TabsContent>

              {/* Histórico */}
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
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
                          {action.usuario_nome && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                              <User className="h-3 w-3" />
                              <span>{action.usuario_nome}</span>
                            </div>
                          )}
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
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}