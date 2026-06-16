'use client'

import { useState, useEffect } from 'react'
import { Loader2, Wrench, ToggleLeft } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface Props {
  lojaId: string
}

export function PosVendaConfigComp({ lojaId }: Props) {
  const [ativo, setAtivo]   = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    fetch(`/api/lojas/${lojaId}/pos-venda-config`)
      .then(r => r.json())
      .then(d => { if (d.success && d.config) setAtivo(d.config.ativo === true) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [lojaId])

  async function toggleAtivo(value: boolean) {
    setSaving(true)
    try {
      const res = await fetch(`/api/lojas/${lojaId}/pos-venda-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { ativo: value } }),
      })
      const data = await res.json()
      if (data.success) {
        setAtivo(value)
        toast.success(value ? 'Módulo de Pós-Venda ativado.' : 'Módulo de Pós-Venda desativado.')
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
          <Wrench className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold">Pós-Venda</p>
          <p className="text-xs text-muted-foreground">Habilite o módulo de pós-venda para sua equipe</p>
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
                  <Label className="text-sm font-medium">Ativar módulo de pós-venda</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Quando ativado, a equipe pode acompanhar clientes após a venda com kanban de etapas, histórico e comunicação via WhatsApp.
                </p>
              </div>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0 text-muted-foreground" />
              ) : (
                <Switch checked={ativo} onCheckedChange={toggleAtivo} />
              )}
            </div>

            <div className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-xs ${ativo ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-muted border-border text-muted-foreground'}`}>
              <Wrench className={`h-4 w-4 mt-0.5 shrink-0 ${ativo ? 'text-blue-600' : ''}`} />
              <span>
                {ativo
                  ? 'Módulo ativo — acesse "Pós-Venda" no menu lateral para gerenciar o acompanhamento de clientes.'
                  : 'Módulo desativado — a seção de pós-venda fica oculta para todos os usuários desta unidade.'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
