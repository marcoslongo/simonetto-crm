import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'

const WP_API_BASE = process.env.NEXT_PUBLIC_API_URL

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth_token')?.value ?? null
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
  if (!settings?.evolution_api_url) {
    return NextResponse.json({ success: false, mensagem: 'Servidor Evolution não configurado.' }, { status: 400 })
  }

  const evolutionUrl = settings.evolution_api_url.replace(/\/$/, '')
  // Usa a chave da instância do usuário — a chave global não autentica operações de instância
  const apiKey = config.api_key ?? settings.evolution_api_key
  const targetUrl = `${evolutionUrl}/instance/connect/${config.instance}`

  try {
    const qrRes = await fetch(targetUrl, {
      headers: { apikey: apiKey },
      cache: 'no-store',
    })
    const rawText = await qrRes.text()
    let qrData: Record<string, unknown> = {}
    try { qrData = JSON.parse(rawText) } catch { /* non-JSON response */ }

    if (!qrRes.ok) {
      console.error('[usuarios/me/whatsapp/qrcode] Evolution error:', qrRes.status, rawText)
      return NextResponse.json({
        success: false,
        mensagem: (qrData?.message as string) ?? `Evolution API retornou ${qrRes.status}: ${rawText}`,
      }, { status: 400 })
    }

    return NextResponse.json({ success: true, base64: qrData?.base64 ?? null })
  } catch (err) {
    console.error('[usuarios/me/whatsapp/qrcode] fetch error:', targetUrl, err)
    return NextResponse.json({
      success: false,
      mensagem: `Não foi possível conectar ao servidor Evolution: ${evolutionUrl}`,
    }, { status: 500 })
  }
}
