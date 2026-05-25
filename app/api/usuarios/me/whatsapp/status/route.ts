import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'
import { isUserDeleted } from '@/lib/wp-delete-cache'

const WP_API_BASE = process.env.NEXT_PUBLIC_API_URL

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth_token')?.value ?? null
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  if (isUserDeleted(session.user.id)) {
    return NextResponse.json({ state: 'not_configured', instance: null })
  }

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
    return NextResponse.json({ state: 'not_configured', instance: null })
  }

  if (!settings?.evolution_api_url || !settings?.evolution_api_key) {
    // Sem settings → usa cache do WP
    const raw: string = config.connection_state ?? ''
    const state = /^(open|connected)$/i.test(raw) ? 'open' : (raw.toLowerCase() || 'close')
    return NextResponse.json({ state, instance: config.instance })
  }

  const evolutionUrl = settings.evolution_api_url.replace(/\/$/, '')
  const globalKey = settings.evolution_api_key as string
  const instanceName = config.instance as string

  // Busca token real da instância via /instance/all (globalKey)
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
  } catch { /* fallback abaixo */ }

  // Instância não existe no Evolution → não configurado
  if (!instanceToken) {
    return NextResponse.json({ state: 'not_configured', instance: null })
  }

  try {
    const statusRes = await fetch(`${evolutionUrl}/instance/status`, {
      headers: { apikey: instanceToken },
      cache: 'no-store',
    })

    if (!statusRes.ok) {
      // Erro no servidor → fallback WP
      const raw: string = config.connection_state ?? ''
      const state = /^(open|connected)$/i.test(raw) ? 'open' : (raw.toLowerCase() || 'close')
      return NextResponse.json({ state, instance: config.instance })
    }

    const statusData = await statusRes.json()
    const d = (statusData?.data as Record<string, unknown>) ?? {}
    const connected = d?.Connected === true
    const loggedIn = d?.LoggedIn === true

    let state: string
    if (connected && loggedIn) {
      state = 'open'
    } else if (!connected && !loggedIn) {
      state = 'close'
    } else {
      state = 'connecting'
    }

    return NextResponse.json({ state, instance: config.instance })
  } catch {
    const raw: string = config.connection_state ?? ''
    const state = /^(open|connected)$/i.test(raw) ? 'open' : (raw.toLowerCase() || 'close')
    return NextResponse.json({ state, instance: config.instance })
  }
}
