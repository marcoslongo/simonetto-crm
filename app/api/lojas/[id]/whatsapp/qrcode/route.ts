import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'

const WP_API_BASE = process.env.NEXT_PUBLIC_API_URL

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth_token')?.value ?? null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const { id } = await params
  const token = await getAuthToken()

  const [configRes, settingsRes] = await Promise.all([
    fetch(`${WP_API_BASE}/lojas/${id}/whatsapp-config`, {
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
    return NextResponse.json({ success: false, mensagem: 'Instância não configurada para esta loja.' }, { status: 400 })
  }
  if (!settings?.evolution_api_url) {
    return NextResponse.json({ success: false, mensagem: 'URL do servidor Evolution API não configurada.' }, { status: 400 })
  }

  const evolutionUrl = settings.evolution_api_url.replace(/\/$/, '')
  // A WP GET endpoint retorna api_key mascarada (•••xxxx) — usa sempre a global key para chamadas server-side
  const apiKey = settings.evolution_api_key

  if (!apiKey) {
    return NextResponse.json({ success: false, mensagem: 'API Key global não configurada (configure em Configurações Globais).' }, { status: 400 })
  }

  const targetUrl = `${evolutionUrl}/instance/connect/${config.instance}`

  try {
    const qrRes = await fetch(targetUrl, {
      headers: { apikey: apiKey },
      cache: 'no-store',
    })
    const qrData = await qrRes.json()

    if (!qrRes.ok) {
      console.error('[qrcode] Evolution API error:', qrRes.status, JSON.stringify(qrData))
      return NextResponse.json({
        success: false,
        mensagem: qrData?.message ?? `Evolution API retornou ${qrRes.status}`,
      }, { status: 400 })
    }

    return NextResponse.json({ success: true, base64: qrData?.base64 ?? null })
  } catch (err) {
    console.error('[qrcode] fetch error:', targetUrl, err)
    return NextResponse.json({
      success: false,
      mensagem: `Não foi possível conectar ao servidor Evolution: ${evolutionUrl}`,
    }, { status: 500 })
  }
}
