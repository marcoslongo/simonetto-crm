'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Target, Plus, Pencil, Trash2, Trophy, TrendingUp, Users,
  Calendar, AlertTriangle, CheckCircle2, BarChart3,
  ChevronDown, Loader2, // Loader2 kept for saving state in form
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { MetaComercial, TipoMeta, PeriodoMeta, MetasDashboardData } from '@/lib/types'

// ─── Skeletons ────────────────────────────────────────────────────────────────

function MetasSummarySkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-white shadow-sm p-4 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-28" />
        </div>
      ))}
    </div>
  )
}

function MetasGridSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Skeleton className="h-4 w-28" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-white shadow-sm p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-full shrink-0" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-16" />
        <div className="rounded-xl border bg-white shadow-sm p-5 space-y-4">
          <Skeleton className="h-4 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIPO_LABELS: Record<TipoMeta, string> = {
  faturamento: 'Faturamento',
  quantidade_vendas: 'Qtd. de Vendas',
  conversao: 'Conversão (%)',
  personalizada: 'Personalizada',
}

const PERIODO_LABELS: Record<PeriodoMeta, string> = {
  mensal: 'Mensal', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual',
}

function formatValor(tipo: TipoMeta, valor: number): string {
  if (tipo === 'faturamento') return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  if (tipo === 'conversao') return `${valor.toFixed(1)}%`
  return valor.toLocaleString('pt-BR')
}

function statusMeta(pct: number): { label: string; color: string; bg: string; icon: React.ReactNode } {
  if (pct >= 100) return { label: 'Atingida', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: <CheckCircle2 className="h-3.5 w-3.5" /> }
  if (pct >= 80)  return { label: 'Em dia', color: 'text-blue-700', bg: 'bg-blue-100', icon: <TrendingUp className="h-3.5 w-3.5" /> }
  if (pct >= 50)  return { label: 'Em risco', color: 'text-amber-700', bg: 'bg-amber-100', icon: <AlertTriangle className="h-3.5 w-3.5" /> }
  return { label: 'Abaixo', color: 'text-red-700', bg: 'bg-red-100', icon: <ChevronDown className="h-3.5 w-3.5" /> }
}

function MetaProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(pct, 100)
  const color = pct >= 100 ? 'bg-emerald-500' : pct >= 80 ? 'bg-blue-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className={`h-2 rounded-full transition-all duration-700 ${color}`} style={{ width: `${clamped}%` }} />
    </div>
  )
}

// ─── Form de criação/edição ───────────────────────────────────────────────────

interface MetaFormData {
  nome: string
  tipo: TipoMeta
  periodo: PeriodoMeta
  valor_meta: string
  data_inicio: string
  data_fim: string
  usuario_id: string
}

const EMPTY_FORM: MetaFormData = {
  nome: '', tipo: 'faturamento', periodo: 'mensal',
  valor_meta: '', data_inicio: '', data_fim: '', usuario_id: '_equipe',
}

function periodoParaDatas(periodo: PeriodoMeta): { data_inicio: string; data_fim: string } {
  const hoje = new Date()
  const ano  = hoje.getFullYear()
  const mes  = hoje.getMonth()

  if (periodo === 'mensal') {
    const ini = new Date(ano, mes, 1)
    const fim = new Date(ano, mes + 1, 0)
    return { data_inicio: ini.toISOString().split('T')[0], data_fim: fim.toISOString().split('T')[0] }
  }
  if (periodo === 'trimestral') {
    const q   = Math.floor(mes / 3)
    const ini = new Date(ano, q * 3, 1)
    const fim = new Date(ano, q * 3 + 3, 0)
    return { data_inicio: ini.toISOString().split('T')[0], data_fim: fim.toISOString().split('T')[0] }
  }
  if (periodo === 'semestral') {
    const ini = mes < 6 ? new Date(ano, 0, 1) : new Date(ano, 6, 1)
    const fim = mes < 6 ? new Date(ano, 6, 0) : new Date(ano, 12, 0)
    return { data_inicio: ini.toISOString().split('T')[0], data_fim: fim.toISOString().split('T')[0] }
  }
  return { data_inicio: `${ano}-01-01`, data_fim: `${ano}-12-31` }
}

interface Usuario { id: number; nome: string }

interface MetaFormDialogProps {
  open: boolean
  lojaId: string
  meta?: MetaComercial | null
  usuarios: Usuario[]
  onClose: () => void
  onSaved: () => void
}

