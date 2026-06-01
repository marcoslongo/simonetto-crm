"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Lead } from "@/lib/types"
import {
  Sparkles,
  Copy,
  RefreshCw,
  FileText,
  CalendarClock,
  MessageSquare,
  TrendingUp,
} from "lucide-react"
import { toast } from "sonner"

const BLUE = "#16255c"

interface AiLeadPanelProps {
  lead: Lead
}

type TipoAnalise = "resumo" | "followup" | "mensagem" | "analise"

const TIPOS = [
  {
    id: "resumo" as TipoAnalise,
    label: "Resumo Executivo",
    icon: FileText,
    description: "Visão geral do lead para o atendente",
  },
  {
    id: "followup" as TipoAnalise,
    label: "Sugestão de Follow-up",
    icon: CalendarClock,
    description: "Próxima ação recomendada pela IA",
  },
  {
    id: "mensagem" as TipoAnalise,
    label: "Rascunho de Mensagem",
    icon: MessageSquare,
    description: "Mensagem personalizada para WhatsApp",
  },
  {
    id: "analise" as TipoAnalise,
    label: "Análise de Conversão",
    icon: TrendingUp,
    description: "Probabilidade e estratégia de fechamento",
  },
]

export function AiLeadPanel({ lead }: AiLeadPanelProps) {
  const [tipoAtivo, setTipoAtivo] = useState<TipoAnalise | null>(null)
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)

  const gerar = async (tipo: TipoAnalise) => {
    setTipoAtivo(tipo)
    setLoading(true)
    setResultado(null)
    try {
      const res = await fetch(`/api/leads/${lead.id}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, lead }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error("Erro ao gerar análise. Verifique se a GROQ_API_KEY está configurada no .env")
        return
      }
      setResultado(data.texto)
    } catch {
      toast.error("Erro ao conectar com a IA")
    } finally {
      setLoading(false)
    }
  }

  const copiar = async () => {
    if (!resultado) return
    await navigator.clipboard.writeText(resultado)
    toast.success("Copiado!")
  }

  const tipoLabel = TIPOS.find((t) => t.id === tipoAtivo)?.label

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {TIPOS.map(({ id, label, icon: Icon, description }) => (
          <button
            key={id}
            onClick={() => gerar(id)}
            disabled={loading}
            className="flex items-start gap-3 p-3 rounded-xl border text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#16255c]/5 hover:border-[#16255c]/40"
            style={
              tipoAtivo === id
                ? { borderColor: BLUE, backgroundColor: `${BLUE}0d` }
                : undefined
            }
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
              style={{ backgroundColor: `${BLUE}1a` }}
            >
              {loading && tipoAtivo === id ? (
                <RefreshCw className="h-4 w-4 animate-spin" style={{ color: BLUE }} />
              ) : (
                <Icon className="h-4 w-4" style={{ color: BLUE }} />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-card-foreground">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: `${BLUE}1a` }}
          >
            <Sparkles className="h-5 w-5 animate-pulse" style={{ color: BLUE }} />
          </div>
          <p className="text-sm text-muted-foreground">Gerando análise com IA...</p>
        </div>
      )}

      {resultado && !loading && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: BLUE }} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {tipoLabel}
              </span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={copiar}
                className="gap-1.5 h-7 px-2 text-xs"
              >
                <Copy className="h-3 w-3" />
                Copiar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => gerar(tipoAtivo!)}
                className="gap-1.5 h-7 px-2 text-xs"
              >
                <RefreshCw className="h-3 w-3" />
                Regenerar
              </Button>
            </div>
          </div>
          <p className="text-sm text-card-foreground leading-relaxed whitespace-pre-wrap">
            {resultado}
          </p>
        </div>
      )}

      {!loading && !resultado && (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: `${BLUE}1a` }}
          >
            <Sparkles className="h-6 w-6" style={{ color: BLUE }} />
          </div>
          <p className="text-sm font-medium text-card-foreground">Assistente de IA</p>
          <p className="text-xs text-muted-foreground text-center max-w-75">
            Selecione uma opção acima para gerar análises inteligentes sobre este lead com Llama 3.3 70B.
          </p>
        </div>
      )}
    </div>
  )
}
