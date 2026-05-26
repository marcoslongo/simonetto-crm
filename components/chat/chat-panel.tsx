"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FaWhatsapp } from "react-icons/fa";
import { Send, AlertCircle, Check, CheckCheck, Paperclip, FileText, X, Loader2, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type MediaType = "audio" | "image" | "document" | "video" | "sticker";

interface MensagemMetadata {
  contact_name?: string;
  media_type?: MediaType;
  media_url?: string;
  mimetype?: string;
}

interface Mensagem {
  id: number;
  lead_id: number;
  conteudo: string;
  direcao: "enviada" | "recebida";
  status: "enviada" | "entregue" | "lida" | "erro" | "recebida";
  wamid: string | null;
  criado_em: string;
  metadata?: MensagemMetadata | null;
}

interface PendingFile {
  file: File;
  preview?: string; // object URL para imagens
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
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [uploadando, setUploadando] = useState(false);
  const [wpConfigured, setWpConfigured] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/usuarios/me/whatsapp')
      .then(r => r.json())
      .then(d => setWpConfigured(d.configured === true))
      .catch(() => setWpConfigured(true))
  }, [])

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 16 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 16 MB).");
      return;
    }

    const preview = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : undefined;

    setPendingFile({ file, preview });
    e.target.value = "";
  };

  const cancelarAnexo = () => {
    if (pendingFile?.preview) URL.revokeObjectURL(pendingFile.preview);
    setPendingFile(null);
  };

  const enviarMensagem = async () => {
    const conteudo = texto.trim();
    if ((!conteudo && !pendingFile) || enviando) return;

    setEnviando(true);
    const textoOriginal = texto;
    setTexto("");

    try {
      let mediaUrl: string | null = null;
      let mediaType: string | null = null;
      let mimetype: string | null = null;
      let filename: string | null = null;

      // Upload do arquivo se houver
      if (pendingFile) {
        setUploadando(true);
        const fd = new FormData();
        fd.append("file", pendingFile.file);

        const upRes = await fetch("/api/mensagens/upload", { method: "POST", body: fd });
        const upData = await upRes.json();
        setUploadando(false);

        if (!upRes.ok || !upData.success) {
          toast.error(upData.mensagem ?? "Erro ao enviar arquivo.");
          setTexto(textoOriginal);
          return;
        }

        mediaUrl  = upData.url;
        mimetype  = upData.mimetype;
        filename  = upData.filename;

        // Determina o tipo para a Evolution Go
        if (mimetype?.startsWith("image/"))      mediaType = "image";
        else if (mimetype?.startsWith("video/")) mediaType = "video";
        else if (mimetype?.startsWith("audio/")) mediaType = "audio";
        else                                      mediaType = "document";

        if (pendingFile.preview) URL.revokeObjectURL(pendingFile.preview);
        setPendingFile(null);
      }

      const payload: Record<string, unknown> = {
        conteudo: conteudo || (mediaType === "image" ? "[Imagem]" : mediaType === "audio" ? "[Áudio]" : filename ?? "[Arquivo]"),
        telefone,
        loja_id: lojaId,
      };

      if (mediaUrl) {
        payload.media_url  = mediaUrl;
        payload.media_type = mediaType;
        payload.caption    = conteudo;
        payload.filename   = filename;
        payload.mimetype   = mimetype;
      }

      const res = await fetch(`/api/mensagens/${leadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setTexto(textoOriginal);
        toast.error("Erro ao enviar mensagem");
        return;
      }

      // Registra evento no histórico do lead (fire-and-forget)
      const obsMap: Record<string, string> = {
        audio: "Áudio enviado via WhatsApp",
        image: "Imagem enviada via WhatsApp",
        video: "Vídeo enviado via WhatsApp",
        document: "Documento enviado via WhatsApp",
      };
      const observacao = mediaType ? (obsMap[mediaType] ?? "Arquivo enviado via WhatsApp") : "Mensagem enviada via WhatsApp";
      fetch("/api/lead-contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: Number(leadId), loja_id: lojaId, tipo_contato: "whatsapp", observacao }),
      }).catch(() => {});

      await buscarMensagens();
      textareaRef.current?.focus();
    } catch {
      setTexto(textoOriginal);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setEnviando(false);
      setUploadando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  if (wpConfigured === null || loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!wpConfigured) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center gap-3">
        <FaWhatsapp className="h-12 w-12 text-emerald-500/30" />
        <p className="text-sm font-medium">WhatsApp não configurado</p>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
          Para enviar e receber mensagens, configure sua instância do WhatsApp nas configurações da conta.
        </p>
        <a
          href="/configuracoes"
          className="text-xs text-primary underline underline-offset-2 hover:opacity-80"
        >
          Ir para Configurações
        </a>
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

      {/* Preview do arquivo selecionado */}
      {pendingFile && (
        <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-slate-100 border text-sm">
          {pendingFile.preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pendingFile.preview} alt="" className="h-10 w-10 object-cover rounded" />
          ) : (
            <FileText className="h-8 w-8 text-slate-400 shrink-0" />
          )}
          <span className="flex-1 truncate text-xs text-slate-600">{pendingFile.file.name}</span>
          <button onClick={cancelarAnexo} className="text-slate-400 hover:text-red-500">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input de envio */}
      <div className="mt-4 space-y-1.5">
        <div className="flex gap-2 items-end">
          {/* Input oculto de arquivo */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
            onChange={handleFileSelect}
          />

          {/* Botão de anexo */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={enviando}
            title="Anexar arquivo"
          >
            <Paperclip className="h-4 w-4 text-slate-500" />
          </Button>

          <Textarea
            ref={textareaRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={pendingFile ? "Legenda (opcional)..." : "Digite sua mensagem..."}
            className="resize-none min-h-[60px] max-h-[120px] text-sm"
            rows={2}
            disabled={enviando}
          />

          <Button
            onClick={enviarMensagem}
            disabled={enviando || (!texto.trim() && !pendingFile)}
            size="icon"
            className="h-10 w-10 shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {uploadando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground pl-1">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
}

function AudioPlayer({ src, isEnviada }: { src: string; isEnviada: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    playing ? a.pause() : a.play();
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Number(e.target.value);
  };

  const fmt = (s: number) => {
    if (!isFinite(s) || s === 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const sent = isEnviada;

  return (
    <div className="flex items-center gap-2.5 w-60 py-1">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={() => { setDuration(audioRef.current?.duration ?? 0); setReady(true); }}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrentTime(0); }}
      />

      {/* Botão play/pause */}
      <button
        onClick={toggle}
        disabled={!ready}
        className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          sent
            ? "bg-white/25 hover:bg-white/35 text-white"
            : "bg-emerald-500 hover:bg-emerald-600 text-white"
        } disabled:opacity-40`}
      >
        {!ready ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : playing ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" />
        )}
      </button>

      {/* Barra de progresso + tempo */}
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.05}
          value={currentTime}
          onChange={seek}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: sent
              ? `linear-gradient(to right, rgba(255,255,255,0.9) ${progress}%, rgba(255,255,255,0.3) ${progress}%)`
              : `linear-gradient(to right, #10b981 ${progress}%, #d1d5db ${progress}%)`,
          }}
        />
        <div className={`flex justify-between text-[10px] tabular-nums ${sent ? "text-white/70" : "text-muted-foreground"}`}>
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ mensagem }: { mensagem: Mensagem }) {
  const isEnviada = mensagem.direcao === "enviada";
  const hora = format(new Date(mensagem.criado_em), "HH:mm", { locale: ptBR });
  const mediaType = mensagem.metadata?.media_type;
  const mediaUrl  = mensagem.metadata?.media_url;

  const isSticker = mediaType === "sticker";

  return (
    <div className={`flex ${isEnviada ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] text-sm ${
          isSticker
            ? "p-0"
            : `px-3.5 py-2 rounded-2xl shadow-sm ${
                isEnviada
                  ? "bg-emerald-500 text-white rounded-br-sm"
                  : "bg-muted text-card-foreground rounded-bl-sm border border-border"
              }`
        }`}
      >
        {!isEnviada && mensagem.metadata?.contact_name && (
          <p className="text-xs font-semibold mb-1 text-emerald-600">
            {mensagem.metadata.contact_name}
          </p>
        )}

        {/* Renderização por tipo de mídia */}
        {mediaUrl && mediaType === "audio" && (
          <AudioPlayer src={mediaUrl} isEnviada={isEnviada} />
        )}

        {mediaUrl && mediaType === "image" && (
          <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl}
              alt="Imagem"
              className="rounded-lg max-w-[220px] max-h-[220px] object-cover mb-1 cursor-pointer"
            />
          </a>
        )}

        {mediaUrl && mediaType === "video" && (
          <video controls src={mediaUrl} className="w-full max-w-[240px] rounded-lg mb-1" />
        )}

        {mediaUrl && mediaType === "sticker" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl}
            alt="Figurinha"
            className="w-32 h-32 object-contain"
          />
        )}

        {mediaUrl && mediaType === "document" && (
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 mb-1 underline text-xs ${isEnviada ? "text-white/90" : "text-blue-600"}`}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">{mensagem.conteudo !== "[Documento]" ? mensagem.conteudo : "Baixar documento"}</span>
          </a>
        )}

        {/* Texto / legenda (não mostra se é só um label de mídia) */}
        {(!mediaType || !["[Áudio]", "[Imagem]", "[Documento]", "[Vídeo]", "[Figurinha]", "[Mídia]"].includes(mensagem.conteudo)) && (
          <p className="leading-relaxed whitespace-pre-wrap break-words">
            {mensagem.conteudo}
          </p>
        )}

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
