'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  RefreshCw,
  Plus,
  WifiOff,
} from 'lucide-react'
import { toast } from 'sonner'

type ConnectionState = 'not_configured' | 'open' | 'close' | 'connecting' | 'error' | 'unknown'

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
  evolution_api_key: string | null
}

export function WhatsAppConfig({ lojaId, isAdmin = false, siteUrl }: WhatsAppConfigProps) {
  const [config, setConfig] = useState<ConfigData>({ instance: null, api_key: null, configured: false })
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({ evolution_api_url: null, evolution_api_key: null })
  const [evolutionUrl, setEvolutionUrl] = useState('')
  const [evolutionApiKey, setEvolutionApiKey] = useState('')
  const [connectionState, setConnectionState] = useState<ConnectionState>('not_configured')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [savingGlobal, setSavingGlobal] = useState(false)
  const [loadingQr, setLoadingQr] = useState(false)
  const [showWebhookInfo, setShowWebhookInfo] = useState(false)
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const webhookUrl = siteUrl
    ? `${siteUrl}/api/whatsapp/evolution/webhook`
    : '/api/whatsapp/evolution/webhook'

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const fetchQrCode = useCallback(async () => {
    setLoadingQr(true)
    try {
      const res = await fetch(`/api/lojas/${lojaId}/whatsapp/qrcode`)
      const data = await res.json()
      if (res.ok && data.base64) setQrCode(data.base64)
    } finally {
      setLoadingQr(false)
    }
  }, [lojaId])

  const checkStatus = useCallback(async (): Promise<ConnectionState> => {
    try {
      const res = await fetch(`/api/lojas/${lojaId}/whatsapp/status`)
      const data = await res.json()
      const state: ConnectionState = data.state ?? 'unknown'
      setConnectionState(state)
      if (state === 'open') {
        stopPolling()
        setQrCode(null)
        setConfig(prev => ({ ...prev, configured: true }))
        toast.success('WhatsApp conectado!')
      }
      return state
    } catch {
      return 'error'
    }
  }, [lojaId, stopPolling])

  const startPolling = useCallback(() => {
    stopPolling()
    pollRef.current = setInterval(() => { checkStatus() }, 5000)
  }, [checkStatus, stopPolling])

  const fetchConfig = useCallback(async () => {
    try {
      const [configRes, settingsRes] = await Promise.all([
        fetch(`/api/lojas/${lojaId}/whatsapp`),
        isAdmin ? fetch('/api/whatsapp/settings') : Promise.resolve(null),
      ])

      if (configRes.ok) {
        const data = await configRes.json()
        setConfig(data)

        if (data.instance) {
          const statusRes = await fetch(`/api/lojas/${lojaId}/whatsapp/status`)
          const statusData = await statusRes.json()
          const state: ConnectionState = statusData.state ?? 'unknown'
          setConnectionState(state)

          if (state !== 'open') {
            await fetchQrCode()
            startPolling()
          }
        }
      }

      if (settingsRes?.ok) {
        const data = await settingsRes.json()
        setGlobalSettings(data)
        setEvolutionUrl(data.evolution_api_url ?? '')
      }
    } finally {
      setLoading(false)
    }
  }, [lojaId, isAdmin, fetchQrCode, startPolling])

  useEffect(() => {
    fetchConfig()
    return () => stopPolling()
  }, [fetchConfig, stopPolling])

  const handleCreateInstance = async () => {
    setCreating(true)
    try {
      const res = await fetch(`/api/lojas/${lojaId}/whatsapp/create`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.mensagem ?? 'Erro ao criar instância.')
        return
      }

      setConfig(prev => ({ ...prev, instance: data.instance }))
      setConnectionState('connecting')

      if (data.qrcode) {
        setQrCode(data.qrcode)
      } else {
        await fetchQrCode()
      }
      startPolling()
      toast.success(`Instância ${data.instance} ${data.already_exists ? 'já existe' : 'criada'}!`)
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setCreating(false)
    }
  }

  const handleReconnect = async () => {
    setConnectionState('connecting')
    await fetchQrCode()
    startPolling()
  }

  const handleSaveGlobal = async () => {
    setSavingGlobal(true)
    try {
      const payload: Record<string, string> = { evolution_api_url: evolutionUrl.trim() }
      if (evolutionApiKey.trim()) payload.evolution_api_key = evolutionApiKey.trim()

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

      toast.success('Configurações globais salvas!')
      setEvolutionApiKey('')
      setGlobalSettings(prev => ({ ...prev, evolution_api_url: evolutionUrl.trim() }))
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

  const isConnected = connectionState === 'open'
  const hasInstance = !!config.instance

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
          {isAdmin
            ? 'Gerencie a instância Evolution API desta unidade.'
            : 'Escaneie o QR Code para conectar o WhatsApp desta unidade.'}
        </p>
      </CardHeader>

      <CardContent className="space-y-5">

        {/* Status badge */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Conectado — {config.instance}
            </span>
          ) : hasInstance ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              Aguardando conexão — {config.instance}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
              Não configurado
            </span>
          )}
        </div>

        {/* Admin: configurações globais */}
        {isAdmin && (
          <div className="rounded-xl bg-white shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Settings className="h-4 w-4 text-[#16255c]" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Configurações Globais do Servidor
              </span>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">URL do servidor</Label>
              <Input
                value={evolutionUrl}
                onChange={(e) => setEvolutionUrl(e.target.value)}
                placeholder="https://evolution.seudominio.com.br"
                className="text-sm font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                API Key global{globalSettings.evolution_api_key ? ' (configurada)' : ''}
              </Label>
              <Input
                type="password"
                value={evolutionApiKey}
                onChange={(e) => setEvolutionApiKey(e.target.value)}
                placeholder={globalSettings.evolution_api_key ? '••••••••  (deixe vazio para manter)' : 'Cole a API Key global aqui'}
                className="text-sm font-mono"
              />
            </div>
            <Button
              onClick={handleSaveGlobal}
              disabled={savingGlobal}
              size="sm"
              className="bg-[#16255c] hover:bg-[#1a2f75] text-white"
            >
              {savingGlobal
                ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                : <Save className="h-3.5 w-3.5 mr-1.5" />}
              Salvar
            </Button>
          </div>
        )}

        {/* Admin: gerenciamento da instância */}
        {isAdmin && (
          <div className="rounded-xl bg-white shadow-sm p-4">
            {!hasInstance ? (
              <div className="text-center space-y-3 py-2">
                <p className="text-sm text-slate-500">
                  Nenhuma instância criada para esta unidade ainda.
                </p>
                <Button
                  onClick={handleCreateInstance}
                  disabled={creating}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  {creating
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Criando…</>
                    : <><Plus className="h-4 w-4 mr-2" />Criar Instância</>}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Instância</p>
                  <code className="text-sm font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {config.instance}
                  </code>
                </div>
                {isConnected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReconnect}
                    className="text-amber-600 border-amber-300 shrink-0"
                  >
                    <WifiOff className="h-3.5 w-3.5 mr-1.5" />
                    Reconectar
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReconnect}
                    disabled={loadingQr}
                    className="shrink-0"
                  >
                    {loadingQr
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                    Atualizar QR
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* QR Code — exibido para admin e usuário loja enquanto não conectado */}
        {hasInstance && !isConnected && (
          <div className="rounded-xl bg-white shadow-sm p-5 text-center space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">Conecte o WhatsApp</p>
              <p className="text-xs text-slate-400 mt-1">
                Abra o WhatsApp → Aparelhos conectados → Conectar aparelho
              </p>
            </div>
            {loadingQr ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
              </div>
            ) : qrCode ? (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCode}
                  alt="QR Code WhatsApp"
                  className="w-52 h-52 rounded-xl border shadow-sm"
                />
              </div>
            ) : (
              <p className="py-6 text-sm text-slate-400">QR Code não disponível — clique em Atualizar QR.</p>
            )}
            <p className="text-xs text-slate-400">O QR Code expira em ~30 segundos. Atualize se necessário.</p>
          </div>
        )}

        {/* Usuário loja sem instância configurada */}
        {!isAdmin && !hasInstance && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center space-y-1">
            <p className="text-sm font-semibold text-amber-700">Instância não configurada</p>
            <p className="text-xs text-amber-600">
              Aguarde o administrador criar a instância WhatsApp para esta unidade.
            </p>
          </div>
        )}

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
              : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          {showWebhookInfo && (
            <div className="border-t px-4 py-4 space-y-3">
              <p className="text-xs text-slate-500">
                {isAdmin
                  ? 'Configurada automaticamente ao criar a instância:'
                  : 'URL de webhook do servidor:'}
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
                    : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                </Button>
              </div>
              <p className="text-xs text-slate-400">
                Eventos: <code className="bg-slate-100 px-1 rounded">MESSAGES_UPSERT</code>{' '}
                <code className="bg-slate-100 px-1 rounded">MESSAGES_UPDATE</code>{' '}
                <code className="bg-slate-100 px-1 rounded">CONNECTION_UPDATE</code>
              </p>
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  )
}
