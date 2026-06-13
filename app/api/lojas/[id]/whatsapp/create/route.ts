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

const SUBSCRIBE_EVENTS = ['MESSAGE', 'SEND_MESSAGE', 'CONNECTION', 'QRCODE']

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
  const webhookUrl = SITE_URL ? `${SITE_URL}/api/whatsapp/evolution/webhook` : null
  const instanceToken = crypto.randomUUID()
  const instanceUUID = crypto.randomUUID()

  const createRes = await fetch(`${evolutionUrl}/instance/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: settings.evolution_api_key,
    },
    body: JSON.stringify({ name: instanceName, instanceId: instanceUUID, token: instanceToken }),
  })

  const createData = await createRes.json()

  if (!createRes.ok) {
    // Instance already exists — return success so frontend can show QR code
    if (createRes.status === 409 || String(createData?.message ?? '').toLowerCase().includes('exists')) {
      return NextResponse.json({ success: true, instance: instanceName, already_exists: true })
    }
    const mensagem = createRes.status === 401
      ? 'A chave de API global do Evolution está incorreta. Verifique as Configurações do servidor Evolution.'
      : createData?.message ?? 'Erro ao criar instância na Evolution API.'
    return NextResponse.json({ success: false, mensagem }, { status: 400 })
  }

  const createdToken: string = (createData?.data?.token as string) ?? instanceToken

  // Conecta e configura webhook + eventos corretos
  const connectBody: Record<string, unknown> = {
    immediate: false,
    subscribe: SUBSCRIBE_EVENTS,
  }
  if (webhookUrl) connectBody.webhookUrl = webhookUrl

  await fetch(`${evolutionUrl}/instance/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: createdToken },
    body: JSON.stringify(connectBody),
  }).catch(() => {})

  // Persist instance name and API key in WordPress
  await fetch(`${WP_API_BASE}/lojas/${id}/whatsapp-config`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ instance: instanceName, api_key: createdToken }),
  })

  return NextResponse.json({
    success: true,
    instance: instanceName,
    qrcode: createData?.qrcode?.base64 ?? null,
  })
}
