'use client'

import { useState, useEffect } from 'react'
import { LayoutList, Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface KanbanCardCampos {
  telefone: boolean
  email: boolean
  cidade: boolean
  mensagem: boolean
  expectativa_investimento: boolean
}

const DEFAULTS: KanbanCardCampos = {
  telefone: true,
  email: true,
  cidade: true,
  mensagem: false,
  expectativa_investimento: true,
}

const CAMPOS_CONFIG = [
  {
    key: 'telefone' as const,
    label: 'Telefone',
    description: 'Exibe o número de telefone do lead no card.',
  },
  {
    key: 'email' as const,
    label: 'E-mail',
    description: 'Exibe o e-mail do lead no card.',
  },
  {
    key: 'cidade' as const,
    label: 'Cidade / Estado',
    description: 'Exibe a localização do lead no card.',
  },
  {
    key: 'mensagem' as const,
    label: 'Mensagem de solicitação',
    description: 'Exibe a mensagem enviada pelo lead no card (truncada).',
  },
  {
    key: 'expectativa_investimento' as const,
    label: 'Expectativa de investimento',
    description: 'Exibe o valor de investimento esperado pelo lead.',
  },
]

interface Props {
  lojaId: string
}

export function KanbanCardConfigComp({ lojaId }: Props) {
  const [campos, setCampos] = useState<KanbanCardCampos>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<keyof KanbanCardCampos | null>(null)

  useEffect(() => {
    fetch(`/api/lojas/${lojaId}/leads-config`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.kanban_card_campos) {
          setCampos({ ...DEFAULTS, ...d.kanban_card_campos })
        }
      })
      .finally(() => setLoading(false))
  }, [lojaId])

  async function toggle(key: keyof KanbanCardCampos, value: boolean) {
    setSaving(key)
    const next = { ...campos, [key]: value }
    try {
      const res = await fetch(`/api/lojas/${lojaId}/leads-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kanban_card_campos: next }),
      })
      const data = await res.json()
      if (data.success) {
        setCampos(next)
        toast.success('Configuração do card atualizada.')
      } else {
        toast.error('Erro ao salvar configuração.')
      }
    } catch {
      toast.error('Erro ao salvar configuração.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm bg-linear-to-br from-slate-50 to-slate-100">
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#16255c]">
          <LayoutList className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold">Campos do card Kanban</p>
          <p className="text-xs text-muted-foreground">Escolha quais informações aparecem nos cards de atendimento</p>
        </div>
      </div>

      <div className="px-6 py-6 space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        ) : (
          CAMPOS_CONFIG.map((campo, i) => (
            <div key={campo.key} className={`flex items-center justify-between gap-4${i > 0 ? ' border-t pt-4' : ''}`}>
              <div className="space-y-1">
                <Label htmlFor={`kanban-card-${campo.key}`} className="text-sm font-medium">
                  {campo.label}
                </Label>
                <p className="text-xs text-muted-foreground">{campo.description}</p>
              </div>
              {saving === campo.key ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0 text-muted-foreground" />
              ) : (
                <Switch
                  id={`kanban-card-${campo.key}`}
                  checked={campos[campo.key]}
                  onCheckedChange={v => toggle(campo.key, v)}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
