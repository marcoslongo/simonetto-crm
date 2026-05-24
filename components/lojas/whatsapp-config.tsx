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
  Plus,
  Save,
  Settings,
  Webhook,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  WifiOff,
} from 'lucide-react'
import { toast } from 'sonner'

type ConnectionState = 'not_configured' | 'open' | 'close' | 'connecting' | 'error' | 'unknown'

interface WhatsAppConfigProps {
  isAdmin?: boolean
  siteUrl?: string
}

interface GlobalSettings {
  evolution_api_url: string | null
  evolution_api_key: string | null
}

export function WhatsAppConfig({ isAdmin = false, siteUrl }: WhatsAppConfigProps) {
  const [instance, setInstance] = useState<string | null>(null)
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({ evolution_api_url: null, evolution_api_key: null })
  const [evolutionUrl, setEvolutionUrl] = useState('')
  const [evolutionApiKey, setEvolutionApiKey] = useState('')
  const [connectionState, setConnectionState] = useState<ConnectionState>('not_configured')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [createFailed, setCreateFailed] = useState(false)
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
      const res = await fetch('/api/usuarios/me/whatsapp/qrcode')
      const data = await res.json()
      if (res.ok && data.base64) {
        setQrCode(data.base64)
      } else {
        console.warn('[whatsapp] qrcode not available:', data)
      }
    } finally {
      setLoadingQr(false)
    }
  }, [])

  const checkStatus = useCallback(async (): Promise<ConnectionState> => {
    try {
      const res = await fetch('/api/usuarios/me/whatsapp/status')
      const data = await res.json()
      const state: ConnectionState = data.state ?? 'unknown'
      setConnectionState(state)
      if (state === 'open') {
        stopPolling()
        setQrCode(null)
        toast.success('WhatsApp conectado!')
      }
      return state
    } catch {
      return 'error'
    }
  }, [stopPolling])

  const startPolling = useCallback(() => {
    stopPolling()
    pollRef.current = setInterval(() => { checkStatus() }, 5000)
  }, [checkStatus, stopPolling])

  // Tenta criar instância (admin only — requer GLOBAL_API_KEY configurada)
  const handleCreateInstance = useCallback(async () => {
    setCreating(true)
    setCreateFailed(false)
    try {
      const res = await fetch('/api/usuarios/me/whatsapp/create', { method: 'POST' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setCreateFailed(true)
        toast.error(data.mensagem ?? 'Erro ao criar instância.')
        return
      }

      setInstance(data.instance)
      setConnectionState('connecting')
      await fetchQrCode()
      startPolling()
      toast.success('Instância criada!')
    } catch {
      setCreateFailed(true)
      toast.error('Erro de conexão ao servidor Evolution.')
    } finally {
      setCreating(false)
    }
  }, [fetchQrCode, startPolling])

  const fetchConfig = useCallback(async () => {
    try {
      const [configRes, settingsRes] = await Promise.all([
        fetch('/api/usuarios/me/whatsapp'),
        isAdmin ? fetch('/api/whatsapp/settings') : Promise.resolve(null),
      ])

      if (configRes.ok) {
        const data = await configRes.json()
        setInstance(data.instance ?? null)

        if (data.instance) {
          const statusRes = await fetch('/api/usuarios/me/whatsapp/status')
          const statusData = await statusRes.json()
          const state: ConnectionState = statusData.state ?? 'unknown'
          setConnectionState(state)

          if (state === 'close' || state === 'connecting') {
            await fetchQrCode()
            startPolling()
          }
        }
        // Sem instância: não tenta criar automaticamente — mostra estado "não configurado"
      }

      if (settingsRes?.ok) {
        const data = await settingsRes.json()
        setGlobalSettings(data)
        setEvolutionUrl(data.evolution_api_url ?? '')
      }
    } finally {
      setLoading(false)
    }
  }, [isAdmin, fetchQrCode, startPolling])

  useEffect(() => {
    fetchConfig()
    return () => stopPolling()
  }, [fetchConfig, stopPolling])

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
  const isDisconnected = connectionState === 'close' || connectionState === 'connecting'
  const showQr = !!instance && (isDisconnected || creating)

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-[#16255c] flex items-center gap-3">
          <div className="bg-emerald-500 p-2.5 rounded-xl shadow-md">
            <FaWhatsapp className="h-5 w-5 text-white" />
          </div>
          WhatsApp
        </CardTitle>
        <p className="text-sm text-slate-500 mt-1">
          {isAdmin
            ? 'Configure o servidor Evolution e gerencie conexões.'
            : 'Escaneie o QR Code para conectar seu WhatsApp.'}
        </p>
      </CardHeader>

      <CardContent className="space-y-5">

        {/* Status badge */}
        <div className="flex items-center justify-between gap-2">
          <div>
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Conectado
              </span>
            ) : isDisconnected || creating ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                {creating ? 'Preparando…' : 'Aguardando escaneamento'}
              </span>
            ) : instance ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                verificando status…
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                Não configurado
              </span>
            )}
          </div>

          {instance && (
            <Button
              variant="outline"
              size="sm"
              onClick={isConnected ? handleReconnect : handleReconnect}
              disabled={loadingQr || creating}
              className="shrink-0 text-xs"
            >
              {loadingQr
                ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                : isConnected
                  ? <><WifiOff className="h-3.5 w-3.5 mr-1.5" />Reconectar</>
                  : <><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Atualizar QR</>}
            </Button>
          )}
        </div>

        {/* Admin: configurações globais do servidor */}
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

        {/* Admin: criar instância quando não configurada */}
        {isAdmin && !instance && (
          <div className="rounded-xl bg-white shadow-sm p-4 text-center space-y-3">
            <p className="text-sm text-slate-500">Nenhuma instância configurada para este usuário.</p>
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
        )}

        {/* Usuário sem instância configurada */}
        {!isAdmin && !instance && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center space-y-1">
            <p className="text-sm font-semibold text-amber-700">WhatsApp não configurado</p>
            <p className="text-xs text-amber-600">
              Aguarde o administrador configurar sua instância WhatsApp.
            </p>
          </div>
        )}

        {/* QR Code — exibido quando aguardando escaneamento */}
        {showQr && (
          <div className="rounded-xl bg-white shadow-sm p-5 text-center space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">Conecte seu WhatsApp</p>
              <p className="text-xs text-slate-400 mt-1">
                Abra o WhatsApp → Aparelhos conectados → Conectar aparelho
              </p>
            </div>
            {loadingQr || creating ? (
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
              <div className="py-6 space-y-3">
                <p className="text-sm text-slate-400">QR Code não disponível no momento.</p>
                <Button variant="outline" size="sm" onClick={handleReconnect}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Tentar novamente
                </Button>
              </div>
            )}
            <p className="text-xs text-slate-400">O QR Code expira em ~30 segundos. Atualize se necessário.</p>
          </div>
        )}

        {/* Conectado — mensagem de sucesso */}
        {isConnected && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
            <p className="text-sm font-semibold text-emerald-700">WhatsApp conectado com sucesso!</p>
            <p className="text-xs text-emerald-600 mt-1">
              Você pode enviar e receber mensagens pelo CRM.
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
              <p className="text-xs text-slate-500">URL de webhook para o servidor Evolution:</p>
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
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  )
}
