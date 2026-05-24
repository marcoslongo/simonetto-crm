'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, Save, Server } from 'lucide-react'
import { toast } from 'sonner'

export function EvolutionServerSettings() {
  const [url, setUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [hasKey, setHasKey] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/whatsapp/settings')
      .then(r => r.json())
      .then(data => {
        setUrl(data.evolution_api_url ?? '')
        setHasKey(!!data.evolution_api_key)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: Record<string, string> = { evolution_api_url: url.trim() }
      if (apiKey.trim()) payload.evolution_api_key = apiKey.trim()

      const res = await fetch('/api/whatsapp/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.mensagem ?? 'Erro ao salvar.')
        return
      }

      toast.success('Configurações do servidor salvas!')
      if (apiKey.trim()) {
        setApiKey('')
        setHasKey(true)
      }
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border shadow-sm bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#16255c] shadow-sm">
          <Server className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold">Servidor Evolution API</p>
          <p className="text-xs text-muted-foreground">Configurações globais do servidor WhatsApp</p>
        </div>
      </div>

      <div className="px-6 py-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                URL do servidor
              </Label>
              <Input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://evolution.seudominio.com.br"
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                API Key global{hasKey ? ' (configurada)' : ''}
              </Label>
              <Input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={hasKey ? '••••••••  (deixe vazio para manter)' : 'Cole a API Key aqui'}
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-400">
                Chave de admin do servidor Evolution Go — necessária para criar instâncias.
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="bg-[#16255c] hover:bg-[#1a2f75] text-white"
            >
              {saving
                ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                : <Save className="h-3.5 w-3.5 mr-1.5" />}
              Salvar
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
