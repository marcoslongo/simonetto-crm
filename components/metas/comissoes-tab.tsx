'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  DollarSign, Settings, History, ChevronRight, Plus, Trash2,
  Loader2, CheckCircle2, Clock, Banknote, AlertTriangle, Star,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  ComissaoConfig, ComissaoPreviewItem, ComissaoFechamento,
  FaixaMeta, FaixaPontos, COMISSAO_CONFIG_PADRAO, MetodoComissao,
} from '@/lib/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function pct(v: number) {
  return `${v.toFixed(1)}%`
}

function statusBadge(status: ComissaoFechamento['status']) {
  if (status === 'pago')
    return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Pago</Badge>
  if (status === 'aprovado')
    return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Aprovado</Badge>
  return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Rascunho</Badge>
}

function mesAtual() {
  const hoje = new Date()
  const y = hoje.getFullYear()
  const m = String(hoje.getMonth() + 1).padStart(2, '0')
  const ultimo = new Date(y, hoje.getMonth() + 1, 0).getDate()
  return { inicio: `${y}-${m}-01`, fim: `${y}-${m}-${ultimo}` }
}

function mesAnterior() {
  const hoje = new Date()
  const d = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const ultimo = new Date(y, d.getMonth() + 1, 0).getDate()
  return { inicio: `${y}-${m}-01`, fim: `${y}-${m}-${ultimo}` }
}

function labelPeriodo(ini: string, fim: string) {
  const fmt = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  return `${fmt(ini)} – ${fmt(fim)}`
}

// ─── Seção: Configurações ─────────────────────────────────────────────────────

