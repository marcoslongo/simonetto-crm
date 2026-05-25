import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'

const WP_API_BASE = process.env.NEXT_PUBLIC_API_URL
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth_token')?.value ?? null
}

function parseJson(text: string): Record<string, unknown> {
  try { return JSON.parse(text) } catch { return {} }
}

function extractQr(data: Record<string, unknown>): string | null {
  const d = (data?.data as Record<string, unknown>) ?? {}
  return (d?.Qrcode as string) ?? (d?.qrcode as string)
    ?? (data?.Qrcode as string) ?? (data?.qrcode as string) ?? null
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const token = await getAuthToken()

  const [configRes, settingsRes] = await Promise.all([
    fetch(`${WP_API_BASE}/usuarios/me/whatsapp-config`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }),
    fetch(`${WP_API_BASE}/settings/whatsapp`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }),
  ])

  const config = configRes.ok ? await configRes.json() : null
  const settings = settingsRes.ok ? await settingsRes.json() : null

  if (!config?.instance) {
    return NextResponse.json({ success: false, mensagem: 'Instância não configurada.' }, { status: 400 })
  }
  if (!settings?.evolution_api_url || !settings?.evolution_api_key) {
    return NextResponse.json({ success: false, mensagem: 'Servidor Evolution não configurado.' }, { status: 400 })
  }

  const evolutionUrl = settings.evolution_api_url.replace(/\/$/, '')
  const globalKey = settings.evolution_api_key as string
  const instanceName = config.instance as string
  const webhookUrl = SITE_URL ? `${SITE_URL}/api/whatsapp/evolution/webhook` : null

  // Busca o token real da instância no Evolution GO (globalKey → /instance/all → match por nome)
  let instanceToken: string | null = null
  try {
    const allRes = await fetch(`${evolutionUrl}/instance/all`, {
      headers: { apikey: globalKey },
      cache: 'no-store',
    })
    if (allRes.ok) {
      const allData = await allRes.json()
      const found = (allData?.data ?? []).find(
        (i: { name: string; token: string }) => i.name === instanceName
      )
      instanceToken = found?.token ?? null
    }
  } catch (err) {
    console.error('[usuarios/me/qrcode] /instance/all error:', err)
  }

  if (!instanceToken) {
    return NextResponse.json({
      success: false,
      mensagem: 'Instância não encontrada no servidor Evolution. Solicite ao administrador que reconfigure.',
    }, { status: 400 })
  }

  try {
    // Inicia (ou re-inicia) sessão de conexão para gerar QR fresco
    const connectBody: Record<string, unknown> = { immediate: false }
    if (webhookUrl) connectBody.webhookUrl = webhookUrl

    const connectRes = await fetch(`${evolutionUrl}/instance/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: instanceToken },
      body: JSON.stringify(connectBody),
      cache: 'no-store',
    })

    const connectText = await connectRes.text()
    console.log('[usuarios/me/qrcode] connect status=%d body=%s', connectRes.status, connectText)

    const connectData = parseJson(connectText)
    const qrFromConnect = extractQr(connectData)
    if (qrFromConnect) {
      return NextResponse.json({ success: true, base64: qrFromConnect })
    }

    // Fallback: GET /instance/qr
    const qrRes = await fetch(`${evolutionUrl}/instance/qr`, {
      headers: { apikey: instanceToken },
      cache: 'no-store',
    })

    const qrText = await qrRes.text()
    const qrData = parseJson(qrText)

    if (!qrRes.ok) {
      console.error('[usuarios/me/qrcode] GET /instance/qr error:', qrRes.status, qrText)
      return NextResponse.json({
        success: false,
        mensagem: (qrData?.message as string) ?? `Evolution retornou ${qrRes.status}`,
      }, { status: 400 })
    }

    const base64 = extractQr(qrData)
    return NextResponse.json({ success: true, base64 })
  } catch (err) {
    console.error('[usuarios/me/qrcode] fetch error:', evolutionUrl, err)
    return NextResponse.json({
      success: false,
      mensagem: 'Não foi possível conectar ao servidor Evolution.',
    }, { status: 500 })
  }
}
