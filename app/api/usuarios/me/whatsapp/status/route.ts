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

  // Instância foi recém deletada — retorna not_configured sem esperar o cache WP expirar
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

  // Se não tiver token da instância ou URL do servidor, usa cache WP
  if (!settings?.evolution_api_url || !config?.api_key) {
    const raw: string = config.connection_state ?? ''
    const state = /^(open|connected)$/i.test(raw) ? 'open' : (raw.toLowerCase() || 'close')
    return NextResponse.json({ state, instance: config.instance })
  }

  const evolutionUrl = settings.evolution_api_url.replace(/\/$/, '')
  const instanceToken = config.api_key as string

  try {
    // Evolution GO: GET /instance/status com token da instância como apikey
    const statusRes = await fetch(`${evolutionUrl}/instance/status`, {
      headers: { apikey: instanceToken },
      cache: 'no-store',
    })

    // 401 = token inválido → instância foi deletada ou token expirou
    if (statusRes.status === 401 || statusRes.status === 403) {
      return NextResponse.json({ state: 'not_configured', instance: null })
    }

    // Outros erros (5xx, rede) → fallback para cache WP
    if (!statusRes.ok) {
      const raw: string = config.connection_state ?? ''
      const state = /^(open|connected)$/i.test(raw) ? 'open' : (raw.toLowerCase() || 'close')
      return NextResponse.json({ state, instance: config.instance })
    }

    const statusData = await statusRes.json()
    // Resposta: { data: { Connected: bool, LoggedIn: bool, Name: string }, message: "success" }
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
    // Fallback se Evolution estiver inacessível
    const raw: string = config.connection_state ?? ''
    const state = /^(open|connected)$/i.test(raw) ? 'open' : (raw.toLowerCase() || 'close')
    return NextResponse.json({ state, instance: config.instance })
  }
}
