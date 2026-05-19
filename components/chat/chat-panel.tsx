"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FaWhatsapp } from "react-icons/fa";
import { Send, AlertCircle, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Mensagem {
  id: number;
  lead_id: number;
  conteudo: string;
  direcao: "enviada" | "recebida";
  status: "enviada" | "entregue" | "lida" | "erro";
  wamid: string | null;
  criado_em: string;
  metadata?: { contact_name?: string } | null;
}

interface ChatPanelProps {
  leadId: string;
  telefone: string;
  lojaId?: number | null;
}

export function ChatPanel({ leadId, telefone, lojaId }: ChatPanelProps) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const buscarMensagens = useCallback(async () => {
    try {
      const res = await fetch(`/api/mensagens/${leadId}`);
      if (!res.ok) return;
      const data = await res.json();
      setMensagens(data.mensagens ?? []);
    } catch {
      // silencioso — polling não precisa mostrar erro
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    buscarMensagens();
    const interval = setInterval(buscarMensagens, 5000);
    return () => clearInterval(interval);
  }, [buscarMensagens]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  const enviarMensagem = async () => {
    const conteudo = texto.trim();
    if (!conteudo || enviando) return;

    setEnviando(true);
    const textoOriginal = texto;
    setTexto("");

    try {
      const res = await fetch(`/api/mensagens/${leadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conteudo, telefone, loja_id: lojaId }),
      });

      if (!res.ok) {
        setTexto(textoOriginal);
        toast.error("Erro ao enviar mensagem");
        return;
      }

      await buscarMensagens();
      textareaRef.current?.focus();
    } catch {
      setTexto(textoOriginal);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header do canal */}
      <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <FaWhatsapp className="h-5 w-5 text-emerald-500" />
        <span className="text-sm font-semibold text-emerald-600">WhatsApp</span>
        <span className="text-xs text-muted-foreground ml-auto font-mono">
          {telefone}
        </span>
      </div>

      {/* Lista de mensagens */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px] max-h-[320px] px-1">
        {mensagens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center">
            <FaWhatsapp className="h-12 w-12 text-emerald-500/20 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Inicie o atendimento enviando uma mensagem.
            </p>
          </div>
        ) : (
          mensagens.map((msg) => <MessageBubble key={msg.id} mensagem={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input de envio */}
      <div className="mt-4 space-y-1.5">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            className="resize-none min-h-[60px] max-h-[120px] text-sm"
            rows={2}
            disabled={enviando}
          />
          <Button
            onClick={enviarMensagem}
            disabled={enviando || !texto.trim()}
            size="icon"
            className="h-10 w-10 shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground pl-1">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ mensagem }: { mensagem: Mensagem }) {
  const isEnviada = mensagem.direcao === "enviada";
  const hora = format(new Date(mensagem.criado_em), "HH:mm", { locale: ptBR });

  return (
    <div className={`flex ${isEnviada ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-sm shadow-sm ${
          isEnviada
            ? "bg-emerald-500 text-white rounded-br-sm"
            : "bg-muted text-card-foreground rounded-bl-sm border border-border"
        }`}
      >
        {!isEnviada && mensagem.metadata?.contact_name && (
          <p className="text-xs font-semibold mb-1 text-emerald-600">
            {mensagem.metadata.contact_name}
          </p>
        )}
        <p className="leading-relaxed whitespace-pre-wrap break-words">
          {mensagem.conteudo}
        </p>
        <div
          className={`flex items-center gap-1 mt-1 text-[11px] ${
            isEnviada ? "text-white/70 justify-end" : "text-muted-foreground"
          }`}
        >
          <span>{hora}</span>
          {isEnviada && <StatusIcon status={mensagem.status} />}
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: Mensagem["status"] }) {
  if (status === "erro") {
    return <AlertCircle className="h-3 w-3 text-red-300" />;
  }
  if (status === "lida") {
    return <CheckCheck className="h-3 w-3 text-blue-200" />;
  }
  if (status === "entregue") {
    return <CheckCheck className="h-3 w-3 text-white/70" />;
  }
  return <Check className="h-3 w-3 text-white/70" />;
}
