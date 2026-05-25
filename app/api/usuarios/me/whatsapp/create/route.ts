import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'

const WP_API_BASE = process.env.NEXT_PUBLIC_API_URL
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth_token')?.value ?? null
}

const SUBSCRIBE_EVENTS = ['MESSAGE', 'SEND_MESSAGE', 'CONNECTION', 'QRCODE']

export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const token = await getAuthToken()

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
  const globalKey = settings.evolution_api_key as string

  // Remove instância anterior pelo nome
  try {
    const allRes = await fetch(`${evolutionUrl}/instance/all`, {
      headers: { apikey: globalKey },
      cache: 'no-store',
    })
    if (allRes.ok) {
      const allData = await allRes.json()
      const existing = (allData?.data ?? []).find(
        (i: { name: string; id: string; token: string }) => i.name === instanceName
      )
      if (existing?.id) {
        await fetch(`${evolutionUrl}/instance/logout`, {
          method: 'DELETE',
          headers: { apikey: existing.token ?? globalKey },
        }).catch(() => {})
        await fetch(`${evolutionUrl}/instance/delete/${existing.id}`, {
          method: 'DELETE',
          headers: { apikey: globalKey },
        }).catch(() => {})
      }
    }
  } catch (err) {
    console.warn('[me/whatsapp/create] cleanup error (non-fatal):', err)
  }

  const instanceToken = crypto.randomUUID()
  const instanceUUID = crypto.randomUUID()

  let createdId = instanceUUID
  let createdToken = instanceToken

  try {
    const createRes = await fetch(`${evolutionUrl}/instance/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: globalKey },
      body: JSON.stringify({ name: instanceName, instanceId: instanceUUID, token: instanceToken }),
    })

    const rawText = await createRes.text()
    let createData: Record<string, unknown> = {}
    try { createData = JSON.parse(rawText) } catch { /* non-JSON */ }

    if (!createRes.ok) {
      console.error('[me/whatsapp/create] Evolution error:', createRes.status, rawText)
      return NextResponse.json({
        success: false,
        mensagem: (createData?.message as string) ?? `Evolution retornou ${createRes.status}`,
      }, { status: 400 })
    }

    const d = (createData?.data as Record<string, unknown>) ?? {}
    createdId = (d?.id as string) ?? instanceUUID
    createdToken = (d?.token as string) ?? instanceToken
    console.log('[me/whatsapp/create] created id=%s name=%s', createdId, instanceName)
  } catch (err) {
    console.error('[me/whatsapp/create] fetch error:', err)
    return NextResponse.json({
      success: false,
      mensagem: 'Não foi possível conectar ao servidor Evolution.',
    }, { status: 500 })
  }

  // Conecta e configura webhook
  const webhookUrl = SITE_URL ? `${SITE_URL}/api/whatsapp/evolution/webhook` : null
  try {
    const connectBody: Record<string, unknown> = {
      immediate: false,
      subscribe: SUBSCRIBE_EVENTS,
    }
    if (webhookUrl) connectBody.webhookUrl = webhookUrl

    const connectRes = await fetch(`${evolutionUrl}/instance/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: createdToken },
      body: JSON.stringify(connectBody),
    })
    const connectText = await connectRes.text()
    console.log('[me/whatsapp/create] connect status=%d body=%s', connectRes.status, connectText)
  } catch (err) {
    console.warn('[me/whatsapp/create] connect error (non-fatal):', err)
  }

  // Persiste no WordPress
  await fetch(`${WP_API_BASE}/usuarios/me/whatsapp-config`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instance: instanceName,
      api_key: createdToken,
      instance_id: createdId,
    }),
  })

  return NextResponse.json({ success: true, instance: instanceName })
}
