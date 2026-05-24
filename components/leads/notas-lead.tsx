"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Loader2, Send, Trash2, StickyNote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface Nota {
  id: number
  lead_id: number
  usuario_id: number
  usuario_nome: string
  conteudo: string
  criado_em: string
}

interface NotasLeadProps {
  leadId: string
  currentUserId?: number
}

export function NotasLead({ leadId, currentUserId }: NotasLeadProps) {
  const [notas, setNotas] = useState<Nota[]>([])
  const [loading, setLoading] = useState(true)
  const [texto, setTexto] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [deletando, setDeletando] = useState<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchNotas()
  }, [leadId])

  async function fetchNotas() {
    setLoading(true)
    try {
      const res = await fetch(`/api/leads/${leadId}/notas`)
      const data = await res.json()
      if (data.success) setNotas(data.notas ?? [])
    } catch {
      toast.error("Erro ao carregar notas")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const conteudo = texto.trim()
    if (!conteudo) return

    setSalvando(true)
    try {
      const res = await fetch(`/api/leads/${leadId}/notas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conteudo }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.mensagem ?? "Erro ao salvar nota")
        return
      }
      setNotas(prev => [data.nota, ...prev])
      setTexto("")
      textareaRef.current?.focus()
    } catch {
      toast.error("Erro ao salvar nota")
    } finally {
      setSalvando(false)
    }
  }

  async function handleDelete(id: number) {
    setDeletando(id)
    try {
      const res = await fetch(`/api/notas/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.mensagem ?? "Erro ao excluir nota")
        return
      }
      setNotas(prev => prev.filter(n => n.id !== id))
    } catch {
      toast.error("Erro ao excluir nota")
    } finally {
      setDeletando(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          ref={textareaRef}
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Adicionar nota interna..."
          rows={3}
          className="resize-none text-sm"
          onKeyDown={e => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit(e as any)
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Ctrl+Enter para salvar</span>
          <Button
            type="submit"
            size="sm"
            disabled={salvando || !texto.trim()}
            className="gap-1.5 bg-[#16255c] hover:bg-[#16255c] hover:opacity-90"
          >
            {salvando
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Send className="h-3.5 w-3.5" />}
            {salvando ? "Salvando..." : "Salvar nota"}
          </Button>
        </div>
      </form>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : notas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
          <StickyNote className="h-8 w-8 opacity-30" />
          <p className="text-sm">Nenhuma nota ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notas.map(nota => (
            <div
              key={nota.id}
              className="group rounded-lg border border-border bg-amber-50/60 p-3 space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-[#16255c]">
                    {nota.usuario_nome}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(nota.criado_em), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>

                {(currentUserId === nota.usuario_id || !currentUserId) && (
                  <button
                    onClick={() => handleDelete(nota.id)}
                    disabled={deletando === nota.id}
                    className={cn(
                      "shrink-0 rounded p-0.5 text-muted-foreground/40 transition-colors",
                      "opacity-0 group-hover:opacity-100",
                      "hover:text-red-500 hover:bg-red-50",
                      deletando === nota.id && "opacity-100"
                    )}
                    title="Excluir nota"
                  >
                    {deletando === nota.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>

              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {nota.conteudo}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
