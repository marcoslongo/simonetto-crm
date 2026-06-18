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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
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
  Sparkles,
  Tag,
  ShoppingBag,
  FileText,
  CreditCard,
  Hash,
  Link2,
  Save,
  Loader2,
  Info,
  StickyNote,
  CalendarClock,
  History,
  Paperclip,
} from "lucide-react";
import { Lead, VendaNaoRealizada, VendaRealizada, FormaPagamento, Etiqueta } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { EtiquetasPicker, EtiquetaBadge } from "@/components/leads/etiquetas-picker";
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
import { AiLeadPanel } from "@/components/leads/ai-lead-panel";
import { ArquivosLead } from "@/components/leads/arquivos-lead";
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

const INVESTMENT_OPTIONS = [
  { value: "35-50k",     label: "De R$ 35.000 a R$ 50.000" },
  { value: "50-100k",    label: "De R$ 50.000 a R$ 100.000" },
  { value: "100-150k",   label: "De R$ 100.000 a R$ 150.000" },
  { value: "150-200k",   label: "De R$ 150.000 a R$ 200.000" },
  { value: "acima-250k", label: "Acima de R$ 250.000" },
]

const INTEREST_OPTIONS = [
  { value: "cozinha",    label: "Cozinha" },
  { value: "dormitorio", label: "Dormitório" },
  { value: "closet",     label: "Closet" },
  { value: "banheiro",   label: "Banheiro" },
  { value: "escritorio", label: "Escritório" },
  { value: "lavanderia", label: "Lavanderia" },
  { value: "completo",   label: "Projeto completo" },
]

