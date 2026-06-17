'use client'

import { useState, useEffect } from 'react'
import { EyeOff, Loader2, UserCheck, FilePen } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface Props {
  lojaId: string
}

export function LeadsConfigGerente({ lojaId }: Props) {
  const [ocultar, setOcultar] = useState(false)
  const [autoAtribuir, setAutoAtribuir] = useState(true)
  const [permitirEdicao, setPermitirEdicao] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingAuto, setSavingAuto] = useState(false)
  const [savingEdicao, setSavingEdicao] = useState(false)

  useEffect(() => {
    fetch(`/api/lojas/${lojaId}/leads-config`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setOcultar(d.ocultar_leads_nao_atribuidos)
          setAutoAtribuir(d.auto_atribuir_responsavel ?? true)
          setPermitirEdicao(d.permitir_edicao_lead_atendente ?? false)
        }
      })
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

  async function toggleAutoAtribuir(value: boolean) {
    setSavingAuto(true)
    try {
      const res = await fetch(`/api/lojas/${lojaId}/leads-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto_atribuir_responsavel: value }),
      })
      const data = await res.json()
      if (data.success) {
        setAutoAtribuir(value)
        toast.success(
          value
            ? 'Atribuição automática ativada ao mover leads.'
            : 'Atribuição automática desativada.'
        )
      } else {
        toast.error('Erro ao salvar configuração.')
      }
    } catch {
      toast.error('Erro ao salvar configuração.')
    } finally {
      setSavingAuto(false)
    }
  }

  async function togglePermitirEdicao(value: boolean) {
    setSavingEdicao(true)
    try {
      const res = await fetch(`/api/lojas/${lojaId}/leads-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permitir_edicao_lead_atendente: value }),
      })
      const data = await res.json()
      if (data.success) {
        setPermitirEdicao(value)
        toast.success(
          value
            ? 'Atendentes podem editar dados dos leads.'
            : 'Edição de leads restrita a gerentes.'
        )
      } else {
        toast.error('Erro ao salvar configuração.')
      }
    } catch {
      toast.error('Erro ao salvar configuração.')
    } finally {
      setSavingEdicao(false)
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

            <div className="border-t pt-4 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="auto-atribuir-toggle" className="text-sm font-medium">
                    Atribuição automática ao mover lead
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Quando ativado, ao mover um lead no kanban ele é automaticamente
                  atribuído ao usuário que realizou a movimentação.
                </p>
              </div>
              {savingAuto ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0 text-muted-foreground" />
              ) : (
                <Switch
                  id="auto-atribuir-toggle"
                  checked={autoAtribuir}
                  onCheckedChange={toggleAutoAtribuir}
                />
              )}
            </div>

            <div className="border-t pt-4 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FilePen className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="permitir-edicao-toggle" className="text-sm font-medium">
                    Permitir edição de dados pelo atendente
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Quando ativado, atendentes podem editar os dados dos leads (nome, telefone,
                  e-mail, cidade e estado). Gerentes sempre podem editar.
                </p>
              </div>
              {savingEdicao ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0 text-muted-foreground" />
              ) : (
                <Switch
                  id="permitir-edicao-toggle"
                  checked={permitirEdicao}
                  onCheckedChange={togglePermitirEdicao}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
