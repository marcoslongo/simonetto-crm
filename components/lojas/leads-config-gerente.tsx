'use client'

import { useState, useEffect } from 'react'
import { EyeOff, Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface Props {
  lojaId: string
}

export function LeadsConfigGerente({ lojaId }: Props) {
  const [ocultar, setOcultar] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/lojas/${lojaId}/leads-config`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (d.success) setOcultar(d.ocultar_leads_nao_atribuidos) })
      .finally(() => setLoading(false))
  }, [lojaId])

  async function toggle(value: boolean) {
    setSaving(true)
    try {
      const res = await fetch(`/api/lojas/${lojaId}/leads-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ocultar_leads_nao_atribuidos: value }),
      })
      const data = await res.json()
      if (data.success) {
        setOcultar(value)
        toast.success(
          value
            ? 'Leads ocultos para usuários sem atribuição.'
            : 'Todos os leads visíveis para a equipe.'
        )
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
          <EyeOff className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold">Visibilidade de leads</p>
          <p className="text-xs text-muted-foreground">Controle o que a equipe pode ver</p>
        </div>
      </div>

      <div className="px-6 py-6 space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="ocultar-leads-toggle" className="text-sm font-medium">
                  Ocultar leads não atribuídos
                </Label>
                <p className="text-xs text-muted-foreground">
                  Quando ativado, usuários sem cargo de gerente visualizam apenas os leads
                  atribuídos a eles. Gerentes continuam vendo todos os leads.
                </p>
              </div>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0 text-muted-foreground" />
              ) : (
                <Switch
                  id="ocultar-leads-toggle"
                  checked={ocultar}
                  onCheckedChange={toggle}
                />
              )}
            </div>

            {ocultar && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
                <EyeOff className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                <span>
                  Ativo — atendentes só verão os leads atribuídos a eles. Leads sem responsável
                  ficam invisíveis para usuários comuns.
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
