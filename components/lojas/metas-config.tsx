'use client'

import { useState, useEffect } from 'react'
import { Loader2, Target, ToggleLeft } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { MetasConfig, METAS_CONFIG_PADRAO } from '@/lib/types'

interface Props {
  lojaId: string
}

export function MetasConfigComp({ lojaId }: Props) {
  const [config, setConfig] = useState<MetasConfig>(METAS_CONFIG_PADRAO)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/lojas/${lojaId}/metas-config`)
      .then(r => r.json())
      .then(d => { if (d.success && d.config) setConfig({ ...METAS_CONFIG_PADRAO, ...d.config }) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [lojaId])

  async function toggleAtivo(value: boolean) {
    setSaving(true)
    const next = { ...config, ativo: value }
    try {
      const res = await fetch(`/api/lojas/${lojaId}/metas-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: next }),
      })
      const data = await res.json()
      if (data.success) {
        setConfig(next)
        toast.success(value ? 'Módulo de metas ativado.' : 'Módulo de metas desativado.')
      } else {
        toast.error('Erro ao salvar configuração.')
      }
    } catch {
      toast.error('Erro ao salvar configuração.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm bg-linear-to-br from-slate-50 to-slate-100">
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#16255c]">
          <Target className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold">Metas Comerciais</p>
          <p className="text-xs text-muted-foreground">Habilite o módulo de metas para sua equipe</p>
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
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Ativar módulo de metas</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Quando ativado, gerentes podem cadastrar metas individuais ou de equipe e acompanhar o desempenho em tempo real.
                </p>
              </div>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0 text-muted-foreground" />
              ) : (
                <Switch checked={config.ativo} onCheckedChange={toggleAtivo} />
              )}
            </div>

            <div className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-xs ${config.ativo ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-muted border-border text-muted-foreground'}`}>
              <Target className={`h-4 w-4 mt-0.5 shrink-0 ${config.ativo ? 'text-blue-600' : ''}`} />
              <span>
                {config.ativo
                  ? 'Módulo ativo — acesse "Metas Comerciais" no menu lateral para gerenciar as metas da equipe.'
                  : 'Módulo desativado — a seção de metas fica oculta para todos os usuários desta unidade.'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