function ConfiguracaoComissao({ lojaId, onSaved }: { lojaId: string; onSaved: () => void }) {
  const [config, setConfig] = useState<ComissaoConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadConfig = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/comissoes/config?loja_id=${lojaId}`)
      const data = await res.json()
      if (data.success) setConfig(data.config)
      else setConfig({ ...COMISSAO_CONFIG_PADRAO })
    } catch {
      setConfig({ ...COMISSAO_CONFIG_PADRAO })
    } finally {
      setLoading(false)
    }
  }, [lojaId])

  useEffect(() => { loadConfig() }, [loadConfig])

  async function salvar() {
    if (!config) return
    setSaving(true)
    try {
      const res  = await fetch('/api/comissoes/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loja_id: Number(lojaId), config }),
      })
      const data = await res.json()
      if (data.success) { toast.success('Configuração salva.'); onSaved() }
      else toast.error(data.mensagem || 'Erro ao salvar.')
    } catch {
      toast.error('Erro ao salvar configuração.')
    } finally {
      setSaving(false)
    }
  }

  function addFaixaMeta() {
    setConfig(c => c ? { ...c, faixas_meta: [...c.faixas_meta, { de: 0, ate: null, percentual: 0 }] } : c)
  }
  function removeFaixaMeta(i: number) {
    setConfig(c => c ? { ...c, faixas_meta: c.faixas_meta.filter((_, idx) => idx !== i) } : c)
  }
  function updateFaixaMeta(i: number, patch: Partial<FaixaMeta>) {
    setConfig(c => c ? {
      ...c,
      faixas_meta: c.faixas_meta.map((f, idx) => idx === i ? { ...f, ...patch } : f),
    } : c)
  }

  function addFaixaPontos() {
    setConfig(c => c ? { ...c, faixas_pontos: [...c.faixas_pontos, { de: 0, ate: null, valor_ponto: 0 }] } : c)
  }
  function removeFaixaPontos(i: number) {
    setConfig(c => c ? { ...c, faixas_pontos: c.faixas_pontos.filter((_, idx) => idx !== i) } : c)
  }
  function updateFaixaPontos(i: number, patch: Partial<FaixaPontos>) {
    setConfig(c => c ? {
      ...c,
      faixas_pontos: c.faixas_pontos.map((f, idx) => idx === i ? { ...f, ...patch } : f),
    } : c)
  }

  if (loading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
    </div>
  )

  if (!config) return null

  return (
    <div className="space-y-6">
      {/* Ativo + Método */}
      <div className="rounded-xl border bg-white shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[#16255c]">Configuração geral</h3>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setConfig(c => c ? { ...c, ativo: !c.ativo } : c)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.ativo ? 'bg-[#16255c]' : 'bg-slate-200'}`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${config.ativo ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className="text-sm font-medium">{config.ativo ? 'Módulo ativo' : 'Módulo inativo'}</span>
        </div>

        <div className="space-y-1.5">
          <Label>Método de comissionamento</Label>
          <Select
            value={config.metodo}
            onValueChange={v => setConfig(c => c ? { ...c, metodo: v as MetodoComissao } : c)}
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="markup">Markup (comissão sobre margem bruta)</SelectItem>
              <SelectItem value="pontuacao">Pontuação (pontos por valor vendido)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Faixas de meta (% atingimento → % comissão) — para ambos os métodos */}
      <div className="rounded-xl border bg-white shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#16255c]">Faixas de atingimento de meta</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {config.metodo === 'markup'
                ? 'Define o % de comissão aplicado sobre o markup gerado'
                : 'Faixas opcionais — usadas apenas se quiser comissão adicional por meta'}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={addFaixaMeta} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Faixa
          </Button>
        </div>

        {config.faixas_meta.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma faixa cadastrada.</p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground px-1">
              <span>De (%)</span><span>Até (%)</span><span>Comissão (%)</span><span />
            </div>
            {config.faixas_meta.map((f, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                <Input
                  type="number" min="0" step="1" placeholder="0"
                  value={f.de}
                  onChange={e => updateFaixaMeta(i, { de: Number(e.target.value) })}
                />
                <Input
                  type="number" min="0" step="1" placeholder="∞"
                  value={f.ate ?? ''}
                  onChange={e => updateFaixaMeta(i, { ate: e.target.value === '' ? null : Number(e.target.value) })}
                />
                <Input
                  type="number" min="0" step="0.01" placeholder="0"
                  value={f.percentual}
                  onChange={e => updateFaixaMeta(i, { percentual: Number(e.target.value) })}
                />
                <Button size="icon" variant="ghost" className="text-destructive h-9 w-9" onClick={() => removeFaixaMeta(i)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Deixe "Até" em branco para significar sem limite superior.</p>
          </div>
        )}
      </div>

      {/* Configuração de pontuação */}
      {config.metodo === 'pontuacao' && (
        <div className="rounded-xl border bg-white shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#16255c]">Regras de pontuação</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Define quantos pontos o vendedor acumula por real vendido</p>
            </div>
            <Button size="sm" variant="outline" onClick={addFaixaPontos} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Faixa
            </Button>
          </div>

          <div className="space-y-1.5 max-w-xs">
            <Label>Divisor de pontos</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">1 ponto a cada</span>
              <Input
                type="number" min="1" className="w-32"
                value={config.divisor_pontos}
                onChange={e => setConfig(c => c ? { ...c, divisor_pontos: Math.max(1, Number(e.target.value)) } : c)}
              />
              <span className="text-sm text-muted-foreground">reais em vendas</span>
            </div>
          </div>

          {config.faixas_pontos.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground px-1">
                <span>De (pts)</span><span>Até (pts)</span><span>R$ / ponto</span><span />
              </div>
              {config.faixas_pontos.map((f, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                  <Input
                    type="number" min="0" step="1" placeholder="0"
                    value={f.de}
                    onChange={e => updateFaixaPontos(i, { de: Number(e.target.value) })}
                  />
                  <Input
                    type="number" min="0" step="1" placeholder="∞"
                    value={f.ate ?? ''}
                    onChange={e => updateFaixaPontos(i, { ate: e.target.value === '' ? null : Number(e.target.value) })}
                  />
                  <Input
                    type="number" min="0" step="0.01" placeholder="0"
                    value={f.valor_ponto}
                    onChange={e => updateFaixaPontos(i, { valor_ponto: Number(e.target.value) })}
                  />
                  <Button size="icon" variant="ghost" className="text-destructive h-9 w-9" onClick={() => removeFaixaPontos(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={salvar} disabled={saving} className="bg-[#16255c] hover:bg-[#1a2f75]">
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
          Salvar configuração
        </Button>
      </div>
    </div>
  )
}

// ─── Seção: Fechar Período ────────────────────────────────────────────────────

interface ItemState extends ComissaoPreviewItem {
  custo_input: string
  observacoes: string
}

function calcularItemMarkup(item: ItemState, faixas: FaixaMeta[]): Omit<ItemState, 'custo_input' | 'observacoes'> {
  const custo = parseFloat(item.custo_input.replace(',', '.')) || 0
  const markup_gerado = Math.max(0, item.valor_vendas - custo)

  // Encontra a faixa de comissão pelo atingimento da meta
  let pct_comissao = 0
  for (const f of faixas) {
    const ate = f.ate ?? Infinity
    if (item.percentual_atingimento >= f.de && item.percentual_atingimento <= ate) {
      pct_comissao = f.percentual
      break
    }
  }

  return {
    ...item,
    valor_custo: custo,
    markup_gerado,
    percentual_comissao: pct_comissao,
    valor_comissao: Math.round(markup_gerado * pct_comissao / 100 * 100) / 100,
  }
}

function FecharPeriodo({ lojaId }: { lojaId: string }) {
  const hoje = mesAtual()
  const [inicio, setInicio] = useState(hoje.inicio)
  const [fim, setFim]       = useState(hoje.fim)
  const [config, setConfig] = useState<ComissaoConfig | null>(null)
  const [itens, setItens]   = useState<ItemState[]>([])
  const [loading, setLoading]   = useState(false)
  const [fechando, setFechando] = useState(false)
  const [previewed, setPreviewed] = useState(false)

  async function calcularPreview() {
    setLoading(true)
    setPreviewed(false)
    try {
      const res  = await fetch(`/api/comissoes/preview?loja_id=${lojaId}&periodo_inicio=${inicio}&periodo_fim=${fim}`)
      const data = await res.json()
      if (!data.success) { toast.error(data.mensagem || 'Erro ao calcular.'); return }
      setConfig(data.config)
      setItens((data.itens as ComissaoPreviewItem[]).map(i => ({
        ...i,
        custo_input: i.valor_custo > 0 ? String(i.valor_custo) : '',
        observacoes: '',
      })))
      setPreviewed(true)
      if (data.itens.length === 0) toast.info('Nenhuma venda registrada no período.')
    } catch {
      toast.error('Erro ao calcular preview.')
    } finally {
      setLoading(false)
    }
  }

  const isMarkup = config?.metodo === 'markup'

  const itensCalculados = useMemo(() => {
    if (!config || !isMarkup) return itens
    return itens.map(item => ({ ...item, ...calcularItemMarkup(item, config.faixas_meta) }))
  }, [itens, config, isMarkup])

  const totalComissao = itensCalculados.reduce((acc, i) => acc + i.valor_comissao, 0)
  const totalVendas   = itensCalculados.reduce((acc, i) => acc + i.valor_vendas, 0)

  function setCusto(uid: number, val: string) {
    setItens(prev => prev.map(i => i.usuario_id === uid ? { ...i, custo_input: val } : i))
  }
  function setObs(uid: number, val: string) {
    setItens(prev => prev.map(i => i.usuario_id === uid ? { ...i, observacoes: val } : i))
  }

  async function confirmarFechamento() {
    setFechando(true)
    try {
      const payload = {
        loja_id: Number(lojaId),
        periodo_inicio: inicio,
        periodo_fim: fim,
        itens: itensCalculados.map(i => ({
          usuario_id:   i.usuario_id,
          valor_custo:  i.valor_custo,
          observacoes:  i.observacoes,
        })),
      }
      const res  = await fetch('/api/comissoes/fechar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.mensagem)
        setPreviewed(false)
        setItens([])
      } else {
        toast.error(data.mensagem || 'Erro ao fechar período.')
      }
    } catch {
      toast.error('Erro ao fechar período.')
    } finally {
      setFechando(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Seletor de período */}
      <div className="rounded-xl border bg-white shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[#16255c]">Período de fechamento</h3>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label>Início</Label>
            <Input type="date" className="w-40" value={inicio} onChange={e => { setInicio(e.target.value); setPreviewed(false) }} />
          </div>
          <div className="space-y-1.5">
            <Label>Fim</Label>
            <Input type="date" className="w-40" value={fim} onChange={e => { setFim(e.target.value); setPreviewed(false) }} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { const m = mesAtual(); setInicio(m.inicio); setFim(m.fim); setPreviewed(false) }}>Mês atual</Button>
            <Button size="sm" variant="outline" onClick={() => { const m = mesAnterior(); setInicio(m.inicio); setFim(m.fim); setPreviewed(false) }}>Mês anterior</Button>
          </div>
        </div>

        <Button onClick={calcularPreview} disabled={loading} className="bg-[#16255c] hover:bg-[#1a2f75]">
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Calculando...</>
            : <><RefreshCw className="h-4 w-4 mr-1.5" /> Calcular comissões</>}
        </Button>
      </div>

      {/* Tabela de preview */}
      {previewed && itensCalculados.length > 0 && config && (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#16255c]">
                {isMarkup ? 'Fechamento por Markup' : 'Fechamento por Pontuação'}
                <span className="ml-2 text-xs font-normal text-muted-foreground">{labelPeriodo(inicio, fim)}</span>
              </p>
              {isMarkup && (
                <p className="text-xs text-muted-foreground mt-0.5">Informe o custo de cada vendedor para calcular o markup e a comissão.</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total comissões</p>
              <p className="text-lg font-bold text-emerald-600">{brl(totalComissao)}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Vendedor</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Vendas</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Meta</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Ating.</th>
                  {isMarkup ? (
                    <>
                      <th className="text-right p-3 font-medium text-muted-foreground">Custo (R$)</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Markup</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">% Comissão</th>
                    </>
                  ) : (
                    <>
                      <th className="text-right p-3 font-medium text-muted-foreground">Pontos</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">R$/ponto</th>
                    </>
                  )}
                  <th className="text-right p-3 font-medium text-[#16255c]">Comissão</th>
                  <th className="p-3 font-medium text-muted-foreground">Obs.</th>
                </tr>
              </thead>
              <tbody>
                {itensCalculados.map(item => (
                  <tr key={item.usuario_id} className="border-b hover:bg-slate-50/50">
                    <td className="p-3">
                      <div className="font-medium">{item.usuario_nome}</div>
                      <div className="text-xs text-muted-foreground">{item.qtd_vendas} venda(s)</div>
                    </td>
                    <td className="p-3 text-right">{brl(item.valor_vendas)}</td>
                    <td className="p-3 text-right text-muted-foreground">{item.valor_meta > 0 ? brl(item.valor_meta) : '—'}</td>
                    <td className="p-3 text-right">
                      <span className={`font-medium ${item.percentual_atingimento >= 100 ? 'text-emerald-600' : item.percentual_atingimento >= 80 ? 'text-blue-600' : 'text-amber-600'}`}>
                        {item.valor_meta > 0 ? pct(item.percentual_atingimento) : '—'}
                      </span>
                    </td>
                    {isMarkup ? (
                      <>
                        <td className="p-3 text-right">
                          <Input
                            type="number" min="0" step="0.01" placeholder="0,00"
                            className="w-32 text-right ml-auto"
                            value={item.custo_input}
                            onChange={e => setCusto(item.usuario_id, e.target.value)}
                          />
                        </td>
                        <td className="p-3 text-right">{brl(item.markup_gerado)}</td>
                        <td className="p-3 text-right text-muted-foreground">{item.percentual_comissao > 0 ? `${item.percentual_comissao}%` : '—'}</td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 text-right">{item.pontos_acumulados.toFixed(2)} pts</td>
                        <td className="p-3 text-right text-muted-foreground">{item.valor_ponto != null ? brl(item.valor_ponto) : '—'}</td>
                      </>
                    )}
                    <td className="p-3 text-right font-semibold text-emerald-700">{brl(item.valor_comissao)}</td>
                    <td className="p-3">
                      <Input
                        placeholder="Observações..."
                        className="w-40 text-xs"
                        value={item.observacoes}
                        onChange={e => setObs(item.usuario_id, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold">
                  <td className="p-3">Total</td>
                  <td className="p-3 text-right">{brl(totalVendas)}</td>
                  <td colSpan={isMarkup ? 5 : 3} />
                  <td className="p-3 text-right text-emerald-700">{brl(totalComissao)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="p-4 border-t flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={fechando} className="bg-[#16255c] hover:bg-[#1a2f75]">
                  {fechando && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Confirmar fechamento
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar fechamento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Serão registradas <strong>{itensCalculados.length} comissões</strong> para o período{' '}
                    <strong>{labelPeriodo(inicio, fim)}</strong>, totalizando{' '}
                    <strong>{brl(totalComissao)}</strong>. O fechamento ficará em rascunho para aprovação.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmarFechamento} className="bg-[#16255c] hover:bg-[#1a2f75]">
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      {previewed && itensCalculados.length === 0 && (
        <div className="rounded-xl border bg-white p-10 text-center">
          <DollarSign className="h-10 w-10 mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma venda registrada neste período.</p>
        </div>
      )}
    </div>
  )
}

// ─── Seção: Histórico ─────────────────────────────────────────────────────────

function Historico({ lojaId, isSupervisor }: { lojaId: string; isSupervisor: boolean }) {
  const [fechamentos, setFechamentos] = useState<ComissaoFechamento[]>([])
  const [loading, setLoading]   = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [atualizando, setAtualizando]   = useState<number | null>(null)

  const loadFechamentos = useCallback(async () => {
    setLoading(true)
    try {
      const qs  = `loja_id=${lojaId}${filtroStatus !== 'todos' ? `&status=${filtroStatus}` : ''}`
      const res  = await fetch(`/api/comissoes/fechamentos?${qs}`)
      const data = await res.json()
      if (data.success) setFechamentos(data.fechamentos)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [lojaId, filtroStatus])

  useEffect(() => { loadFechamentos() }, [loadFechamentos])

  async function acao(id: number, tipo: 'aprovar' | 'pagar') {
    setAtualizando(id)
    try {
      const res  = await fetch(`/api/comissoes/fechamentos/${id}/${tipo}`, { method: 'PATCH' })
      const data = await res.json()
      if (data.success) { toast.success(data.mensagem); loadFechamentos() }
      else toast.error(data.mensagem || 'Erro.')
    } catch {
      toast.error('Erro ao atualizar.')
    } finally {
      setAtualizando(null)
    }
  }

  // Agrupa por período para exibição
  const porPeriodo = useMemo(() => {
    const grupos: Record<string, ComissaoFechamento[]> = {}
    for (const f of fechamentos) {
      const key = `${f.periodo_inicio}|${f.periodo_fim}`
      if (!grupos[key]) grupos[key] = []
      grupos[key].push(f)
    }
    return Object.entries(grupos)
  }, [fechamentos])

  const statusIcon = (s: ComissaoFechamento['status']) => {
    if (s === 'pago')     return <Banknote className="h-4 w-4 text-emerald-500" />
    if (s === 'aprovado') return <CheckCircle2 className="h-4 w-4 text-blue-500" />
    return <Clock className="h-4 w-4 text-amber-500" />
  }

  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Filtro */}
      <div className="flex items-center gap-3">
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={loadFechamentos}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Atualizar
        </Button>
      </div>

      {porPeriodo.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center">
          <History className="h-10 w-10 mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum fechamento encontrado.</p>
        </div>
      ) : (
        porPeriodo.map(([chave, items]) => {
          const [ini, fim] = chave.split('|')
          const totalComissao = items.reduce((a, i) => a + i.valor_comissao, 0)
          const todosAprovados = items.every(i => i.status !== 'rascunho')
          const todosPagos     = items.every(i => i.status === 'pago')

          return (
            <div key={chave} className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-slate-50 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-[#16255c] text-sm">{labelPeriodo(ini, fim)}</span>
                  <Badge variant="outline" className="text-xs">{items[0]?.metodo === 'markup' ? 'Markup' : 'Pontuação'}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-emerald-700">{brl(totalComissao)}</span>
                  {isSupervisor && !todosAprovados && (
                    <Button size="sm" variant="outline" disabled={atualizando !== null}
                      onClick={() => items.filter(i => i.status === 'rascunho').forEach(i => acao(i.id, 'aprovar'))}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Aprovar todos
                    </Button>
                  )}
                  {isSupervisor && todosAprovados && !todosPagos && (
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={atualizando !== null}
                      onClick={() => items.filter(i => i.status === 'aprovado').forEach(i => acao(i.id, 'pagar'))}>
                      <Banknote className="h-3.5 w-3.5 mr-1" /> Marcar pago
                    </Button>
                  )}
                  {todosPagos && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
                      <Banknote className="h-3 w-3" /> Pago
                    </Badge>
                  )}
                </div>
              </div>

              <div className="divide-y">
                {items.map(f => (
                  <div key={f.id} className="p-4 flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {statusIcon(f.status)}
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{f.usuario_nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {brl(f.valor_vendas)} em vendas
                          {f.metodo === 'markup' && ` · Markup ${brl(f.markup_gerado)}`}
                          {f.metodo === 'pontuacao' && ` · ${f.pontos_acumulados.toFixed(1)} pts`}
                          {f.percentual_atingimento > 0 && ` · ${pct(f.percentual_atingimento)} da meta`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-700">{brl(f.valor_comissao)}</p>
                        {f.percentual_comissao > 0 && (
                          <p className="text-xs text-muted-foreground">{f.percentual_comissao}% sobre markup</p>
                        )}
                      </div>
                      {statusBadge(f.status)}
                      {isSupervisor && f.status === 'rascunho' && (
                        <Button size="sm" variant="outline" disabled={atualizando === f.id}
                          onClick={() => acao(f.id, 'aprovar')}>
                          {atualizando === f.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Aprovar'}
                        </Button>
                      )}
                      {isSupervisor && f.status === 'aprovado' && (
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={atualizando === f.id}
                          onClick={() => acao(f.id, 'pagar')}>
                          {atualizando === f.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Pagar'}
                        </Button>
                      )}
                    </div>

                    {f.observacoes && (
                      <p className="w-full text-xs text-muted-foreground italic pl-6">{f.observacoes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface ComissoesTabProps {
  lojaId: string
  isGerente: boolean
  isSupervisor: boolean
}

export function ComissoesTab({ lojaId, isGerente, isSupervisor }: ComissoesTabProps) {
  const [tab, setTab] = useState('fechar')
  const [configKey, setConfigKey] = useState(0)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#16255c]">Comissões</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Fechamento e histórico de comissões da equipe</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="fechar">
            <DollarSign className="h-3.5 w-3.5 mr-1.5" /> Fechar Período
          </TabsTrigger>
          <TabsTrigger value="historico">
            <History className="h-3.5 w-3.5 mr-1.5" /> Histórico
          </TabsTrigger>
          {isGerente && (
            <TabsTrigger value="configuracoes">
              <Settings className="h-3.5 w-3.5 mr-1.5" /> Configurações
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="fechar" className="mt-5">
          <FecharPeriodo lojaId={lojaId} />
        </TabsContent>

        <TabsContent value="historico" className="mt-5">
          <Historico lojaId={lojaId} isSupervisor={isSupervisor} />
        </TabsContent>

        {isGerente && (
          <TabsContent value="configuracoes" className="mt-5">
            <ConfiguracaoComissao
              key={configKey}
              lojaId={lojaId}
              onSaved={() => setConfigKey(k => k + 1)}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
