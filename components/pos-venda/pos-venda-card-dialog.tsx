"use client"

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import {
  User,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Calendar,
  Package,
  CreditCard,
  Clock,
  Wrench,
  MessageSquare,
  History,
  Plus,
  Trash2,
  Loader2,
  ChevronRight,
  StickyNote,
  Info,
  Pencil,
  Check,
  X,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FaWhatsapp } from 'react-icons/fa'
import { ChatPanel } from '@/components/chat/chat-panel'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { PosVenda, PosVendaHistorico, PosVendaNota, PosVendaAssistencia, StatusAssistencia } from '@/lib/types'

// ── helpers ───────────────────────────────────────────────────────────────────
function formatMoeda(valor?: number | null) {
  if (valor == null) return '—'
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(d?: string | null) {
  if (!d) return '—'
  try { return format(new Date(d), 'dd/MM/yyyy', { locale: ptBR }) } catch { return '—' }
}

function formatDateTime(d?: string | null) {
  if (!d) return '—'
  try { return format(new Date(d), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) } catch { return '—' }
}

const FORMA_PAGAMENTO_LABEL: Record<string, string> = {
  dinheiro: 'Dinheiro', cartao_credito: 'Cartão de Crédito', cartao_debito: 'Cartão de Débito',
  pix: 'PIX', boleto: 'Boleto', financiamento: 'Financiamento', cheque: 'Cheque', outro: 'Outro',
}

const STATUS_ASSISTENCIA_LABEL: Record<StatusAssistencia, string> = {
  aberta: 'Aberta', em_atendimento: 'Em Atendimento',
  aguardando_cliente: 'Aguardando Cliente', resolvida: 'Resolvida', encerrada: 'Encerrada',
}

const STATUS_ASSISTENCIA_COLOR: Record<StatusAssistencia, string> = {
  aberta: 'bg-red-100 text-red-700',
  em_atendimento: 'bg-orange-100 text-orange-700',
  aguardando_cliente: 'bg-yellow-100 text-yellow-700',
  resolvida: 'bg-emerald-100 text-emerald-700',
  encerrada: 'bg-gray-100 text-gray-600',
}

const TAB_CLS = "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5 text-sm gap-1.5"

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70 font-medium">{label}</p>
        <p className="text-sm text-foreground">{value || '—'}</p>
      </div>
    </div>
  )
}

