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
  if (!settings?.evolution_api_url || !config?.api_key) {
    return NextResponse.json({ success: false, mensagem: 'Servidor Evolution não configurado.' }, { status: 400 })
  }

  const evolutionUrl = settings.evolution_api_url.replace(/\/$/, '')
  // A chave de autenticação para operações de instância é o token próprio da instância
  const instanceToken = config.api_key as string

  try {
    const qrRes = await fetch(`${evolutionUrl}/instance/qr`, {
      headers: { apikey: instanceToken },
      cache: 'no-store',
    })

    const rawText = await qrRes.text()
    let qrData: Record<string, unknown> = {}
    try { qrData = JSON.parse(rawText) } catch { /* non-JSON */ }

    if (!qrRes.ok) {
      console.error('[usuarios/me/qrcode] Evolution error:', qrRes.status, rawText)
      return NextResponse.json({
        success: false,
        mensagem: (qrData?.message as string) ?? `Evolution retornou ${qrRes.status}: ${rawText}`,
      }, { status: 400 })
    }

    // Evolution GO retorna: { data: { Qrcode: "data:image/png;base64,...", Code: "..." } }
    const d = (qrData?.data as Record<string, unknown>) ?? {}
    const base64 = (d?.Qrcode as string) ?? (d?.qrcode as string) ?? null

    return NextResponse.json({ success: true, base64 })
  } catch (err) {
    console.error('[usuarios/me/qrcode] fetch error:', evolutionUrl, err)
    return NextResponse.json({
      success: false,
      mensagem: `Não foi possível conectar ao servidor Evolution.`,
    }, { status: 500 })
  }
}
