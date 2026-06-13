'use client'

import { useState, useEffect } from 'react'
import { Loader2, ShoppingBag, ToggleLeft, ClipboardList } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { VendasRealizadasConfig, VendasRealizadasCampos, VENDAS_CONFIG_PADRAO } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  lojaId: string
}

const CAMPOS_CONFIG: { key: keyof VendasRealizadasCampos; label: string; descricao: string }[] = [
  { key: 'valor',           label: 'Valor da venda',       descricao: 'Exibe campo de valor monetário da venda.' },
  { key: 'data_venda',      label: 'Data da venda',        descricao: 'Exibe campo para data em que a venda foi realizada.' },
  { key: 'forma_pagamento', label: 'Forma de pagamento',   descricao: 'Exibe seletor com as formas de pagamento aceitas.' },
  { key: 'numero_pedido',   label: 'Número do pedido',     descricao: 'Exibe campo para registrar o número do pedido interno.' },
  { key: 'nota_fiscal',     label: 'Nota fiscal',          descricao: 'Exibe campos para número, série, chave de acesso e link da NF.' },
  { key: 'observacoes',     label: 'Observações',          descricao: 'Exibe área de texto para observações internas sobre a venda.' },
]

export function VendasRealizadasConfigComp({ lojaId }: Props) {
  const [config, setConfig] = useState<VendasRealizadasConfig>(VENDAS_CONFIG_PADRAO)
  const [loading, setLoading] = useState(true)
  const [savingField, setSavingField] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/lojas/${lojaId}/vendas-config`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.config) {
          setConfig({
            ...VENDAS_CONFIG_PADRAO,
            ...d.config,
            campos: { ...VENDAS_CONFIG_PADRAO.campos, ...(d.config.campos ?? {}) },
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [lojaId])

  async function saveConfig(next: VendasRealizadasConfig, field: string) {
    setSavingField(field)
    try {
      const res = await fetch(`/api/lojas/${lojaId}/vendas-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: next }),
      })
      const data = await res.json()
      if (data.success) {
        setConfig(next)
      } else {
        toast.error('Erro ao salvar configuração.')
      }
    } catch {
      toast.error('Erro ao salvar configuração.')
    } finally {
      setSavingField(null)
    }
  }

  function toggleAtivo(value: boolean) {
    const next = { ...config, ativo: value }
    saveConfig(next, 'ativo').then(() => {
      toast.success(value ? 'Módulo de vendas ativado.' : 'Módulo de vendas desativado.')
    })
  }

  function toggleObrigatorio(value: boolean) {
    const next = { ...config, preenchimento_obrigatorio: value }
    saveConfig(next, 'obrigatorio').then(() => {
      toast.success(
        value
          ? 'Preenchimento obrigatório ativado.'
          : 'Preenchimento tornou-se opcional.'
      )
    })
  }

  function toggleCampo(campo: keyof VendasRealizadasCampos, value: boolean) {
    const next: VendasRealizadasConfig = {
      ...config,
      campos: { ...config.campos, [campo]: value },
    }
    saveConfig(next, campo).then(() => {
      const label = CAMPOS_CONFIG.find(c => c.key === campo)?.label ?? campo
      toast.success(value ? `Campo "${label}" ativado.` : `Campo "${label}" desativado.`)
    })
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm bg-linear-to-br from-slate-50 to-slate-100">
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
          <ShoppingBag className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold">Registro de vendas realizadas</p>
          <p className="text-xs text-muted-foreground">Configure o formulário de fechamento de venda</p>
        </div>
      </div>

      <div className="px-6 py-6 space-y-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        ) : (
          <>
            {/* Ativar módulo */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Ativar módulo de vendas</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Quando ativado, ao mover um lead para "Venda Realizada" um formulário de registro será exibido.
                </p>
              </div>
              {savingField === 'ativo' ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0 text-muted-foreground" />
              ) : (
                <Switch
                  checked={config.ativo}
                  onCheckedChange={toggleAtivo}
                />
              )}
            </div>

            {config.ativo && (
              <>
                <div className="border-t pt-5">
                  {/* Preenchimento obrigatório */}
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">Preenchimento obrigatório</Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Quando ativado, o usuário precisa preencher ao menos um campo antes de confirmar a venda.
                        Quando desativado, é possível confirmar sem preencher nada.
                      </p>
                    </div>
                    {savingField === 'obrigatorio' ? (
                      <Loader2 className="h-4 w-4 animate-spin shrink-0 text-muted-foreground" />
                    ) : (
                      <Switch
                        checked={config.preenchimento_obrigatorio}
                        onCheckedChange={toggleObrigatorio}
                      />
                    )}
                  </div>

                  {/* Campos visíveis */}
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Campos exibidos no formulário
                  </p>
                  <div className="space-y-3">
                    {CAMPOS_CONFIG.map(({ key, label, descricao }) => (
                      <div
                        key={key}
                        className={cn(
                          "flex items-start justify-between gap-4 rounded-lg border px-4 py-3 transition-colors",
                          config.campos[key] ? "border-emerald-200 bg-emerald-50/50" : "border-border bg-card"
                        )}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <p className={cn(
                            "text-sm font-medium",
                            config.campos[key] ? "text-emerald-800" : "text-foreground"
                          )}>
                            {label}
                          </p>
                          <p className="text-xs text-muted-foreground">{descricao}</p>
                        </div>
                        {savingField === key ? (
                          <Loader2 className="h-4 w-4 animate-spin shrink-0 mt-0.5 text-muted-foreground" />
                        ) : (
                          <Switch
                            checked={config.campos[key]}
                            onCheckedChange={v => toggleCampo(key, v)}
                            className="shrink-0 mt-0.5"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-800">
                  <ShoppingBag className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
                  <span>
                    Os campos desativados não aparecem para os usuários durante o fechamento da venda,
                    mas as informações registradas anteriormente são preservadas.
                  </span>
                </div>
              </>
            )}

            {!config.ativo && (
              <div className="flex items-start gap-2 rounded-lg bg-muted border px-4 py-3 text-xs text-muted-foreground">
                <ShoppingBag className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  Módulo desativado — leads podem ser movidos para "Venda Realizada" sem preencher
                  informações adicionais, como no comportamento padrão.
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