function MetaFormDialog({ open, lojaId, meta, usuarios, onClose, onSaved }: MetaFormDialogProps) {
  const [form, setForm] = useState<MetaFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (meta) {
      setForm({
        nome: meta.nome,
        tipo: meta.tipo,
        periodo: meta.periodo,
        valor_meta: String(meta.valor_meta),
        data_inicio: meta.data_inicio,
        data_fim: meta.data_fim,
        usuario_id: meta.usuario_id ? String(meta.usuario_id) : '_equipe',
      })
    } else {
      const datas = periodoParaDatas('mensal')
      setForm({ ...EMPTY_FORM, ...datas })
    }
  }, [meta, open])

  function handlePeriodo(p: PeriodoMeta) {
    setForm(f => ({ ...f, periodo: p, ...periodoParaDatas(p) }))
  }

  async function handleSave() {
    if (!form.nome.trim() || !form.valor_meta || !form.data_inicio || !form.data_fim) {
      toast.error('Preencha todos os campos obrigatórios.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        loja_id: Number(lojaId),
        nome: form.nome.trim(),
        tipo: form.tipo,
        periodo: form.periodo,
        valor_meta: parseFloat(form.valor_meta.replace(',', '.')),
        data_inicio: form.data_inicio,
        data_fim: form.data_fim,
        usuario_id: form.usuario_id === '_equipe' ? null : Number(form.usuario_id),
        status: 'ativa',
      }

      const url    = meta ? `/api/metas/${meta.id}` : '/api/metas'
      const method = meta ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!data.success) { toast.error(data.mensagem || 'Erro ao salvar.'); return }
      toast.success(meta ? 'Meta atualizada.' : 'Meta criada com sucesso.')
      onSaved()
    } catch {
      toast.error('Erro ao salvar meta.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v && !saving) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[#16255c]" />
            {meta ? 'Editar meta' : 'Nova meta comercial'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="meta-nome">Nome da meta *</Label>
            <Input id="meta-nome" placeholder="Ex.: Faturamento junho" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v as TipoMeta }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(TIPO_LABELS) as [TipoMeta, string][]).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Período *</Label>
              <Select value={form.periodo} onValueChange={v => handlePeriodo(v as PeriodoMeta)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(PERIODO_LABELS) as [PeriodoMeta, string][]).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="meta-valor">
              {form.tipo === 'faturamento' ? 'Meta de faturamento (R$) *' : form.tipo === 'conversao' ? 'Meta de conversão (%) *' : 'Quantidade alvo *'}
            </Label>
            <Input id="meta-valor" type="number" min="0" step={form.tipo === 'faturamento' ? '0.01' : '1'} placeholder="0" value={form.valor_meta} onChange={e => setForm(f => ({ ...f, valor_meta: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="meta-inicio">Data início *</Label>
              <Input id="meta-inicio" type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meta-fim">Data fim *</Label>
              <Input id="meta-fim" type="date" value={form.data_fim} onChange={e => setForm(f => ({ ...f, data_fim: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Responsável</Label>
            <Select value={form.usuario_id} onValueChange={v => setForm(f => ({ ...f, usuario_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_equipe">
                  <span className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Toda a equipe</span>
                </SelectItem>
                {usuarios.map(u => (
                  <SelectItem key={u.id} value={String(u.id)}>{u.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#16255c] hover:bg-[#1a2f75]">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            {meta ? 'Salvar alterações' : 'Criar meta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Card de meta individual ──────────────────────────────────────────────────

function MetaCard({ meta, isGerente, onEdit, onDelete }: {
  meta: MetaComercial
  isGerente: boolean
  onEdit: (m: MetaComercial) => void
  onDelete: (m: MetaComercial) => void
}) {
  const pct    = meta.percentual_atingido ?? 0
  const status = statusMeta(pct)

  return (
    <div className="rounded-xl border bg-white shadow-sm p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-[#16255c] truncate">{meta.nome}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className="text-xs">{TIPO_LABELS[meta.tipo]}</Badge>
            <Badge variant="outline" className="text-xs">{PERIODO_LABELS[meta.periodo]}</Badge>
            {meta.usuario_nome
              ? <span className="text-xs text-muted-foreground">{meta.usuario_nome}</span>
              : <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Equipe</span>
            }
          </div>
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${status.bg} ${status.color}`}>
          {status.icon}
          {status.label}
        </div>
      </div>

      <div>
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-muted-foreground">Realizado</span>
          <span className="font-bold text-[#16255c]">
            {formatValor(meta.tipo, meta.valor_realizado ?? 0)}
            <span className="text-muted-foreground font-normal"> / {formatValor(meta.tipo, meta.valor_meta)}</span>
          </span>
        </div>
        <MetaProgressBar pct={pct} />
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-muted-foreground">{pct.toFixed(1)}% atingido</span>
          {(meta.dias_restantes ?? 0) > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {meta.dias_restantes}d restantes
            </span>
          )}
        </div>
      </div>

      {isGerente && (
        <div className="flex items-center gap-2 pt-1 border-t">
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => onEdit(meta)}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir meta?</AlertDialogTitle>
                <AlertDialogDescription>A meta &quot;{meta.nome}&quot; será removida permanentemente.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(meta)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  )
}

// ─── Ranking ──────────────────────────────────────────────────────────────────

function RankingCard({ ranking }: { ranking: MetasDashboardData['ranking'] }) {
  if (!ranking.length) return (
    <div className="rounded-xl border bg-white shadow-sm p-5 text-center py-10">
      <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
      <p className="text-sm text-muted-foreground">Nenhum dado de ranking no período.</p>
    </div>
  )

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="rounded-xl border bg-white shadow-sm p-5 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Trophy className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-[#16255c]">Ranking de Faturamento</h3>
      </div>
      {ranking.map((r, i) => {
        const pct    = r.percentual_atingido ?? 0
        const status = statusMeta(pct)
        return (
          <div key={r.usuario_id} className="flex items-center gap-3">
            <span className="text-lg w-6 shrink-0 text-center">{medals[i] ?? `${i + 1}º`}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium truncate">{r.usuario_nome}</span>
                <span className="text-xs font-semibold text-[#16255c] shrink-0 ml-2">
                  {r.valor_realizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <MetaProgressBar pct={pct} />
              <div className="flex items-center justify-between mt-0.5">
                <span className={`text-[10px] font-medium ${status.color}`}>{pct > 0 ? `${pct.toFixed(1)}%` : '—'}</span>
                {r.valor_meta > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    meta: {r.valor_meta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface MetasClientProps {
  lojaId: string
  isGerente: boolean
  userId: number
}

export function MetasClient({ lojaId, isGerente, userId }: MetasClientProps) {
  const [dashboard, setDashboard] = useState<MetasDashboardData | null>(null)
  const [usuarios, setUsuarios]   = useState<Usuario[]>([])
  const [loading, setLoading]     = useState(true)
  const [editingMeta, setEditingMeta] = useState<MetaComercial | null>(null)
  const [formOpen, setFormOpen]   = useState(false)
  const [tab, setTab]             = useState('visao-geral')

  const loadDashboard = useCallback(async () => {
    if (!lojaId) return
    setLoading(true)
    try {
      const res  = await fetch(`/api/metas/dashboard?loja_id=${lojaId}`)
      const data = await res.json()
      if (data.success) setDashboard(data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [lojaId])

  const loadUsuarios = useCallback(async () => {
    try {
      const res  = await fetch(`/api/lojas/${lojaId}/usuarios`)
      const data = await res.json()
      if (data.success && data.usuarios) setUsuarios(data.usuarios)
    } catch { /* ignore */ }
  }, [lojaId])

  useEffect(() => {
    loadDashboard()
    if (isGerente) loadUsuarios()
  }, [loadDashboard, loadUsuarios, isGerente])

  async function handleDelete(meta: MetaComercial) {
    const res  = await fetch(`/api/metas/${meta.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      toast.success('Meta excluída.')
      loadDashboard()
    } else {
      toast.error('Erro ao excluir meta.')
    }
  }

  function openCreate() { setEditingMeta(null); setFormOpen(true) }
  function openEdit(m: MetaComercial) { setEditingMeta(m); setFormOpen(true) }

  // Módulo desativado para não-gerente
  if (!loading && dashboard && !dashboard.config?.ativo && !isGerente) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <Target className="h-12 w-12 text-slate-300" />
        <div>
          <p className="font-semibold text-slate-600">Módulo de metas não habilitado</p>
          <p className="text-sm text-muted-foreground mt-1">Solicite ao gerente da unidade que ative nas configurações.</p>
        </div>
      </div>
    )
  }

  const metas       = dashboard?.metas ?? []
  const minhasMetas = metas.filter(m => m.usuario_id === userId || m.usuario_id === null)
  const ranking     = dashboard?.ranking ?? []

  const totalMeta      = dashboard?.total_meta ?? 0
  const totalRealizado = dashboard?.total_realizado ?? 0
  const pctGeral       = dashboard?.percentual_geral ?? 0
  const statusGeral    = statusMeta(pctGeral)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Metas Comerciais</h2>
          <p className="text-muted-foreground mt-1">Acompanhe e gerencie os objetivos da equipe</p>
        </div>
        {isGerente && (
          <Button onClick={openCreate} className="bg-[#16255c] hover:bg-[#1a2f75]">
            <Plus className="h-4 w-4 mr-2" /> Nova meta
          </Button>
        )}
      </div>

      {/* Summary cards */}
      {loading ? (
        <MetasSummarySkeleton />
      ) : dashboard && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-white shadow-sm p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Meta total</p>
            <p className="text-2xl font-bold text-[#16255c]">
              {totalMeta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div className="rounded-xl border bg-white shadow-sm p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Realizado</p>
            <p className="text-2xl font-bold text-emerald-600">
              {totalRealizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div className={`rounded-xl border shadow-sm p-4 ${statusGeral.bg}`}>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Atingimento geral</p>
            <p className={`text-2xl font-bold ${statusGeral.color}`}>{pctGeral.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border bg-white shadow-sm p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Metas ativas</p>
            <p className="text-2xl font-bold text-[#16255c]">{metas.length}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="visao-geral">
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Visão Geral
          </TabsTrigger>
          {!isGerente && (
            <TabsTrigger value="minhas-metas">
              <Target className="h-3.5 w-3.5 mr-1.5" /> Minhas Metas
            </TabsTrigger>
          )}
          {isGerente && (
            <TabsTrigger value="gerenciar">
              <Users className="h-3.5 w-3.5 mr-1.5" /> Gerenciar
            </TabsTrigger>
          )}
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="visao-geral" className="mt-4">
          {loading ? (
            <MetasGridSkeleton />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {isGerente ? 'Todas as metas' : 'Metas da equipe'}
                </h3>
                {metas.length === 0 ? (
                  <div className="rounded-xl border bg-white p-10 text-center">
                    <Target className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhuma meta cadastrada.</p>
                    {isGerente && (
                      <Button size="sm" variant="outline" className="mt-4" onClick={openCreate}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Criar primeira meta
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {metas.map(m => (
                      <MetaCard key={m.id} meta={m} isGerente={isGerente} onEdit={openEdit} onDelete={handleDelete} />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Ranking</h3>
                <RankingCard ranking={ranking} />
              </div>
            </div>
          )}
        </TabsContent>

        {/* Minhas metas (vendedor) */}
        <TabsContent value="minhas-metas" className="mt-4">
          {loading ? (
            <MetasGridSkeleton />
          ) : minhasMetas.length === 0 ? (
            <div className="rounded-xl border bg-white p-10 text-center">
              <Target className="h-10 w-10 mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-muted-foreground">Você não possui metas cadastradas para este período.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {minhasMetas.map(m => (
                <MetaCard key={m.id} meta={m} isGerente={false} onEdit={openEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Gerenciar (gerente) */}
        <TabsContent value="gerenciar" className="mt-4">
          {loading ? (
            <MetasGridSkeleton />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Metas Cadastradas</h3>
                  {metas.length === 0 ? (
                    <div className="rounded-xl border bg-white p-10 text-center">
                      <Target className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                      <p className="text-sm text-muted-foreground">Nenhuma meta cadastrada.</p>
                      <Button size="sm" variant="outline" className="mt-4" onClick={openCreate}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Criar primeira meta
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {metas.map(m => (
                        <MetaCard key={m.id} meta={m} isGerente={true} onEdit={openEdit} onDelete={handleDelete} />
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Ranking</h3>
                  <RankingCard ranking={ranking} />
                </div>
              </div>

              {metas.length > 0 && (
                <div className="rounded-xl border bg-white shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-[#16255c] mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" /> Indicadores de Status
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Atingidas', filter: (p: number) => p >= 100, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
                      { label: 'Em dia', filter: (p: number) => p >= 80 && p < 100, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
                      { label: 'Em risco', filter: (p: number) => p >= 50 && p < 80, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
                      { label: 'Abaixo', filter: (p: number) => p < 50, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
                    ].map(({ label, filter, color, bg }) => {
                      const count = metas.filter(m => filter(m.percentual_atingido ?? 0)).length
                      return (
                        <div key={label} className={`rounded-lg border p-3 text-center ${bg}`}>
                          <p className={`text-2xl font-bold ${color}`}>{count}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de criação/edição */}
      <MetaFormDialog
        open={formOpen}
        lojaId={lojaId}
        meta={editingMeta}
        usuarios={usuarios}
        onClose={() => { setFormOpen(false); setEditingMeta(null) }}
        onSaved={() => {
          setFormOpen(false)
          setEditingMeta(null)
          loadDashboard()
        }}
      />
    </div>
  )
}