const ESTADOS_BR = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
]

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
  isGerente?: boolean;
  permitirEdicaoAtendente?: boolean;
  lojas?: LojaOption[];
  currentUserId?: number;
  onFollowupUpdate?: (next: { em: string; descricao?: string | null } | null) => void;
  onLeadRemoved?: () => void;
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
  isGerente,
  permitirEdicaoAtendente,
  lojas = [],
  currentUserId,
  onFollowupUpdate,
  onLeadRemoved,
}: LeadDialogProps) {
  const router = useRouter();
  const canEdit = isAdmin || isGerente || permitirEdicaoAtendente;

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

  const [editingDados, setEditingDados] = useState(false);
  const [editForm, setEditForm] = useState({
    nome: lead.nome,
    telefone: lead.telefone,
    email: lead.email ?? "",
    cidade: lead.cidade ?? "",
    estado: lead.estado ?? "",
    interesses: (lead.interesse ?? "").split(",").map(s => s.trim()).filter(Boolean),
    expectativa_investimento: lead.expectativa_investimento ?? "",
  });
  const [savingDados, setSavingDados] = useState(false);
  const [localNome, setLocalNome] = useState(lead.nome);

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

  const [vendaRealizada, setVendaRealizada] = useState<VendaRealizada | null>(null);
  const [loadingVr, setLoadingVr] = useState(false);
  const [editingVenda, setEditingVenda] = useState(false);
  const [vendaForm, setVendaForm] = useState<Partial<VendaRealizada>>({});
  const [deletingVenda, setDeletingVenda] = useState(false);
  const [savingVenda, setSavingVenda] = useState(false);

  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>(lead.etiquetas ?? []);

  useEffect(() => {
    setSelectedLojaId(lead.loja_id ?? "");
    setCurrentLojaNome(lead.loja_nome ?? "");
    setEditingLoja(false);
    setSelectedResponsavelId(lead.responsavel_id ? String(lead.responsavel_id) : "none");
    setCurrentResponsavelNome(lead.responsavel_nome ?? "");
    setEditingResponsavel(false);
    setUsuarios([]);
    setVendaNaoRealizada(null);
    setVendaRealizada(null);
    setEditingVenda(false);
    setVendaForm({});
    setEtiquetas(lead.etiquetas ?? []);
    setEditingDados(false);
    setLocalNome(lead.nome);
    setEditForm({
      nome: lead.nome,
      telefone: lead.telefone,
      email: lead.email ?? "",
      cidade: lead.cidade ?? "",
      estado: lead.estado ?? "",
      interesses: (lead.interesse ?? "").split(",").map(s => s.trim()).filter(Boolean),
      expectativa_investimento: lead.expectativa_investimento ?? "",
    });
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

  useEffect(() => {
    if (lead.status !== "venda_realizada" || !open) return;
    setLoadingVr(true);
    fetch(`/api/leads/${lead.id}/venda-realizada`)
      .then(r => r.json())
      .then(d => {
        const data = d.data ?? null;
        setVendaRealizada(data);
        if (data) setVendaForm(data);
      })
      .catch(() => {})
      .finally(() => setLoadingVr(false));
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

  const handleSaveDados = async () => {
    if (!editForm.nome.trim() || !editForm.telefone.trim()) {
      toast.error("Nome e telefone são obrigatórios.");
      return;
    }
    setSavingDados(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dados: {
            nome: editForm.nome.trim(),
            telefone: editForm.telefone.trim(),
            email: editForm.email.trim(),
            cidade: editForm.cidade.trim(),
            estado: editForm.estado,
            interesse: editForm.interesses.join(", "),
            expectativa_investimento: editForm.expectativa_investimento,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.mensagem || "Erro ao salvar dados.");
        return;
      }
      setLocalNome(editForm.nome.trim());
      setEditingDados(false);
      toast.success("Dados atualizados com sucesso.");
      router.refresh();
    } catch {
      toast.error("Erro ao salvar dados.");
    } finally {
      setSavingDados(false);
    }
  };

  const handleDeleteVenda = async () => {
    setDeletingVenda(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/venda-realizada`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Erro ao excluir registro de venda.");
        return;
      }
      setVendaRealizada(null);
      setVendaForm({});
      setEditingVenda(false);
      toast.success("Registro de venda excluído.");
    } catch {
      toast.error("Erro ao excluir registro de venda.");
    } finally {
      setDeletingVenda(false);
    }
  };

  const handleSaveVenda = async () => {
    setSavingVenda(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, lead_id: _lid, created_at: _ca, updated_at: _ua, atendente_id: _ai, atendente_nome: _an, ...payload } = vendaForm as VendaRealizada;
      const res = await fetch(`/api/leads/${lead.id}/venda-realizada`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        toast.error("Erro ao salvar dados da venda.");
        return;
      }
      const data = await res.json();
      setVendaRealizada(data.data ?? vendaForm as VendaRealizada);
      setEditingVenda(false);
      toast.success("Dados da venda salvos com sucesso.");
    } catch {
      toast.error("Erro ao salvar dados da venda.");
    } finally {
      setSavingVenda(false);
    }
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
        <DialogContent className={[
          "flex flex-col overflow-hidden p-0 gap-0",
          // Mobile: tela cheia
          "max-sm:inset-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:top-0 max-sm:left-0 max-sm:w-screen max-sm:max-w-none max-sm:h-dvh max-sm:rounded-none",
          // Desktop
          "sm:h-[90vh] sm:w-[90vw] sm:max-w-[90vw]",
        ].join(" ")}>

          {/* ── Header ───────────────────────────────────────────────────── */}
          <div className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-0">
            <DialogHeader className="border-b border-border pb-3 sm:pb-4">
              <div className="flex items-start justify-between flex-col gap-3">
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-lg sm:text-2xl font-semibold text-card-foreground truncate">
                    {localNome}
                  </DialogTitle>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs sm:text-sm text-muted-foreground">
                    {(lead.cidade || lead.estado) && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{lead.cidade}{lead.estado ? `, ${lead.estado}` : ''}</span>
                      </div>
                    )}
                    <div className="hidden sm:flex items-center gap-1.5">
                      <Separator orientation="vertical" className="h-3.5" />
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>Criado em {formatDate(lead.data_criacao)}</span>
                    </div>
                  </div>
                </div>

                {/* Mobile quick-actions: WhatsApp + Call */}
                <div className="flex items-center gap-2 shrink-0 sm:hidden">
                  <Link
                    href={`https://wa.me/55${cleanPhone}`}
                    target="_blank"
                    onClick={() => registrarContato("whatsapp")}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 active:bg-emerald-500/20 transition-colors"
                    aria-label="WhatsApp"
                  >
                    <FaWhatsapp className="h-5 w-5" />
                  </Link>
                  <Link
                    href={`tel:${cleanPhone}`}
                    onClick={() => registrarContato("telefone")}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 active:bg-blue-500/20 transition-colors"
                    aria-label="Ligar"
                  >
                    <Phone className="h-4.5 w-4.5" />
                  </Link>
                </div>
              </div>

              {(canEdit || (isAdmin || isGerente)) && (
                <div className="flex items-center gap-2 mt-3">
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 cursor-pointer"
                      onClick={() => setEditingDados(true)}
                    >
                      <Pencil size={14} />
                      Editar dados
                    </Button>
                  )}
                  {(isAdmin || isGerente) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-2 cursor-pointer">
                          <Trash2 size={14} />
                          Excluir lead
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
              )}
            </DialogHeader>
          </div>

          <Tabs defaultValue="detalhes" className="flex flex-col flex-1 overflow-hidden min-h-0">
            {/* Tabs — scroll horizontal no mobile */}
            <div className="shrink-0 border-b border-border">
              <div className="overflow-x-auto no-scrollbar px-4 sm:px-6">
                <TabsList className="w-max min-w-full justify-start rounded-none bg-transparent p-0 h-auto gap-0">
                  <TabsTrigger value="detalhes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5 text-sm gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    Detalhes
                  </TabsTrigger>
                  {lead.mensagem && (
                    <TabsTrigger value="mensagem" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5 text-sm gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Mensagem
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="atendimento" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5 text-sm gap-1.5">
                    <FaWhatsapp className="h-3.5 w-3.5" />
                    Atendimento
                  </TabsTrigger>
                  <TabsTrigger value="notas" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5 text-sm gap-1.5">
                    <StickyNote className="h-3.5 w-3.5" />
                    Notas
                  </TabsTrigger>
                  <TabsTrigger value="followup" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5 text-sm gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Retornos
                  </TabsTrigger>
                  <TabsTrigger value="historico" onClick={fetchActions} className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5 text-sm gap-1.5">
                    <History className="h-3.5 w-3.5" />
                    Histórico
                  </TabsTrigger>
                  <TabsTrigger value="arquivos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5 text-sm gap-1.5">
                    <Paperclip className="h-3.5 w-3.5" />
                    Arquivos
                  </TabsTrigger>
                  <TabsTrigger value="ia" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5 text-sm gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    IA
                  </TabsTrigger>
                  {lead.status === "venda_realizada" && (
                    <TabsTrigger value="venda" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5 text-sm gap-1.5 data-[state=active]:text-emerald-700">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      Venda
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
              <TabsContent value="detalhes" className="mt-0 space-y-6">
                {/* Informações de Contato */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm font-semibold">
                      Informações de Contato
                    </p>
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
                      <p className="text-sm font-semibold">
                        Áreas de Interesse
                      </p>
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
                      <p className="text-sm font-semibold">
                        Expectativa de Investimento
                      </p>
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
                        <p className="text-sm font-semibold">
                          Loja de Origem
                        </p>
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
                        <p className="text-sm font-semibold">
                          Atendente
                        </p>
                      </div>
                      {lead.loja_id && canEdit && !editingResponsavel && (
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

                  {/* Etiquetas */}
                  <div className="rounded-xl border border-border bg-card p-5 md:col-span-2">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Tag className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-sm font-semibold flex-1">
                        Etiquetas
                      </p>
                      {lead.loja_id && (
                        <EtiquetasPicker
                          leadId={lead.id}
                          lojaId={lead.loja_id}
                          etiquetas={etiquetas}
                          isGerente={isGerente || isAdmin}
                          onUpdate={setEtiquetas}
                        />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-6">
                      {etiquetas.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Nenhuma etiqueta atribuída.</p>
                      ) : (
                        etiquetas.map(e => (
                          <EtiquetaBadge key={e.id} etiqueta={e} />
                        ))
                      )}
                    </div>
                  </div>

                  {/* Registro */}
                  <div className="rounded-xl border border-border bg-card p-5 md:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-sm font-semibold">
                        Registro
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70 font-medium">Criado em</p>
                          <p className="text-sm text-foreground">{formatDate(lead.data_criacao)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70 font-medium">Atualizado em</p>
                          <p className="text-sm text-foreground">{formatDate(lead.data_atualizacao)}</p>
                        </div>
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
                      <p className="text-sm font-semibold text-red-700">
                        Motivos da Não Realização
                      </p>
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
                      <p className="text-sm font-semibold">
                        Mensagem do Lead
                      </p>
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
                  avatarUrl={lead.avatar_url}
                  leadNome={lead.nome}
                  onBlock={async () => {
                    const [blRes, delRes] = await Promise.all([
                      fetch('/api/usuarios/me/whatsapp-blocklist', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone: lead.telefone, nome: lead.nome }),
                      }),
                      fetch(`/api/leads/${lead.id}`, { method: 'DELETE' }),
                    ])
                    const blData = await blRes.json()
                    if (blData.success && delRes.ok) {
                      toast.success('Contato bloqueado e lead removido.')
                      onOpenChange(false)
                      onLeadRemoved?.()
                    } else {
                      toast.error('Erro ao bloquear contato.')
                    }
                  }}
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

              {/* Arquivos */}
              <TabsContent value="arquivos" className="mt-0">
                <ArquivosLead
                  leadId={lead.id}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                />
              </TabsContent>

              {/* Assistente de IA */}
              <TabsContent value="ia" className="mt-0">
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm font-semibold">
                      Assistente de IA
                    </p>
                  </div>
                  <AiLeadPanel lead={lead} />
                </div>
              </TabsContent>

              {/* Venda Realizada */}
              {lead.status === "venda_realizada" && (
                <TabsContent value="venda" className="mt-0">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                          <ShoppingBag className="h-4 w-4 text-emerald-600" />
                        </div>
                        <p className="text-sm font-semibold">
                          Dados da Venda
                        </p>
                      </div>
                      {!editingVenda && (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => {
                            setVendaForm(vendaRealizada ?? {});
                            setEditingVenda(true);
                          }}>
                            <Pencil className="h-3.5 w-3.5 mr-1.5" />
                            Editar
                          </Button>
                          {vendaRealizada && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" disabled={deletingVenda}>
                                  {deletingVenda ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir registro de venda?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Os dados da venda serão removidos permanentemente. O lead continuará na coluna "Venda Realizada".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeleteVenda} className="bg-destructive hover:bg-destructive/90">
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      )}
                    </div>

                    {loadingVr ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                      </div>
                    ) : editingVenda ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="vd-valor" className="text-xs">Valor da venda (R$)</Label>
                            <Input
                              id="vd-valor"
                              placeholder="0,00"
                              value={vendaForm.valor != null ? String(vendaForm.valor) : ""}
                              onChange={e => setVendaForm(f => ({ ...f, valor: e.target.value ? Number(e.target.value) : null }))}
                              type="number"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="vd-data" className="text-xs">Data da venda</Label>
                            <Input
                              id="vd-data"
                              type="date"
                              value={vendaForm.data_venda ?? ""}
                              onChange={e => setVendaForm(f => ({ ...f, data_venda: e.target.value || null }))}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Forma de pagamento</Label>
                          <div className="flex flex-wrap gap-2">
                            {([
                              { value: "dinheiro",       label: "Dinheiro" },
                              { value: "cartao_credito", label: "Cartão de Crédito" },
                              { value: "cartao_debito",  label: "Cartão de Débito" },
                              { value: "pix",            label: "Pix" },
                              { value: "boleto",         label: "Boleto Bancário" },
                              { value: "financiamento",  label: "Financiamento" },
                              { value: "cheque",         label: "Cheque" },
                              { value: "outro",          label: "Outro" },
                            ] as { value: FormaPagamento; label: string }[]).map(f => {
                              const selected = vendaForm.forma_pagamento?.split(',').includes(f.value) ?? false
                              return (
                                <button
                                  key={f.value}
                                  type="button"
                                  onClick={() => setVendaForm(prev => {
                                    const current = prev.forma_pagamento ? prev.forma_pagamento.split(',') : []
                                    const updated = selected ? current.filter(v => v !== f.value) : [...current, f.value]
                                    return { ...prev, forma_pagamento: updated.length > 0 ? updated.join(',') : null }
                                  })}
                                  className={cn(
                                    "px-3 py-1.5 rounded-full text-xs border transition-colors",
                                    selected
                                      ? "bg-emerald-600 text-white border-emerald-600"
                                      : "bg-white text-foreground border-border hover:border-emerald-400"
                                  )}
                                >
                                  {f.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="vd-pedido" className="text-xs">Número do pedido</Label>
                          <Input
                            id="vd-pedido"
                            placeholder="Ex.: 001234"
                            value={vendaForm.numero_pedido ?? ""}
                            onChange={e => setVendaForm(f => ({ ...f, numero_pedido: e.target.value || null }))}
                          />
                        </div>
                        <div className="rounded-lg border border-border p-4 space-y-3 bg-white">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nota Fiscal</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="vd-nf-num" className="text-xs">Número NF</Label>
                              <Input id="vd-nf-num" placeholder="000000" value={vendaForm.numero_nf ?? ""} onChange={e => setVendaForm(f => ({ ...f, numero_nf: e.target.value || null }))} />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="vd-nf-serie" className="text-xs">Série</Label>
                              <Input id="vd-nf-serie" placeholder="001" value={vendaForm.serie_nf ?? ""} onChange={e => setVendaForm(f => ({ ...f, serie_nf: e.target.value || null }))} />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="vd-nf-chave" className="text-xs">Chave de acesso</Label>
                            <Input id="vd-nf-chave" placeholder="44 dígitos" maxLength={44} value={vendaForm.chave_acesso_nf ?? ""} onChange={e => setVendaForm(f => ({ ...f, chave_acesso_nf: e.target.value || null }))} />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="vd-nf-link" className="text-xs">Link / arquivo NF</Label>
                            <Input id="vd-nf-link" placeholder="https://..." value={vendaForm.link_nf ?? ""} onChange={e => setVendaForm(f => ({ ...f, link_nf: e.target.value || null }))} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="vd-obs" className="text-xs">Observações</Label>
                          <Textarea
                            id="vd-obs"
                            placeholder="Informações adicionais..."
                            value={vendaForm.observacoes ?? ""}
                            onChange={e => setVendaForm(f => ({ ...f, observacoes: e.target.value || null }))}
                            rows={3}
                            className="resize-none"
                          />
                        </div>
                        <div className="flex items-center gap-3 pt-1">
                          <Button onClick={handleSaveVenda} disabled={savingVenda} className="bg-emerald-600 hover:bg-emerald-700">
                            {savingVenda ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
                            Salvar dados
                          </Button>
                          <Button variant="ghost" onClick={() => setEditingVenda(false)} disabled={savingVenda}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : !vendaRealizada || (!vendaRealizada.valor && !vendaRealizada.data_venda && !vendaRealizada.forma_pagamento && !vendaRealizada.numero_pedido && !vendaRealizada.numero_nf && !vendaRealizada.observacoes) ? (
                      <div className="py-6 text-center">
                        <ShoppingBag className="h-10 w-10 mx-auto text-emerald-200 mb-3" />
                        <p className="text-sm text-muted-foreground">Nenhuma informação de venda registrada.</p>
                        <Button size="sm" variant="outline" className="mt-4" onClick={() => { setVendaForm({}); setEditingVenda(true); }}>
                          <Pencil className="h-3.5 w-3.5 mr-1.5" />
                          Registrar agora
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {vendaRealizada.valor != null && (
                          <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-white px-4 py-3">
                            <DollarSign className="h-4 w-4 text-emerald-600 shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">Valor da venda</p>
                              <p className="text-sm font-semibold text-emerald-700">
                                {vendaRealizada.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          {vendaRealizada.data_venda && (
                            <div className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3">
                              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">Data da venda</p>
                                <p className="text-sm font-medium">
                                  {new Date(vendaRealizada.data_venda + "T00:00:00").toLocaleDateString("pt-BR")}
                                </p>
                              </div>
                            </div>
                          )}
                          {vendaRealizada.forma_pagamento && (
                            <div className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3">
                              <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">Forma de pagamento</p>
                                <p className="text-sm font-medium">
                                  {vendaRealizada.forma_pagamento.split(',').map(v => ({
                                    dinheiro: "Dinheiro", cartao_credito: "Cartão de Crédito",
                                    cartao_debito: "Cartão de Débito", pix: "Pix",
                                    boleto: "Boleto", financiamento: "Financiamento",
                                    cheque: "Cheque", outro: "Outro",
                                  } as Record<string, string>)[v] ?? v).join(' + ')}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        {vendaRealizada.numero_pedido && (
                          <div className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3">
                            <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">Número do pedido</p>
                              <p className="text-sm font-medium">{vendaRealizada.numero_pedido}</p>
                            </div>
                          </div>
                        )}
                        {(vendaRealizada.numero_nf || vendaRealizada.serie_nf || vendaRealizada.chave_acesso_nf || vendaRealizada.link_nf) && (
                          <div className="rounded-lg border bg-white px-4 py-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nota Fiscal</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {vendaRealizada.numero_nf && <div><span className="text-xs text-muted-foreground">Número: </span>{vendaRealizada.numero_nf}</div>}
                              {vendaRealizada.serie_nf && <div><span className="text-xs text-muted-foreground">Série: </span>{vendaRealizada.serie_nf}</div>}
                            </div>
                            {vendaRealizada.chave_acesso_nf && (
                              <div className="text-xs break-all text-muted-foreground">
                                <span className="font-medium">Chave: </span>{vendaRealizada.chave_acesso_nf}
                              </div>
                            )}
                            {vendaRealizada.link_nf && (
                              <a href={vendaRealizada.link_nf} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                                <Link2 className="h-3 w-3" />
                                Abrir nota fiscal
                              </a>
                            )}
                          </div>
                        )}
                        {vendaRealizada.observacoes && (
                          <div className="rounded-lg border bg-white px-4 py-3">
                            <p className="text-xs text-muted-foreground mb-1">Observações</p>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{vendaRealizada.observacoes}</p>
                          </div>
                        )}
                        {vendaRealizada.updated_at && (
                          <p className="text-[11px] text-muted-foreground text-right">
                            Atualizado em {new Date(vendaRealizada.updated_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}

              {/* Histórico */}
              <TabsContent value="historico" className="mt-0 space-y-4">
                {loadingActions && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                )}
                {!loadingActions && actions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma ação registrada ainda.
                  </p>
                )}
                {!loadingActions && actions.length > 0 && (
                  <div className="space-y-3">
                    {actions.map((action, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-2 w-2 rounded-full mt-1.5 shrink-0 bg-blue-400" />
                          <div className="w-px flex-1 bg-border mt-1" />
                        </div>
                        <div className="pb-3 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs font-medium px-2 py-0.5">
                              {action.tipo_contato}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground/60">
                              {formatDate(action.criado_em)}
                            </span>
                          </div>
                          {action.usuario_nome && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              <User className="h-3 w-3 inline mr-1" />{action.usuario_nome}
                            </p>
                          )}
                          {action.observacao && (
                            <p className="text-sm text-foreground mt-1 bg-muted/40 rounded-lg px-3 py-2">
                              {action.observacao}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Dialog de edição de dados do lead */}
      <Dialog open={editingDados} onOpenChange={(v) => { if (!savingDados) setEditingDados(v); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar dados do lead</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="edit-nome">Nome *</Label>
                <Input
                  id="edit-nome"
                  value={editForm.nome}
                  onChange={e => setEditForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Nome completo"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="edit-telefone">Telefone *</Label>
                <Input
                  id="edit-telefone"
                  value={editForm.telefone}
                  onChange={e => setEditForm(f => ({ ...f, telefone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="edit-email">E-mail</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-cidade">Cidade</Label>
                <Input
                  id="edit-cidade"
                  value={editForm.cidade}
                  onChange={e => setEditForm(f => ({ ...f, cidade: e.target.value }))}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select
                  value={editForm.estado}
                  onValueChange={v => setEditForm(f => ({ ...f, estado: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BR.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Interesse</Label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map(({ value, label }) => {
                  const selected = editForm.interesses.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setEditForm(f => ({
                        ...f,
                        interesses: selected
                          ? f.interesses.filter(i => i !== value)
                          : [...f.interesses, value],
                      }))}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        selected
                          ? "border-[#16255c] bg-[#16255c] text-white"
                          : "border-border bg-background text-muted-foreground hover:border-[#16255c] hover:text-[#16255c]"
                      )}
                    >
                      {selected && <Check className="h-3 w-3" />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Expectativa de Investimento</Label>
              <Select
                value={editForm.expectativa_investimento}
                onValueChange={v => setEditForm(f => ({ ...f, expectativa_investimento: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma faixa" />
                </SelectTrigger>
                <SelectContent>
                  {INVESTMENT_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingDados(false)}
              disabled={savingDados}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveDados}
              disabled={savingDados}
              className="gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              {savingDados ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}