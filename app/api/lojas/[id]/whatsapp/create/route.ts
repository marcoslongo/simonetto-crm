import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'

const WP_API_BASE = process.env.NEXT_PUBLIC_API_URL
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth_token')?.value ?? null
}

async function getEvolutionSettings(token: string | null) {
  const res = await fetch(`${WP_API_BASE}/settings/whatsapp`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  return res.json()
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  if (session.user.role !== 'administrator') {
    return NextResponse.json({ success: false, mensagem: 'Sem permissão.' }, { status: 403 })
  }

  const { id } = await params
  const token = await getAuthToken()

  const settings = await getEvolutionSettings(token)
  if (!settings?.evolution_api_url || !settings?.evolution_api_key) {
    return NextResponse.json({
      success: false,
      mensagem: 'Configure a URL e a API Key global da Evolution API antes de criar instâncias.',
    }, { status: 400 })
  }

  const instanceName = `loja-${id}`
  const evolutionUrl = settings.evolution_api_url.replace(/\/$/, '')
  const webhookUrl = SITE_URL
    ? `${SITE_URL}/api/whatsapp/evolution/webhook`
    : null

  const createBody: Record<string, unknown> = {
    instanceName,
    qrcode: true,
    integration: 'WHATSAPP-BAILEYS',
  }
  if (webhookUrl) {
    createBody.webhook = {
      url: webhookUrl,
      byEvents: true,
      base64: false,
      events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE'],
    }
  }

  const createRes = await fetch(`${evolutionUrl}/instance/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: settings.evolution_api_key,
    },
    body: JSON.stringify(createBody),
  })

  const createData = await createRes.json()

  if (!createRes.ok) {
    // Instance already exists — return success so frontend can show QR code
    if (createRes.status === 409 || String(createData?.message ?? '').toLowerCase().includes('exists')) {
      return NextResponse.json({ success: true, instance: instanceName, already_exists: true })
    }
    return NextResponse.json({
      success: false,
      mensagem: createData?.message ?? 'Erro ao criar instância na Evolution API.',
    }, { status: 400 })
  }

  const instanceApiKey: string | null =
    createData?.hash?.apikey ?? createData?.apikey ?? null

  // Persist instance name and API key in WordPress
  await fetch(`${WP_API_BASE}/lojas/${id}/whatsapp-config`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ instance: instanceName, api_key: instanceApiKey }),
  })

  return NextResponse.json({
    success: true,
    instance: instanceName,
    qrcode: createData?.qrcode?.base64 ?? null,
  })
}
