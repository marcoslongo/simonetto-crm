"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { Lead } from "@/lib/types"

const investmentOptions = [
  { value: "35-50k",    label: "De R$ 35.000 a R$ 50.000" },
  { value: "50-100k",   label: "De R$ 50.000 a R$ 100.000" },
  { value: "100-150k",  label: "De R$ 100.000 a R$ 150.000" },
  { value: "150-200k",  label: "De R$ 150.000 a R$ 200.000" },
  { value: "acima-250k", label: "Acima de R$ 250.000" },
]

const interestOptions = [
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

interface NovoLeadDialogProps {
  lojas: { id: number; nome: string }[]
  onLeadCriado: (lead: Lead) => void
}

interface FormData {
  nome: string
  telefone: string
  email: string
  cidade: string
  estado: string
  interesses: string[]
  expectativa_investimento: string
  mensagem: string
  loja_id: string
}

const EMPTY: FormData = {
  nome: "",
  telefone: "",
  email: "",
  cidade: "",
  estado: "",
  interesses: [],
  expectativa_investimento: "",
  mensagem: "",
  loja_id: "",
}

export function NovoLeadDialog({ lojas, onLeadCriado }: NovoLeadDialogProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [salvando, setSalvando] = useState(false)

  const set = <K extends keyof FormData>(field: K, value: FormData[K]) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const toggleInteresse = (value: string) => {
    setForm(prev => ({
      ...prev,
      interesses: prev.interesses.includes(value)
        ? prev.interesses.filter(i => i !== value)
        : [...prev.interesses, value],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.nome.trim() || !form.telefone.trim()) {
      toast.error("Nome e telefone são obrigatórios.")
      return
    }

    setSalvando(true)
    try {
      const interesse = form.interesses.join(", ")

      const payload: Record<string, unknown> = {
        nome: form.nome.trim(),
        telefone: form.telefone.trim(),
        origem: "proprio",
      }

      if (form.email.trim())               payload.email = form.email.trim()
      if (form.cidade.trim())              payload.cidade = form.cidade.trim()
      if (form.estado)                     payload.estado = form.estado
      if (interesse)                       payload.interesse = interesse
      if (form.expectativa_investimento)   payload.expectativa_investimento = form.expectativa_investimento
      if (form.mensagem.trim())            payload.mensagem = form.mensagem.trim()
      if (form.loja_id)                    payload.loja_id = Number(form.loja_id)
      else if (lojas[0])                   payload.loja_id = lojas[0].id

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.mensagem ?? "Erro ao cadastrar lead.")
        return
      }

      const novoLead: Lead = {
        id: String(data.lead_id),
        nome: form.nome.trim(),
        telefone: form.telefone.trim(),
        email: form.email.trim() || undefined,
        cidade: form.cidade.trim(),
        estado: form.estado,
        interesse,
        expectativa_investimento: form.expectativa_investimento,
        loja_regiao: "",
        mensagem: form.mensagem.trim(),
        pipefy_card_id: null,
        loja_id: String(payload.loja_id ?? lojas[0]?.id ?? null),
        origem: "proprio",
        status: "nao_atendido",
        data_criacao: new Date().toISOString(),
        data_atualizacao: new Date().toISOString(),
        loja_nome: "",
        loja_cidade: "",
        loja_estado: "",
        unread_count: 0,
      }

      onLeadCriado(novoLead)
      setForm(EMPTY)
      setOpen(false)
      toast.success("Lead cadastrado com sucesso!")
    } catch {
      toast.error("Erro ao cadastrar lead.")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#16255c] hover:bg-[#16255c] hover:opacity-90 gap-2">
          <Plus className="h-4 w-4" />
          Novo Lead
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Lead Manualmente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Nome + Telefone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome <span className="text-destructive">*</span></Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={e => set("nome", e.target.value)}
                placeholder="Nome completo"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefone">Telefone <span className="text-destructive">*</span></Label>
              <Input
                id="telefone"
                value={form.telefone}
                onChange={e => set("telefone", e.target.value)}
                placeholder="(00) 00000-0000"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={e => set("email", e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>

          {/* Cidade + Estado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={form.cidade}
                onChange={e => set("cidade", e.target.value)}
                placeholder="Cidade"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={v => set("estado", v)}>
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

          {/* Interesse — multi-select via chips */}
          <div className="space-y-1.5">
            <Label>Interesse</Label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map(({ value, label }) => {
                const selected = form.interesses.includes(value)
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleInteresse(value)}
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
                )
              })}
            </div>
          </div>

          {/* Expectativa de investimento */}
          <div className="space-y-1.5">
            <Label>Expectativa de Investimento</Label>
            <Select
              value={form.expectativa_investimento}
              onValueChange={v => set("expectativa_investimento", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma faixa" />
              </SelectTrigger>
              <SelectContent>
                {investmentOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loja (multi-loja) */}
          {lojas.length > 1 && (
            <div className="space-y-1.5">
              <Label>Loja</Label>
              <Select value={form.loja_id} onValueChange={v => set("loja_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar loja" />
                </SelectTrigger>
                <SelectContent>
                  {lojas.map(({ id, nome }) => (
                    <SelectItem key={id} value={String(id)}>{nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Mensagem */}
          <div className="space-y-1.5">
            <Label htmlFor="mensagem">Observação / Mensagem</Label>
            <Textarea
              id="mensagem"
              value={form.mensagem}
              onChange={e => set("mensagem", e.target.value)}
              placeholder="Informações adicionais sobre o lead..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando} className="bg-[#16255c] hover:bg-[#16255c] hover:opacity-90">
              {salvando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {salvando ? "Salvando..." : "Cadastrar Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
