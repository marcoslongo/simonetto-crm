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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { CheckCircle2, DollarSign } from "lucide-react"
import { VendasRealizadasConfig, VendaRealizada, FormaPagamento } from "@/lib/types"

const FORMAS_PAGAMENTO: { value: FormaPagamento; label: string }[] = [
  { value: "dinheiro",       label: "Dinheiro" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "cartao_debito",  label: "Cartão de Débito" },
  { value: "pix",            label: "Pix" },
  { value: "boleto",         label: "Boleto Bancário" },
  { value: "financiamento",  label: "Financiamento" },
  { value: "cheque",         label: "Cheque" },
  { value: "outro",          label: "Outro" },
]

function formatCurrency(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (!digits) return ""
  const num = parseInt(digits, 10) / 100
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parseCurrency(formatted: string): number | null {
  const clean = formatted.replace(/\./g, "").replace(",", ".")
  const num = parseFloat(clean)
  return isNaN(num) ? null : num
}

interface VendaRealizadaDialogProps {
  open: boolean
  leadId: string
  leadNome: string
  config: VendasRealizadasConfig
  onClose: () => void
  onSaved: (venda: VendaRealizada) => void
}

export function VendaRealizadaDialog({
  open,
  leadId,
  leadNome,
  config,
  onClose,
  onSaved,
}: VendaRealizadaDialogProps) {
  const [valorFormatado, setValorFormatado] = useState("")
  const [dataVenda, setDataVenda] = useState(() => new Date().toISOString().split("T")[0])
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento | "">("")
  const [numeroPedido, setNumeroPedido] = useState("")
  const [numeroNf, setNumeroNf] = useState("")
  const [serieNf, setSerieNf] = useState("")
  const [chaveAcessoNf, setChaveAcessoNf] = useState("")
  const [linkNf, setLinkNf] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [saving, setSaving] = useState(false)

  const campos = config.campos
  const algumCampoVisivel =
    campos.valor ||
    campos.data_venda ||
    campos.forma_pagamento ||
    campos.numero_pedido ||
    campos.nota_fiscal ||
    campos.observacoes

  const temDados =
    valorFormatado.trim() !== "" ||
    formaPagamento !== "" ||
    numeroPedido.trim() !== "" ||
    numeroNf.trim() !== "" ||
    serieNf.trim() !== "" ||
    chaveAcessoNf.trim() !== "" ||
    linkNf.trim() !== "" ||
    observacoes.trim() !== ""

  const canSave = !config.preenchimento_obrigatorio || temDados

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValorFormatado(formatCurrency(e.target.value))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const venda: VendaRealizada = {
        lead_id: leadId,
        valor: valorFormatado ? parseCurrency(valorFormatado) : null,
        data_venda: dataVenda || null,
        forma_pagamento: (formaPagamento as FormaPagamento) || null,
        numero_pedido: numeroPedido.trim() || null,
        numero_nf: numeroNf.trim() || null,
        serie_nf: serieNf.trim() || null,
        chave_acesso_nf: chaveAcessoNf.trim() || null,
        link_nf: linkNf.trim() || null,
        observacoes: observacoes.trim() || null,
      }

      const res = await fetch(`/api/leads/${leadId}/venda-realizada`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(venda),
      })

      if (!res.ok) {
        toast.error("Erro ao registrar a venda")
        return
      }

      toast.success("Venda registrada com sucesso")
      onSaved(venda)
    } catch {
      toast.error("Erro ao registrar a venda")
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    onSaved({ lead_id: leadId })
  }

  return (
    <Dialog open={open} onOpenChange={open => { if (!open && !saving) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle>Registrar informações da venda</DialogTitle>
              <DialogDescription className="mt-0.5">
                {leadNome} · {config.preenchimento_obrigatorio ? "Preencha ao menos um campo" : "Todos os campos são opcionais"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {algumCampoVisivel ? (
          <div className="space-y-4">
            {campos.valor && (
              <div className="space-y-1.5">
                <Label htmlFor="vr-valor">
                  <DollarSign className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  Valor da venda <span className="text-muted-foreground font-normal text-xs">(R$)</span>
                </Label>
                <Input
                  id="vr-valor"
                  placeholder="0,00"
                  value={valorFormatado}
                  onChange={handleValorChange}
                  inputMode="numeric"
                />
              </div>
            )}

            {campos.data_venda && (
              <div className="space-y-1.5">
                <Label htmlFor="vr-data">Data da venda</Label>
                <Input
                  id="vr-data"
                  type="date"
                  value={dataVenda}
                  onChange={e => setDataVenda(e.target.value)}
                />
              </div>
            )}

            {campos.forma_pagamento && (
              <div className="space-y-1.5">
                <Label>Forma de pagamento</Label>
                <Select
                  value={formaPagamento}
                  onValueChange={v => setFormaPagamento(v as FormaPagamento)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAS_PAGAMENTO.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {campos.numero_pedido && (
              <div className="space-y-1.5">
                <Label htmlFor="vr-pedido">Número do pedido</Label>
                <Input
                  id="vr-pedido"
                  placeholder="Ex.: 001234"
                  value={numeroPedido}
                  onChange={e => setNumeroPedido(e.target.value)}
                />
              </div>
            )}

            {campos.nota_fiscal && (
              <div className="rounded-lg border border-border p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nota Fiscal</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="vr-nf-num">Número NF</Label>
                    <Input
                      id="vr-nf-num"
                      placeholder="000000"
                      value={numeroNf}
                      onChange={e => setNumeroNf(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="vr-nf-serie">Série</Label>
                    <Input
                      id="vr-nf-serie"
                      placeholder="001"
                      value={serieNf}
                      onChange={e => setSerieNf(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vr-nf-chave">Chave de acesso</Label>
                  <Input
                    id="vr-nf-chave"
                    placeholder="44 dígitos"
                    value={chaveAcessoNf}
                    onChange={e => setChaveAcessoNf(e.target.value)}
                    maxLength={44}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vr-nf-link">Link / arquivo da NF</Label>
                  <Input
                    id="vr-nf-link"
                    placeholder="https://..."
                    value={linkNf}
                    onChange={e => setLinkNf(e.target.value)}
                  />
                </div>
              </div>
            )}

            {campos.observacoes && (
              <div className="space-y-1.5">
                <Label htmlFor="vr-obs">
                  Observações <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
                </Label>
                <Textarea
                  id="vr-obs"
                  placeholder="Informações adicionais sobre a venda..."
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Button
                onClick={handleSave}
                disabled={saving || !canSave}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {saving ? "Salvando..." : "Confirmar venda"}
              </Button>
              {!config.preenchimento_obrigatorio && (
                <Button variant="outline" onClick={handleSkip} disabled={saving}>
                  Pular
                </Button>
              )}
              <Button variant="ghost" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
            </div>

            {config.preenchimento_obrigatorio && !temDados && (
              <p className="text-xs text-muted-foreground text-center -mt-2">
                Preencha ao menos um campo para confirmar a venda.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Nenhum campo configurado para exibição. A venda será registrada sem informações adicionais.
            </p>
            <div className="flex items-center gap-3">
              <Button onClick={handleSkip} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                Confirmar venda
              </Button>
              <Button variant="ghost" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
