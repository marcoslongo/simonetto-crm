"use client"

import { useRef, useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Send, Trash2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

const BLUE = "#16255c"

const EXEMPLOS = [
  "Quantos leads eu recebi este mês? Qual a distribuição por temperatura (quente, morno, frio)?",
  "Quais leads estão em negociação há mais tempo sem follow-up agendado? Liste os mais urgentes.",
  "Qual o perfil mais comum dos meus leads? Analise orçamento e ambientes de interesse.",
  "Como está a performance dos meus atendentes? Qual está com mais leads em negociação?",
]

interface Mensagem {
  role: "user" | "assistant"
  content: string
}

interface AiGerenteButtonProps {
  lojaNome?: string
}

export function AiGerenteButton({ lojaNome }: AiGerenteButtonProps) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [mensagens, loading])

  const enviar = async () => {
    const pergunta = prompt.trim()
    if (!pergunta || loading) return

    setPrompt("")
    setMensagens(prev => [...prev, { role: "user", content: pergunta }])
    setLoading(true)

    try {
      const res = await fetch("/api/ai/gerente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error("Erro ao consultar a IA")
        setMensagens(prev => prev.slice(0, -1))
        return
      }

      setMensagens(prev => [...prev, { role: "assistant", content: data.resposta }])
    } catch {
      toast.error("Erro ao conectar com a IA")
      setMensagens(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  return (
    <>
      {/* Floating tab on the right edge */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2 text-white px-2.5 py-5 rounded-l-2xl shadow-xl transition-all hover:pr-3"
        style={{ backgroundColor: BLUE }}
        title="Consultor de IA da Loja"
      >
        <Sparkles className="h-4 w-4 shrink-0" />
        <span
          className="text-[10px] font-bold tracking-widest uppercase select-none"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          IA Loja
        </span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-125 sm:max-w-125 flex flex-col p-0 gap-0"
        >
          {/* Header */}
          <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${BLUE}1a` }}
              >
                <Sparkles className="h-5 w-5" style={{ color: BLUE }} />
              </div>
              <div>
                <SheetTitle className="text-base">Consultor de IA</SheetTitle>
                <SheetDescription className="text-xs mt-0.5">
                  {lojaNome
                    ? `Analisando dados da ${lojaNome}`
                    : "Analisando dados da sua loja"}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {mensagens.length === 0 && !loading && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Exemplos de perguntas
                </p>
                {EXEMPLOS.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(ex)}
                    className="w-full text-left text-sm p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-[#16255c]/5 hover:border-[#16255c]/30 transition-all text-card-foreground leading-relaxed"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}

            {mensagens.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-1"
                    style={{ backgroundColor: `${BLUE}1a` }}
                  >
                    <Sparkles className="h-3.5 w-3.5" style={{ color: BLUE }} />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 max-w-[88%] text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "text-white rounded-tr-sm"
                      : "bg-muted/50 text-card-foreground border border-border rounded-tl-sm"
                  }`}
                  style={msg.role === "user" ? { backgroundColor: BLUE } : undefined}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-1"
                  style={{ backgroundColor: `${BLUE}1a` }}
                >
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" style={{ color: BLUE }} />
                </div>
                <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-muted/50 border border-border flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-border px-6 py-4 space-y-3 shrink-0">
            {mensagens.length > 0 && (
              <button
                onClick={() => setMensagens([])}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Limpar conversa
              </button>
            )}
            <div className="flex gap-2 items-end">
              <Textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Faça uma pergunta sobre os leads da sua loja..."
                className="min-h-20 resize-none text-sm flex-1"
                disabled={loading}
              />
              <Button
                onClick={enviar}
                disabled={!prompt.trim() || loading}
                size="icon"
                className="h-10 w-10 shrink-0 text-white border-0"
                style={{ backgroundColor: BLUE }}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Enter para enviar · Shift+Enter para nova linha
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
