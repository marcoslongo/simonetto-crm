'use client'

import { useState, useEffect } from 'react'
import { FaWhatsapp } from 'react-icons/fa'
import { UserPlus, Loader2, ShieldX, X } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface BlockedContact {
  phone: string
  nome: string
  bloqueado_em: string
}

export function WhatsAppAutoLeadConfig() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [blocklist, setBlocklist] = useState<BlockedContact[]>([])
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/usuarios/me/whatsapp-auto-lead', { cache: 'no-store' }).then(r => r.json()),
      fetch('/api/usuarios/me/whatsapp-blocklist', { cache: 'no-store' }).then(r => r.json()),
    ]).then(([autoLead, bl]) => {
      if (autoLead.success) setEnabled(autoLead.enabled)
      if (bl.success) setBlocklist(bl.blocklist ?? [])
    }).finally(() => setLoading(false))
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

  async function removeFromBlocklist(phone: string) {
    setRemoving(phone)
    try {
      const res = await fetch('/api/usuarios/me/whatsapp-blocklist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (data.success) {
        setBlocklist(data.blocklist ?? [])
        toast.success('Contato removido da lista.')
      } else {
        toast.error('Erro ao remover contato.')
      }
    } catch {
      toast.error('Erro ao remover contato.')
    } finally {
      setRemoving(null)
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

            {/* Contatos ignorados (blocklist) */}
            <div className="pt-2 border-t space-y-3">
              <div className="flex items-center gap-2">
                <ShieldX className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Contatos ignorados</p>
                {blocklist.length > 0 && (
                  <span className="ml-auto text-[11px] font-medium bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                    {blocklist.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Mensagens desses contatos não criam nem atualizam leads. Para adicionar um contato à lista, abra o atendimento do lead e clique em <strong>Não é lead</strong>.
              </p>

              {blocklist.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhum contato ignorado.</p>
              ) : (
                <ul className="space-y-1.5">
                  {blocklist.map(entry => (
                    <li
                      key={entry.phone}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{entry.nome}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{entry.phone}</p>
                      </div>
                      <button
                        onClick={() => removeFromBlocklist(entry.phone)}
                        disabled={removing === entry.phone}
                        className="shrink-0 p-1 rounded hover:bg-slate-200 text-muted-foreground hover:text-destructive transition-colors"
                        title="Remover da lista"
                      >
                        {removing === entry.phone
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <X className="h-3.5 w-3.5" />
                        }
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
