'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FaWhatsapp } from 'react-icons/fa'
import {
  Check,
  Copy,
  Loader2,
  Save,
  Settings,
  Webhook,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'

interface WhatsAppConfigProps {
  lojaId: string
  isAdmin?: boolean
  siteUrl?: string
}

interface ConfigData {
  instance: string | null
  api_key: string | null
  configured: boolean
}

interface GlobalSettings {
  evolution_api_url: string | null
}

export function WhatsAppConfig({ lojaId, isAdmin = false, siteUrl }: WhatsAppConfigProps) {
  const [config, setConfig] = useState<ConfigData>({ instance: null, api_key: null, configured: false })
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({ evolution_api_url: null })
  const [instance, setInstance] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [evolutionUrl, setEvolutionUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingGlobal, setSavingGlobal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showWebhookInfo, setShowWebhookInfo] = useState(false)
  const [copiedWebhook, setCopiedWebhook] = useState(false)

  const webhookUrl = siteUrl
    ? `${siteUrl}/api/whatsapp/evolution/webhook`
    : '/api/whatsapp/evolution/webhook'

  const fetchConfig = useCallback(async () => {
    try {
      const [configRes, settingsRes] = await Promise.all([
        fetch(`/api/lojas/${lojaId}/whatsapp`),
        isAdmin ? fetch('/api/whatsapp/settings') : Promise.resolve(null),
      ])

      if (configRes.ok) {
        const data = await configRes.json()
        setConfig(data)
        setInstance(data.instance ?? '')
        setApiKey('')
      }

      if (settingsRes?.ok) {
        const data = await settingsRes.json()
        setGlobalSettings(data)
        setEvolutionUrl(data.evolution_api_url ?? '')
      }
    } finally {
      setLoading(false)
    }
  }, [lojaId, isAdmin])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleSave = async () => {
    if (!instance.trim()) {
      toast.error('O nome da instância é obrigatório.')
      return
    }

    setSaving(true)
    try {
      const payload: Record<string, string> = { instance: instance.trim() }
      if (apiKey.trim()) payload.api_key = apiKey.trim()

      const res = await fetch(`/api/lojas/${lojaId}/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.mensagem ?? 'Erro ao salvar.')
        return
      }

      toast.success('Configuração WhatsApp salva!')
      setApiKey('')
      setConfig(prev => ({ ...prev, instance: instance.trim(), configured: true }))
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveGlobal = async () => {
    setSavingGlobal(true)
    try {
      const res = await fetch('/api/whatsapp/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evolution_api_url: evolutionUrl.trim() }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.mensagem ?? 'Erro ao salvar.')
        return
      }

      toast.success('URL do servidor Evolution API salva!')
      setGlobalSettings({ evolution_api_url: evolutionUrl.trim() })
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setSavingGlobal(false)
    }
  }

  const copyWebhook = async () => {
    await navigator.clipboard.writeText(webhookUrl)
    setCopiedWebhook(true)
    setTimeout(() => setCopiedWebhook(false), 2000)
    toast.success('URL copiada!')
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-[#16255c] flex items-center gap-3">
          <div className="bg-emerald-500 p-2.5 rounded-xl shadow-md">
            <FaWhatsapp className="h-5 w-5 text-white" />
          </div>
          WhatsApp — Evolution API
        </CardTitle>
        <p className="text-sm text-slate-500 mt-1">
          Configure a instância Evolution API para enviar e receber mensagens via WhatsApp.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">

        {/* Status badge */}
        <div className="flex items-center gap-2">
          {config.configured ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Conectado — instância: {config.instance}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              Não configurado
            </span>
          )}
        </div>

        {/* Configurações globais (somente admin) */}
        {isAdmin && (
          <div className="rounded-xl bg-white shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Settings className="h-4 w-4 text-[#16255c]" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                URL do servidor Evolution API
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                value={evolutionUrl}
                onChange={(e) => setEvolutionUrl(e.target.value)}
                placeholder="https://evolution.seudominio.com.br"
                className="text-sm font-mono"
              />
              <Button
                onClick={handleSaveGlobal}
                disabled={savingGlobal}
                size="sm"
                className="bg-[#16255c] hover:bg-[#1a2f75] text-white shrink-0"
              >
                {savingGlobal ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              </Button>
            </div>
            {globalSettings.evolution_api_url && (
              <p className="text-xs text-slate-400">
                Servidor atual: <code className="bg-slate-100 px-1 rounded">{globalSettings.evolution_api_url}</code>
              </p>
            )}
          </div>
        )}

        {/* Configuração da loja */}
        <div className="rounded-xl bg-white shadow-sm p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="evolution-instance" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nome da Instância
            </Label>
            <Input
              id="evolution-instance"
              value={instance}
              onChange={(e) => setInstance(e.target.value)}
              placeholder="ex: loja-sp-01"
              className="text-sm font-mono"
            />
            <p className="text-xs text-slate-400">
              Nome exato da instância criada no painel da Evolution API.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evolution-apikey" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              API Key
            </Label>
            <Input
              id="evolution-apikey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={config.api_key ? `Atual: ${config.api_key} — deixe vazio para manter` : 'Cole a API key aqui'}
              className="text-sm font-mono"
            />
            <p className="text-xs text-slate-400">
              Chave de autenticação da instância. Deixe vazio para manter a chave atual.
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando…</>
            ) : (
              <><Save className="h-4 w-4 mr-2" /> Salvar configuração</>
            )}
          </Button>
        </div>

        {/* URL do webhook */}
        <div className="rounded-xl bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowWebhookInfo(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Webhook className="h-4 w-4 text-[#16255c]" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                URL do Webhook
              </span>
            </div>
            {showWebhookInfo
              ? <ChevronUp className="h-4 w-4 text-slate-400" />
              : <ChevronDown className="h-4 w-4 text-slate-400" />
            }
          </button>

          {showWebhookInfo && (
            <div className="border-t px-4 py-4 space-y-3">
              <p className="text-xs text-slate-500">
                Configure esta URL no painel da Evolution API para receber mensagens no CRM:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono text-[#16255c] bg-slate-50 px-3 py-2 rounded-lg border break-all">
                  {webhookUrl}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8"
                  onClick={copyWebhook}
                >
                  {copiedWebhook
                    ? <Check className="h-3.5 w-3.5 text-emerald-600" />
                    : <Copy className="h-3.5 w-3.5 text-slate-500" />
                  }
                </Button>
              </div>
              <p className="text-xs text-slate-400">
                Eventos necessários: <code className="bg-slate-100 px-1 rounded">messages.upsert</code> e{' '}
                <code className="bg-slate-100 px-1 rounded">messages.update</code>
              </p>
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  )
}
