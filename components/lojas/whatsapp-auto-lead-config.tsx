'use client'

import { useState, useEffect } from 'react'
import { FaWhatsapp } from 'react-icons/fa'
import { UserPlus, Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function WhatsAppAutoLeadConfig() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/usuarios/me/whatsapp-auto-lead', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (d.success) setEnabled(d.enabled) })
      .finally(() => setLoading(false))
  }, [])

  async function toggle(value: boolean) {
    setSaving(true)
    try {
      const res = await fetch('/api/usuarios/me/whatsapp-auto-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: value }),
      })
      const data = await res.json()
      if (data.success) {
        setEnabled(value)
        toast.success(value ? 'Auto-lead ativado.' : 'Auto-lead desativado.')
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
          <UserPlus className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold">Auto-lead WhatsApp</p>
          <p className="text-xs text-muted-foreground">Converte novos contatos em leads automaticamente</p>
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
                <Label htmlFor="auto-lead-toggle" className="text-sm font-medium">
                  Criar lead para novos contatos
                </Label>
                <p className="text-xs text-muted-foreground">
                  Quando ativado, qualquer pessoa que enviar uma mensagem pelo WhatsApp e ainda não for
                  um lead será cadastrada automaticamente com status <strong>Não atendido</strong>.
                </p>
              </div>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0 text-muted-foreground" />
              ) : (
                <Switch
                  id="auto-lead-toggle"
                  checked={enabled}
                  onCheckedChange={toggle}
                />
              )}
            </div>

            {enabled && (
              <div className="flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-800">
                <FaWhatsapp className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
                <span>
                  Ativo — novos contatos no WhatsApp serão cadastrados como leads com o nome do WhatsApp
                  e seu número de telefone.
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
