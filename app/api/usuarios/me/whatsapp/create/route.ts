import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'

const WP_API_BASE = process.env.NEXT_PUBLIC_API_URL
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth_token')?.value ?? null
}

export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const token = await getAuthToken()

  // Busca configurações globais (URL + API key do servidor Evolution Go)
  const settingsRes = await fetch(`${WP_API_BASE}/settings/whatsapp`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const settings = settingsRes.ok ? await settingsRes.json() : null

  if (!settings?.evolution_api_url || !settings?.evolution_api_key) {
    return NextResponse.json({
      success: false,
      mensagem: 'Servidor Evolution não configurado. Contate o administrador.',
    }, { status: 400 })
  }

  const userId = session.user.id
  const instanceName = `user-${userId}`
  const evolutionUrl = settings.evolution_api_url.replace(/\/$/, '')
  const webhookUrl = SITE_URL ? `${SITE_URL}/api/whatsapp/evolution/webhook` : null

  const createBody: Record<string, unknown> = {
    name: instanceName,
    token: crypto.randomUUID(),
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

  let instanceId = instanceName
  let instanceApiKey: string | null = null

  try {
    const createRes = await fetch(`${evolutionUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: settings.evolution_api_key,
      },
      body: JSON.stringify(createBody),
    })

    const rawText = await createRes.text()
    let createData: Record<string, unknown> = {}
    try { createData = JSON.parse(rawText) } catch { /* non-JSON */ }

    if (!createRes.ok) {
      const alreadyExists =
        createRes.status === 409 ||
        String(createData?.message ?? '').toLowerCase().includes('exist')

      if (!alreadyExists) {
        console.error('[whatsapp/create] Evolution error:', createRes.status, rawText)
        return NextResponse.json({
          success: false,
          mensagem: (createData?.message as string) ?? `Evolution API retornou ${createRes.status}`,
        }, { status: 400 })
      }
    } else {
      // Extrai instanceId e a chave específica da instância gerada pelo Evolution Go
      instanceId =
        (createData?.instance as Record<string, unknown>)?.name as string
        ?? (createData?.instance as Record<string, unknown>)?.instanceName as string
        ?? (createData?.name as string)
        ?? (createData?.instanceName as string)
        ?? instanceName

      instanceApiKey =
        (createData?.hash as Record<string, unknown>)?.apikey as string
        ?? (createData?.token as string)
        ?? (createData?.apikey as string)
        ?? settings.evolution_api_key

      console.log('[whatsapp/create] created:', instanceId, 'apikey present:', !!instanceApiKey)
    }
  } catch (err) {
    console.error('[whatsapp/create] fetch error:', err)
    return NextResponse.json({
      success: false,
      mensagem: 'Não foi possível conectar ao servidor Evolution.',
    }, { status: 500 })
  }

  // Persiste instanceId e chave específica no WordPress (user_meta)
  await fetch(`${WP_API_BASE}/usuarios/me/whatsapp-config`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instance: instanceId,
      api_key: instanceApiKey ?? settings.evolution_api_key,
    }),
  })

  return NextResponse.json({ success: true, instance: instanceId })
}