// ── aba Resumo ────────────────────────────────────────────────────────────────
function AbaResumo({ pv, isGerente, onUpdated }: { pv: PosVenda; isGerente?: boolean; onUpdated?: (updated: PosVenda) => void }) {
  const [editingResponsavel, setEditingResponsavel] = useState(false)
  const [selectedResponsavelId, setSelectedResponsavelId] = useState<string>(
    pv.responsavel_id ? String(pv.responsavel_id) : 'none'
  )
  const [currentResponsavelNome, setCurrentResponsavelNome] = useState(pv.responsavel_nome ?? '')
  const [savingResponsavel, setSavingResponsavel] = useState(false)
  const [usuarios, setUsuarios] = useState<{ id: number; nome: string }[]>([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(false)

  useEffect(() => {
    setSelectedResponsavelId(pv.responsavel_id ? String(pv.responsavel_id) : 'none')
    setCurrentResponsavelNome(pv.responsavel_nome ?? '')
    setEditingResponsavel(false)
  }, [pv.id])

  const handleEditResponsavel = async () => {
    setEditingResponsavel(true)
    if (usuarios.length === 0) {
      setLoadingUsuarios(true)
      try {
        const res = await fetch(`/api/lojas/${pv.loja_id}/usuarios`)
        const data = await res.json()
        if (data.success) setUsuarios(data.usuarios ?? [])
      } catch { /* ignore */ }
      finally { setLoadingUsuarios(false) }
    }
  }

  const handleSaveResponsavel = async () => {
    const responsavelId = selectedResponsavelId === 'none' ? null : Number(selectedResponsavelId)
    setSavingResponsavel(true)
    try {
      const res = await fetch(`/api/pos-vendas/${pv.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responsavel_id: responsavelId }),
      })
      const data = await res.json()
      if (data.success) {
        const novoNome = responsavelId ? (usuarios.find(u => u.id === responsavelId)?.nome ?? '') : ''
        setCurrentResponsavelNome(novoNome)
        setEditingResponsavel(false)
        onUpdated?.({ ...pv, responsavel_id: responsavelId, responsavel_nome: novoNome || null })
        toast.success('Responsável atualizado.')
      } else {
        toast.error(data.mensagem ?? 'Erro ao atualizar responsável.')
      }
    } catch { toast.error('Erro ao atualizar responsável.') }
    finally { setSavingResponsavel(false) }
  }

  const handleCancelEditResponsavel = () => {
    setSelectedResponsavelId(pv.responsavel_id ? String(pv.responsavel_id) : 'none')
    setEditingResponsavel(false)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <p className="text-sm font-semibold">Dados do Cliente</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={User}   label="Nome"     value={pv.lead_nome} />
          <InfoRow icon={Phone}  label="Telefone" value={pv.lead_telefone} />
          <InfoRow icon={Mail}   label="E-mail"   value={pv.lead_email} />
          <InfoRow icon={MapPin} label="Cidade"   value={pv.lead_cidade && pv.lead_estado ? `${pv.lead_cidade}, ${pv.lead_estado}` : (pv.lead_cidade ?? pv.lead_estado)} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-sm font-semibold">Dados da Venda</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={DollarSign} label="Valor"         value={formatMoeda(pv.venda_valor)} />
          <InfoRow icon={Calendar}   label="Data da Venda" value={formatDate(pv.venda_data_venda)} />
          <InfoRow icon={CreditCard} label="Forma Pgto."   value={pv.venda_forma_pagamento ? pv.venda_forma_pagamento.split(',').map(v => FORMA_PAGAMENTO_LABEL[v] ?? v).join(' + ') : undefined} />
          <InfoRow icon={Package}    label="Nº do Pedido"  value={pv.venda_numero_pedido ? `#${pv.venda_numero_pedido}` : undefined} />
          <InfoRow icon={User}       label="Vendedor"      value={pv.venda_atendente_nome} />
        </div>
        {pv.venda_observacoes && (
          <div className="mt-4 rounded-lg bg-muted/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70 font-medium mb-1">Observações da Venda</p>
            <p className="text-sm text-foreground whitespace-pre-line">{pv.venda_observacoes}</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-sm font-semibold">Dados do Pós-Venda</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={Clock} label="Criado em"         value={formatDateTime(pv.created_at)} />
          <InfoRow icon={Clock} label="Nesta etapa desde" value={formatDateTime(pv.etapa_desde)} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm font-semibold">Responsável pelo Pós-Venda</p>
          </div>
          {isGerente && !editingResponsavel && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleEditResponsavel}
                  className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-card-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Alterar responsável</TooltipContent>
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
              <Select value={selectedResponsavelId} onValueChange={setSelectedResponsavelId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um responsável…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Sem responsável —</SelectItem>
                  {usuarios.map(u => (
                    <SelectItem key={u.id} value={String(u.id)}>{u.nome}</SelectItem>
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
                {savingResponsavel ? 'Salvando...' : 'Confirmar'}
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
            {currentResponsavelNome || '—'}
          </p>
        )}
      </div>
    </div>
  )
}

// ── aba Histórico ─────────────────────────────────────────────────────────────
function AbaHistorico({ posVendaId }: { posVendaId: number }) {
  const [historico, setHistorico] = useState<PosVendaHistorico[]>([])
  const [loading, setLoading] = useState(true)
  const [comentario, setComentario] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/pos-vendas/${posVendaId}/historico`)
      .then(r => r.json())
      .then(d => { if (d.success) setHistorico(d.data ?? []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [posVendaId])

  const addComentario = async () => {
    if (!comentario.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/pos-vendas/${posVendaId}/historico`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comentario: comentario.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setComentario('')
        const fresh = await fetch(`/api/pos-vendas/${posVendaId}/historico`).then(r => r.json())
        if (fresh.success) setHistorico(fresh.data ?? [])
        toast.success('Comentário adicionado.')
      } else {
        toast.error(data.mensagem ?? 'Erro ao adicionar comentário.')
      }
    } catch { toast.error('Erro ao adicionar comentário.') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {historico.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum evento registrado.</p>
        ) : (
          historico.map(h => (
            <div key={h.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={cn('h-2 w-2 rounded-full mt-1.5 shrink-0', h.etapa_anterior ? 'bg-blue-400' : 'bg-emerald-400')} />
                <div className="w-px flex-1 bg-border mt-1" />
              </div>
              <div className="pb-3 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {h.etapa_anterior ? (
                    <span className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{h.etapa_anterior}</span>
                      <ChevronRight className="h-3 w-3 inline mx-0.5" />
                      <span className="font-medium text-foreground">{h.etapa_nova}</span>
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-foreground">{h.etapa_nova}</span>
                  )}
                  <span className="text-[10px] text-muted-foreground/60">{formatDateTime(h.created_at)}</span>
                </div>
                {h.usuario_nome && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">{h.usuario_nome}</p>
                )}
                {h.comentario && (
                  <p className="text-sm text-foreground mt-1 bg-muted/40 rounded-lg px-3 py-2">{h.comentario}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-2 border-t space-y-2">
        <Textarea
          value={comentario}
          onChange={e => setComentario(e.target.value)}
          placeholder="Adicionar comentário ao histórico…"
          rows={2}
          className="resize-none text-sm"
        />
        <Button
          onClick={addComentario}
          disabled={saving || !comentario.trim()}
          size="sm"
          className="bg-[#16255c] hover:bg-[#16255c] hover:opacity-90"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
          Comentar
        </Button>
      </div>
    </div>
  )
}

// ── aba Anotações ─────────────────────────────────────────────────────────────
function AbaNotas({ posVendaId, currentUserId, isGerente }: { posVendaId: number; currentUserId: number; isGerente?: boolean }) {
  const [notas, setNotas] = useState<PosVendaNota[]>([])
  const [loading, setLoading] = useState(true)
  const [conteudo, setConteudo] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/pos-vendas/${posVendaId}/notas`)
      .then(r => r.json())
      .then(d => { if (d.success) setNotas(d.data ?? []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [posVendaId])

  const addNota = async () => {
    if (!conteudo.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/pos-vendas/${posVendaId}/notas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conteudo: conteudo.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setNotas(prev => [...prev, data.data])
        setConteudo('')
        toast.success('Anotação adicionada.')
      } else {
        toast.error(data.mensagem ?? 'Erro ao adicionar.')
      }
    } catch { toast.error('Erro ao adicionar anotação.') }
    finally { setSaving(false) }
  }

  const deleteNota = async (id: number) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/pos-venda-notas/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setNotas(prev => prev.filter(n => n.id !== id))
        toast.success('Anotação excluída.')
      } else {
        toast.error(data.mensagem ?? 'Erro ao excluir.')
      }
    } catch { toast.error('Erro ao excluir anotação.') }
    finally { setDeletingId(null) }
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {notas.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma anotação ainda.</p>
        ) : (
          notas.map(n => (
            <div key={n.id} className="rounded-xl border border-border bg-card p-4 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">{n.usuario_nome || 'Usuário'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground/60">{formatDateTime(n.created_at)}</span>
                  {(isGerente || n.usuario_id === currentUserId) && (
                    <button
                      onClick={() => deleteNota(n.id)}
                      disabled={deletingId === n.id}
                      className="text-muted-foreground/50 hover:text-red-500 transition-colors"
                    >
                      {deletingId === n.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-foreground whitespace-pre-line">{n.conteudo}</p>
            </div>
          ))
        )}
      </div>

      <div className="pt-2 border-t space-y-2">
        <Textarea
          value={conteudo}
          onChange={e => setConteudo(e.target.value)}
          placeholder="Nova anotação interna…"
          rows={2}
          className="resize-none text-sm"
        />
        <Button
          onClick={addNota}
          disabled={saving || !conteudo.trim()}
          size="sm"
          className="bg-[#16255c] hover:bg-[#16255c] hover:opacity-90"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Adicionar
        </Button>
      </div>
    </div>
  )
}

// ── aba Assistência ───────────────────────────────────────────────────────────
function AbaAssistencia({ posVendaId }: { posVendaId: number }) {
  const [assistencias, setAssistencias] = useState<PosVendaAssistencia[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ descricao: '' })
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/pos-vendas/${posVendaId}/assistencias`)
      .then(r => r.json())
      .then(d => { if (d.success) setAssistencias(d.data ?? []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [posVendaId])

  const create = async () => {
    if (!form.descricao.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/pos-vendas/${posVendaId}/assistencias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: form.descricao.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setAssistencias(prev => [data.data, ...prev])
        setForm({ descricao: '' })
        setShowForm(false)
        toast.success('Ocorrência aberta.')
      } else {
        toast.error(data.mensagem ?? 'Erro ao abrir ocorrência.')
      }
    } catch { toast.error('Erro ao abrir ocorrência.') }
    finally { setSaving(false) }
  }

  const updateStatus = async (id: number, status: StatusAssistencia, solucao?: string) => {
    setUpdatingId(id)
    try {
      const body: Record<string, string> = { status }
      if (solucao !== undefined) body.solucao = solucao
      if (status === 'resolvida' || status === 'encerrada') {
        body.data_conclusao = new Date().toISOString()
      }
      const res = await fetch(`/api/pos-venda-assistencias/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        setAssistencias(prev => prev.map(a => a.id === id ? { ...a, status, solucao: solucao ?? a.solucao } : a))
        toast.success('Ocorrência atualizada.')
      } else {
        toast.error(data.mensagem ?? 'Erro ao atualizar.')
      }
    } catch { toast.error('Erro ao atualizar ocorrência.') }
    finally { setUpdatingId(null) }
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{assistencias.length} ocorrência{assistencias.length !== 1 ? 's' : ''}</p>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Nova ocorrência
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">Nova ocorrência de assistência técnica</p>
          <div className="space-y-1.5">
            <Label className="text-xs">Descrição do problema</Label>
            <Textarea
              value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              placeholder="Descreva o problema relatado pelo cliente…"
              rows={3}
              className="resize-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={create} disabled={saving || !form.descricao.trim()} size="sm" className="bg-[#16255c] hover:bg-[#16255c] hover:opacity-90">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Abrir ocorrência'}
            </Button>
            <Button onClick={() => setShowForm(false)} size="sm" variant="ghost">Cancelar</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {assistencias.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma ocorrência registrada.</p>
        ) : (
          assistencias.map(a => (
            <div key={a.id} className={cn('rounded-xl border border-border bg-card p-4 space-y-2', (a.status === 'encerrada' || a.status === 'resolvida') && 'opacity-70')}>
              <div className="flex items-start justify-between gap-2">
                <Badge className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', STATUS_ASSISTENCIA_COLOR[a.status])}>
                  {STATUS_ASSISTENCIA_LABEL[a.status]}
                </Badge>
                <span className="text-[10px] text-muted-foreground/60">{formatDateTime(a.created_at)}</span>
              </div>
              <p className="text-sm text-foreground">{a.descricao}</p>
              {a.solucao && (
                <div className="rounded-lg bg-muted/40 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Solução</p>
                  <p className="text-sm">{a.solucao}</p>
                </div>
              )}
              {a.responsavel_nome && (
                <p className="text-[11px] text-muted-foreground">
                  <User className="h-3 w-3 inline mr-1" />{a.responsavel_nome}
                </p>
              )}
              {a.data_conclusao && (
                <p className="text-[11px] text-muted-foreground">
                  <Calendar className="h-3 w-3 inline mr-1" />Concluído: {formatDate(a.data_conclusao)}
                </p>
              )}
              {a.status !== 'encerrada' && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {a.status === 'aberta' && (
                    <button onClick={() => updateStatus(a.id, 'em_atendimento')} disabled={updatingId === a.id}
                      className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors disabled:opacity-50">
                      Em atendimento
                    </button>
                  )}
                  {(a.status === 'em_atendimento' || a.status === 'aberta') && (
                    <button onClick={() => updateStatus(a.id, 'aguardando_cliente')} disabled={updatingId === a.id}
                      className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 transition-colors disabled:opacity-50">
                      Aguardando cliente
                    </button>
                  )}
                  {a.status !== 'resolvida' && (
                    <button onClick={() => updateStatus(a.id, 'resolvida')} disabled={updatingId === a.id}
                      className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50">
                      Resolver
                    </button>
                  )}
                  {a.status === 'resolvida' && (
                    <button onClick={() => updateStatus(a.id, 'encerrada')} disabled={updatingId === a.id}
                      className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50">
                      Encerrar
                    </button>
                  )}
                  {updatingId === a.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ── PosVendaCardDialog (principal) ────────────────────────────────────────────

interface PosVendaCardDialogProps {
  posVenda: PosVenda
  open: boolean
  onOpenChange: (open: boolean) => void
  isGerente?: boolean
  currentUserId: number
  onUpdated: (pv: PosVenda) => void
}

export function PosVendaCardDialog({ posVenda, open, onOpenChange, isGerente, currentUserId, onUpdated }: PosVendaCardDialogProps) {
  const [pv, setPv] = useState<PosVenda>(posVenda)

  useEffect(() => {
    setPv(posVenda)
  }, [posVenda])

  const assistenciasAbertas = pv.assistencias_abertas ?? 0

  return (
    <TooltipProvider>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={[
        'flex flex-col overflow-hidden p-0 gap-0',
        'max-sm:inset-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:top-0 max-sm:left-0 max-sm:w-screen max-sm:max-w-none max-sm:h-dvh max-sm:rounded-none',
        'sm:h-[90vh] sm:w-[90vw] sm:max-w-[90vw]',
      ].join(' ')}>

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-0">
          <DialogHeader className="border-b border-border pb-3 sm:pb-4">
            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-2xl font-semibold text-card-foreground truncate">
                {pv.lead_nome || 'Pós-Venda'}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs sm:text-sm text-muted-foreground">
                {pv.venda_numero_pedido && (
                  <span className="font-mono">#{pv.venda_numero_pedido}</span>
                )}
                {pv.venda_valor != null && (
                  <span className="font-semibold text-emerald-700">
                    {pv.venda_valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                )}
                {assistenciasAbertas > 0 && (
                  <Badge className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full gap-1 hover:bg-orange-100">
                    <Wrench className="h-3 w-3" />
                    {assistenciasAbertas} assistência{assistenciasAbertas !== 1 ? 's' : ''} aberta{assistenciasAbertas !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────────── */}
        <Tabs defaultValue="resumo" className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="shrink-0 border-b border-border">
            <div className="overflow-x-auto no-scrollbar px-4 sm:px-6">
              <TabsList className="w-max min-w-full justify-start rounded-none bg-transparent p-0 h-auto gap-0">
                <TabsTrigger value="resumo" className={TAB_CLS}>
                  <Info className="h-3.5 w-3.5" />
                  Resumo
                </TabsTrigger>
                <TabsTrigger value="atendimento" className={TAB_CLS}>
                  <FaWhatsapp className="h-3.5 w-3.5" />
                  Atendimento
                </TabsTrigger>
                <TabsTrigger value="historico" className={TAB_CLS}>
                  <History className="h-3.5 w-3.5" />
                  Histórico
                </TabsTrigger>
                <TabsTrigger value="notas" className={TAB_CLS}>
                  <StickyNote className="h-3.5 w-3.5" />
                  Anotações
                </TabsTrigger>
                <TabsTrigger value="assistencia" className={TAB_CLS}>
                  <Wrench className="h-3.5 w-3.5" />
                  Assistência
                  {assistenciasAbertas > 0 && (
                    <span className="ml-1 h-4 min-w-4 rounded-full bg-orange-500 text-white text-[9px] flex items-center justify-center px-1">
                      {assistenciasAbertas}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
            <TabsContent value="resumo" className="mt-0 space-y-6">
              <AbaResumo
                pv={pv}
                isGerente={isGerente}
                onUpdated={updated => { setPv(updated); onUpdated(updated) }}
              />
            </TabsContent>

            <TabsContent value="atendimento" className="mt-0">
              {pv.lead_telefone ? (
                <ChatPanel
                  leadId={String(pv.lead_id)}
                  telefone={pv.lead_telefone}
                  lojaId={pv.loja_id ?? null}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                  <Phone className="h-8 w-8 opacity-30" />
                  <p className="text-sm">Telefone não cadastrado — não é possível iniciar atendimento.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="historico" className="mt-0">
              <AbaHistorico posVendaId={pv.id} />
            </TabsContent>

            <TabsContent value="notas" className="mt-0">
              <AbaNotas posVendaId={pv.id} currentUserId={currentUserId} isGerente={isGerente} />
            </TabsContent>

            <TabsContent value="assistencia" className="mt-0">
              <AbaAssistencia posVendaId={pv.id} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
    </TooltipProvider>
  )
}
