"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const MOTIVOS = [
  { key: "motivo_preco",              label: "Preço acima do orçamento" },
  { key: "motivo_concorrencia",       label: "Perdeu para a concorrência" },
  { key: "motivo_prazo_entrega",      label: "Prazo de entrega muito longo" },
  { key: "motivo_pagamento",          label: "Condições de pagamento inadequadas" },
  { key: "motivo_financiamento",      label: "Cliente não conseguiu financiamento" },
  { key: "motivo_obra_pendente",      label: "Obra / imóvel ainda não finalizado" },
  { key: "motivo_indecisao",          label: "Cliente indeciso / adiou a decisão" },
  { key: "motivo_produto_inadequado", label: "Produto não atendeu a necessidade" },
  { key: "motivo_contato_perdido",    label: "Contato perdido / cliente sumiu" },
  { key: "motivo_atendimento",        label: "Problema no atendimento" },
  { key: "motivo_desqualificado",     label: "Lead Desqualificado ou Sem Fundamento" },
  { key: "motivo_outro",              label: "Outro motivo" },
] as const

type MotivoKey = typeof MOTIVOS[number]["key"]

type Motivos = Record<MotivoKey, boolean>

const initialMotivos = (): Motivos =>
  Object.fromEntries(MOTIVOS.map(m => [m.key, false])) as Motivos

interface VendaNaoRealizadaDialogProps {
  open: boolean
  leadId: string
  leadNome: string
  onClose: () => void
  onSaved: () => void
}

export function VendaNaoRealizadaDialog({
  open,
  leadId,
  leadNome,
  onClose,
  onSaved,
}: VendaNaoRealizadaDialogProps) {
  const [motivos, setMotivos] = useState<Motivos>(initialMotivos)
  const [observacao, setObservacao] = useState("")
  const [saving, setSaving] = useState(false)

  const toggle = (key: MotivoKey) =>
    setMotivos(prev => ({ ...prev, [key]: !prev[key] }))

  const selectedCount = Object.values(motivos).filter(Boolean).length
  const canSave = selectedCount > 0 || observacao.trim().length > 0

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${leadId}/venda-nao-realizada`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...motivos, observacao: observacao.trim() || null }),
      })
      if (!res.ok) {
        toast.error("Erro ao salvar motivos")
        return
      }
      toast.success("Motivos registrados com sucesso")
      onSaved()
    } catch {
      toast.error("Erro ao salvar motivos")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={open => { if (!open && !saving) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Por que a venda não foi realizada?</DialogTitle>
              <DialogDescription className="mt-0.5">
                {leadNome} · Obrigatório para mover o lead
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-3">
              Selecione os motivos <span className="text-muted-foreground font-normal">(múltipla escolha)</span>
            </p>
            <div className="grid grid-cols-1 gap-2">
              {MOTIVOS.map(({ key, label }) => {
                const active = motivos[key]
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle(key)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm text-left transition-colors cursor-pointer",
                      active
                        ? "border-red-300 bg-red-50 text-red-800 font-medium"
                        : "border-border bg-card text-foreground hover:bg-muted/50"
                    )}
                  >
                    <span className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      active ? "border-red-500 bg-red-500" : "border-muted-foreground/40"
                    )}>
                      {active && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Observações <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <Textarea
              placeholder="Descreva com mais detalhes o motivo da não realização..."
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button
              onClick={handleSave}
              disabled={saving || !canSave}
              className="flex-1"
            >
              {saving ? "Salvando..." : "Confirmar e mover lead"}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </Button>
          </div>

          {!canSave && (
            <p className="text-xs text-muted-foreground text-center -mt-2">
              Selecione ao menos um motivo ou preencha as observações para confirmar.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
