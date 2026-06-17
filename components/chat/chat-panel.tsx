"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import data from "@emoji-mart/data";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FaWhatsapp } from "react-icons/fa";
import { Send, AlertCircle, Check, CheckCheck, Paperclip, FileText, X, Loader2, Play, Pause, Mic, Square, Camera, Smile, Sticker, LockKeyhole, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const EmojiPicker = dynamic(() => import("@emoji-mart/react"), { ssr: false });

type MediaType = "audio" | "image" | "document" | "video" | "sticker";

interface MensagemMetadata {
  contact_name?: string;
  media_type?: MediaType;
  media_url?: string;
  mimetype?: string;
  aviso?: string;
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
  preview?: string;
  isSticker?: boolean;
}

interface ChatPanelProps {
  leadId: string;
  telefone: string;
  lojaId?: number | null;
  avatarUrl?: string | null;
  leadNome?: string;
  onBlock?: () => Promise<void>;
}

function DateSeparator({ date }: { date: Date }) {
  const label = isToday(date)
    ? "Hoje"
    : isYesterday(date)
    ? "Ontem"
    : format(date, "d 'de' MMMM", { locale: ptBR });

  return (
    <div className="flex items-center justify-center my-2 pointer-events-none">
      <span className="px-3 py-0.5 rounded-full text-[11px] font-medium bg-[#e1f2fa] dark:bg-[#182229] text-[#54656f] dark:text-[#8696a0] shadow-sm select-none">
        {label}
      </span>
    </div>
  );
}

export function ChatPanel({ leadId, telefone, lojaId, avatarUrl, leadNome, onBlock }: ChatPanelProps) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [uploadando, setUploadando] = useState(false);
  const [wpState, setWpState] = useState<string | null>(null);
  const [gravando, setGravando] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [pendingAudio, setPendingAudio] = useState<{ blob: Blob; url: string } | null>(null);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isStickerOpen, setIsStickerOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cancelRecordingRef = useRef(false);
  const stickerInputRef = useRef<HTMLInputElement>(null);

  const insertEmoji = (emoji: { native: string }) => {
    const ta = textareaRef.current;
    if (!ta) {
      setTexto(t => t + emoji.native);
      return;
    }
    const start = ta.selectionStart ?? texto.length;
    const end = ta.selectionEnd ?? texto.length;
    const next = texto.slice(0, start) + emoji.native + texto.slice(end);
    setTexto(next);
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + emoji.native.length;
      ta.focus();
    });
    setIsEmojiOpen(false);
  };

  useEffect(() => {
    fetch('/api/usuarios/me/whatsapp/status')
      .then(r => r.json())
      .then(d => setWpState(d.state ?? 'close'))
      .catch(() => setWpState('open'))
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

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const fmtTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const iniciarGravacao = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType =
        ["audio/ogg;codecs=opus", "audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find(
          t => MediaRecorder.isTypeSupported(t)
        ) ?? "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];
      cancelRecordingRef.current = false;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        if (cancelRecordingRef.current) {
          cancelRecordingRef.current = false;
          audioChunksRef.current = [];
          return;
        }
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        const url = URL.createObjectURL(blob);
        setPendingAudio({ blob, url });
        audioChunksRef.current = [];
      };
      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setGravando(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch {
      toast.error("Não foi possível acessar o microfone.");
    }
  };

  const pararGravacao = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setGravando(false);
    setRecordingTime(0);
    mediaRecorderRef.current?.stop();
  };

  const cancelarGravacao = () => {
    cancelRecordingRef.current = true;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setGravando(false);
    setRecordingTime(0);
    mediaRecorderRef.current?.stop();
  };

  const cancelarAudio = () => {
    if (pendingAudio) URL.revokeObjectURL(pendingAudio.url);
    setPendingAudio(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, forceSticker?: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 16 MB).");
      return;
    }
    const isSticker = forceSticker || file.type === "image/webp";
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    setPendingFile({ file, preview, isSticker });
    setIsStickerOpen(false);
    e.target.value = "";
  };

  const cancelarAnexo = () => {
    if (pendingFile?.preview) URL.revokeObjectURL(pendingFile.preview);
    setPendingFile(null);
  };

  const enviarMensagem = async () => {
    const conteudo = texto.trim();
    if ((!conteudo && !pendingFile && !pendingAudio) || enviando) return;
    setEnviando(true);
    const textoOriginal = texto;
    setTexto("");
    try {
      let mediaUrl: string | null = null;
      let mediaType: string | null = null;
      let mimetype: string | null = null;
      let filename: string | null = null;

      if (pendingFile || pendingAudio) {
        setUploadando(true);
        const fd = new FormData();
        if (pendingAudio) {
          const ext = pendingAudio.blob.type.includes("ogg")
            ? "ogg"
            : pendingAudio.blob.type.includes("mp4")
            ? "m4a"
            : "webm";
          const audioFile = new File(
            [pendingAudio.blob],
            `audio_${Date.now()}.${ext}`,
            { type: pendingAudio.blob.type }
          );
          fd.append("file", audioFile);
        } else if (pendingFile) {
          fd.append("file", pendingFile.file);
        }
        const upRes = await fetch("/api/mensagens/upload", { method: "POST", body: fd });
        const upData = await upRes.json();
        setUploadando(false);
        if (!upRes.ok || !upData.success) {
          toast.error(upData.mensagem ?? "Erro ao enviar arquivo.");
          setTexto(textoOriginal);
          return;
        }
        mediaUrl = upData.url;
        mimetype = upData.mimetype;
        filename = upData.filename;
        if (pendingAudio) {
          mediaType = "audio";
          URL.revokeObjectURL(pendingAudio.url);
          setPendingAudio(null);
        } else if (pendingFile) {
          if (pendingFile.isSticker)               mediaType = "sticker";
          else if (mimetype?.startsWith("image/")) mediaType = "image";
          else if (mimetype?.startsWith("video/")) mediaType = "video";
          else if (mimetype?.startsWith("audio/")) mediaType = "audio";
          else                                      mediaType = "document";
          if (pendingFile.preview) URL.revokeObjectURL(pendingFile.preview);
          setPendingFile(null);
        }
      }

      const conteudoLabels: Record<string, string> = {
        image: "[Imagem]", audio: "[Áudio]", video: "[Vídeo]", sticker: "[Figurinha]",
      };
      const payload: Record<string, unknown> = {
        conteudo: conteudo || (mediaType ? (conteudoLabels[mediaType] ?? filename ?? "[Arquivo]") : (filename ?? "[Arquivo]")),
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

  // Agrupa mensagens com separadores de data
  const items: Array<{ type: "msg"; msg: Mensagem } | { type: "sep"; date: Date; key: string }> = [];
  let lastDate: Date | null = null;
  for (const msg of mensagens) {
    const d = new Date(msg.criado_em);
    if (!lastDate || !isSameDay(d, lastDate)) {
      items.push({ type: "sep", date: d, key: `sep-${msg.id}` });
      lastDate = d;
    }
    items.push({ type: "msg", msg });
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <FaWhatsapp className="h-10 w-10 text-[#25d366]" />
        <div className="h-5 w-5 rounded-full border-2 border-[#25d366] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-xl border border-border shadow-sm">

      {/* Header estilo WhatsApp */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[#075e54] dark:bg-[#1f2c34] shrink-0">
        <div className="h-9 w-9 rounded-full shrink-0 overflow-hidden bg-white/20 flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt={leadNome ?? "Contato"} className="h-full w-full object-cover" />
          ) : (
            <FaWhatsapp className="h-[18px] w-[18px] text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white leading-tight truncate">
            {leadNome ?? "WhatsApp"}
          </p>
          <p className="text-[11px] text-white/55 font-mono truncate leading-tight">{telefone}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {wpState === "open" && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25d366] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#25d366]" />
            </span>
          )}
          {onBlock && (
            <Popover open={isBlockOpen} onOpenChange={setIsBlockOpen}>
              <PopoverTrigger asChild>
                <button
                  className="p-1.5 rounded-full hover:bg-white/15 text-white/60 hover:text-white transition-colors"
                  title="Não é lead — ignorar contato"
                >
                  <UserMinus className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="bottom" align="end" className="w-60 p-3">
                <p className="text-sm font-semibold mb-1">Ignorar este contato?</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Mensagens futuras deste número não criarão nem atualizarão leads.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsBlockOpen(false)}
                    className="flex-1 text-xs px-3 py-1.5 rounded-md border hover:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      setBlocking(true);
                      await onBlock();
                      setIsBlockOpen(false);
                      setBlocking(false);
                    }}
                    disabled={blocking}
                    className="flex-1 text-xs px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors flex items-center justify-center gap-1 disabled:opacity-60"
                  >
                    {blocking ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    Confirmar
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Área de mensagens com fundo característico do WhatsApp */}
      <div
        className="flex-1 overflow-y-auto min-h-[200px] max-h-[320px] px-3 py-2 space-y-0.5"
        style={{
          backgroundColor: "#e5ddd5",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M0 0h80v80H0z' fill='none'/%3E%3Ccircle cx='40' cy='40' r='1' fill='rgba(0,0,0,0.05)'/%3E%3C/svg%3E")`,
        }}
      >
        {mensagens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <div className="h-14 w-14 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center mb-3 shadow-sm">
              <FaWhatsapp className="h-7 w-7 text-[#25d366]" />
            </div>
            <p className="text-[13px] text-[#54656f] font-medium">Nenhuma mensagem ainda</p>
            <p className="text-[11px] text-[#8696a0] mt-1">Inicie o atendimento enviando uma mensagem.</p>
          </div>
        ) : (
          items.map((item) =>
            item.type === "sep" ? (
              <DateSeparator key={item.key} date={item.date} />
            ) : (
              <MessageBubble key={item.msg.id} mensagem={item.msg} />
            )
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* Preview de arquivo pendente */}
      {pendingFile && (
        <div className="flex items-center gap-2.5 px-3 py-2 bg-white dark:bg-[#2a3942] border-t border-black/8">
          {pendingFile.preview ? (
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pendingFile.preview} alt="" className="h-10 w-10 object-cover rounded-lg" />
              {pendingFile.isSticker && (
                <span className="absolute -top-1.5 -right-1.5 bg-purple-500 text-white text-[9px] font-bold px-1 rounded-full leading-tight py-0.5">
                  sticker
                </span>
              )}
            </div>
          ) : (
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
          )}
          <span className="flex-1 truncate text-xs text-[#54656f] dark:text-gray-300">{pendingFile.file.name}</span>
          <button onClick={cancelarAnexo} className="text-[#8696a0] hover:text-red-500 transition-colors p-1 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Preview de áudio gravado */}
      {pendingAudio && !gravando && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#d9fdd3] dark:bg-[#005c4b] border-t border-black/8">
          <AudioPlayer src={pendingAudio.url} isEnviada={false} />
          <button onClick={cancelarAudio} className="text-[#54656f] hover:text-red-500 transition-colors shrink-0 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Estados do WhatsApp (carregando / não configurado / desconectado) */}
      {wpState === null && (
        <div className="flex items-center justify-center py-3 bg-[#f0f2f5] dark:bg-[#1f2c34]">
          <div className="h-5 w-5 rounded-full border-2 border-[#25d366] border-t-transparent animate-spin" />
        </div>
      )}

      {wpState === "not_configured" && (
        <div className="px-4 py-3 bg-[#f0f2f5] dark:bg-[#1f2c34] border-t border-black/5 text-center">
          <p className="text-xs text-[#8696a0]">Instância não configurada. Entre em contato com o administrador para enviar mensagens.</p>
        </div>
      )}

      {wpState !== null && wpState !== "open" && wpState !== "not_configured" && (
        <div className="px-4 py-3 bg-[#f0f2f5] dark:bg-[#1f2c34] border-t border-black/5 text-center space-y-1.5">
          <p className="text-xs text-[#8696a0]">WhatsApp não conectado.</p>
          <a href="/configuracoes" className="text-xs text-[#00a884] hover:underline font-medium">
            Conectar WhatsApp →
          </a>
        </div>
      )}

      {/* Área de input — só quando WhatsApp conectado */}
      {wpState === "open" && (gravando ? (
        /* Estado de gravação */
        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#f0f2f5] dark:bg-[#1f2c34] border-t border-black/5">
          <button
            onClick={cancelarGravacao}
            className="h-9 w-9 rounded-full flex items-center justify-center text-[#8696a0] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
            title="Cancelar"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <span className="text-sm font-mono text-red-500 font-semibold tabular-nums shrink-0">{fmtTimer(recordingTime)}</span>
            <div className="flex-1 h-1 bg-red-100 dark:bg-red-950/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-400 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, (recordingTime % 60) * 1.67)}%` }}
              />
            </div>
          </div>
          <button
            onClick={pararGravacao}
            className="h-10 w-10 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-colors shrink-0 shadow-sm"
            title="Parar gravação"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </button>
        </div>
      ) : (
        /* Input normal */
        <div className="flex items-end gap-1.5 px-2 py-2 bg-[#f0f2f5] dark:bg-[#1f2c34] border-t border-black/5">
          {/* Inputs ocultos */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
            onChange={(e) => handleFileSelect(e)}
          />
          <input
            ref={cameraInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFileSelect(e)}
          />
          <input
            ref={stickerInputRef}
            type="file"
            className="hidden"
            accept="image/webp,image/png,image/gif"
            onChange={(e) => handleFileSelect(e, true)}
          />

          {/* Anexo */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={enviando}
            className="h-10 w-10 rounded-full flex items-center justify-center text-[#54656f] dark:text-[#8696a0] hover:bg-black/8 dark:hover:bg-white/10 transition-colors shrink-0 disabled:opacity-40"
            title="Anexar arquivo"
          >
            <Paperclip className="h-5.5 w-5.5" />
          </button>

          {/* Câmera (mobile only) */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={enviando}
            className="h-10 w-10 rounded-full flex items-center justify-center text-[#54656f] dark:text-[#8696a0] hover:bg-black/8 dark:hover:bg-white/10 transition-colors shrink-0 disabled:opacity-40 sm:hidden"
            title="Tirar foto"
          >
            <Camera className="h-5.5 w-5.5" />
          </button>

          {/* Emoji picker */}
          <Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={enviando}
                className="h-10 w-10 rounded-full flex items-center justify-center text-[#54656f] dark:text-[#8696a0] hover:bg-black/8 dark:hover:bg-white/10 transition-colors shrink-0 disabled:opacity-40"
                title="Emojis"
              >
                <Smile className="h-5.5 w-5.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              className="p-0 border-0 shadow-xl w-auto"
              sideOffset={8}
            >
              <EmojiPicker
                data={data}
                onEmojiSelect={insertEmoji}
                locale="pt"
                theme="light"
                previewPosition="none"
                skinTonePosition="none"
                maxFrequentRows={2}
              />
            </PopoverContent>
          </Popover>

          {/* Figurinha picker */}
          <Popover open={isStickerOpen} onOpenChange={setIsStickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={enviando}
                className="h-10 w-10 rounded-full flex items-center justify-center text-[#54656f] dark:text-[#8696a0] hover:bg-black/8 dark:hover:bg-white/10 transition-colors shrink-0 disabled:opacity-40"
                title="Figurinhas"
              >
                <Sticker className="h-5.5 w-5.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              className="w-64 p-3 shadow-xl"
              sideOffset={8}
            >
              <p className="text-[11px] font-semibold text-[#54656f] dark:text-[#8696a0] uppercase tracking-wide mb-2">
                Figurinhas
              </p>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Selecione um arquivo <span className="font-mono bg-muted px-1 rounded">.webp</span>, <span className="font-mono bg-muted px-1 rounded">.png</span> ou <span className="font-mono bg-muted px-1 rounded">.gif</span> para enviar como figurinha.
              </p>
              <button
                type="button"
                onClick={() => stickerInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-colors"
              >
                <Sticker className="h-4 w-4" />
                Escolher figurinha
              </button>
            </PopoverContent>
          </Popover>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={pendingAudio || pendingFile ? "Legenda (opcional)..." : "Mensagem"}
              className="w-full bg-white dark:bg-[#2a3942] rounded-[21px] px-4 py-[9px] text-[14px] leading-[1.4] resize-none outline-none text-gray-800 dark:text-gray-100 placeholder:text-[#8696a0] min-h-[42px] max-h-[100px] overflow-y-auto block"
              rows={1}
              disabled={enviando}
            />
          </div>

          {/* Enviar / Mic */}
          {texto.trim() || pendingFile || pendingAudio ? (
            <button
              onClick={enviarMensagem}
              disabled={enviando || (!texto.trim() && !pendingFile && !pendingAudio)}
              className="h-10 w-10 rounded-full flex items-center justify-center bg-[#00a884] hover:bg-[#017a5f] text-white transition-colors shrink-0 disabled:opacity-50 shadow-sm"
              title="Enviar"
            >
              {uploadando ? (
                <Loader2 className="h-[18px] w-[18px] animate-spin" />
              ) : (
                <Send className="h-[18px] w-[18px]" />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={iniciarGravacao}
              disabled={enviando}
              className="h-10 w-10 rounded-full flex items-center justify-center bg-[#00a884] hover:bg-[#017a5f] text-white transition-colors shrink-0 disabled:opacity-50 shadow-sm"
              title="Gravar áudio"
            >
              <Mic className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      ))}
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

  return (
    <div className="flex items-center gap-2.5 w-60 py-0.5">
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

      <button
        onClick={toggle}
        disabled={!ready}
        className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 ${
          isEnviada
            ? "bg-white/25 hover:bg-white/35 text-white"
            : "bg-[#00a884] hover:bg-[#017a5f] text-white"
        }`}
      >
        {!ready ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : playing ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" />
        )}
      </button>

      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.05}
          value={currentTime}
          onChange={seek}
          className="w-full h-1 rounded-full appearance-none cursor-pointer"
          style={{
            background: isEnviada
              ? `linear-gradient(to right, rgba(255,255,255,0.9) ${progress}%, rgba(255,255,255,0.3) ${progress}%)`
              : `linear-gradient(to right, #00a884 ${progress}%, #d1d5db ${progress}%)`,
          }}
        />
        <div className={`flex justify-between text-[10px] tabular-nums leading-none ${isEnviada ? "text-white/65" : "text-[#8696a0]"}`}>
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
  const aviso     = mensagem.metadata?.aviso;
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isSticker  = mediaType === "sticker";
  const ilegivel   = !!aviso;

  // Mensagem ilegível/criptografada — render especial
  if (ilegivel) {
    return (
      <div className={`flex my-0.5 ${isEnviada ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[78%] px-3 py-2 rounded-[10px] rounded-tl-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.08)] bg-[#fff8e1] dark:bg-[#2a2518] border border-[#f0d060]/40 dark:border-[#a08020]/30">
          <div className="flex items-center gap-1.5 mb-1">
            <LockKeyhole className="h-3 w-3 text-[#b8860b] dark:text-[#d4a017] shrink-0" />
            <span className="text-[11px] font-semibold text-[#b8860b] dark:text-[#d4a017]">Mensagem criptografada</span>
          </div>
          <p className="text-[13px] text-[#7a6000] dark:text-[#c8a030] italic leading-snug">
            {aviso}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-[#b8860b]/60 dark:text-[#d4a017]/50 justify-end">
            <span>{hora}</span>
            {isEnviada && <StatusIcon status={mensagem.status} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex my-0.5 ${isEnviada ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] text-sm relative ${
          isSticker
            ? "p-0"
            : `px-3 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.12)] ${
                isEnviada
                  ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-[10px] rounded-tr-[3px]"
                  : "bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-[10px] rounded-tl-[3px]"
              }`
        }`}
      >
        {!isEnviada && mensagem.metadata?.contact_name && (
          <p className="text-[12px] font-semibold mb-1 text-[#06cf9c]">
            {mensagem.metadata.contact_name}
          </p>
        )}

        {mediaUrl && mediaType === "audio" && (
          <AudioPlayer src={mediaUrl} isEnviada={isEnviada} />
        )}

        {mediaUrl && mediaType === "image" && (
          <>
            <button type="button" onClick={() => setLightboxOpen(true)} className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl}
                alt="Imagem"
                className="rounded-lg max-w-55 max-h-55 object-cover mb-1 cursor-zoom-in"
              />
            </button>
            <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
              <DialogContent showCloseButton={false} className="w-auto max-w-[90vw] sm:max-w-[90vw] max-h-[90vh] p-2 bg-black/90 border-0 overflow-hidden">
                <button
                  onClick={() => setLightboxOpen(false)}
                  className="absolute top-3 right-3 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediaUrl}
                  alt="Imagem ampliada"
                  className="block max-w-[86vw] max-h-[86vh] w-auto h-auto object-contain rounded"
                />
              </DialogContent>
            </Dialog>
          </>
        )}

        {mediaUrl && mediaType === "video" && (
          <video controls src={mediaUrl} className="w-full max-w-[240px] rounded-lg mb-1" />
        )}

        {mediaUrl && mediaType === "sticker" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl} alt="Figurinha" className="w-32 h-32 object-contain" />
        )}

        {mediaUrl && mediaType === "document" && (
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 mb-1 text-xs ${isEnviada ? "text-[#111b21]/80 dark:text-white/80 hover:text-[#111b21] dark:hover:text-white" : "text-[#00a884] hover:text-[#017a5f]"} transition-colors`}
          >
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${isEnviada ? "bg-[#111b21]/10 dark:bg-white/15" : "bg-[#00a884]/15"}`}>
              <FileText className="h-4 w-4" />
            </div>
            <span className="truncate underline underline-offset-2">
              {mensagem.conteudo !== "[Documento]" ? mensagem.conteudo : "Baixar documento"}
            </span>
          </a>
        )}

        {(!mediaType || !["[Áudio]", "[Imagem]", "[Documento]", "[Vídeo]", "[Figurinha]", "[Mídia]"].includes(mensagem.conteudo)) && (
          <p className="leading-[1.4] whitespace-pre-wrap break-words text-[14px]">
            {mensagem.conteudo}
          </p>
        )}

        <div
          className={`flex items-center gap-1 mt-0.5 text-[11px] leading-none ${
            isEnviada ? "text-[#667781] dark:text-[#8696a0] justify-end" : "text-[#667781] dark:text-[#8696a0]"
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
    return <AlertCircle className="h-3 w-3 text-red-400" />;
  }
  if (status === "lida") {
    return <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />;
  }
  if (status === "entregue") {
    return <CheckCheck className="h-3.5 w-3.5 text-[#8696a0]" />;
  }
  return <Check className="h-3.5 w-3.5 text-[#8696a0]" />;
}
