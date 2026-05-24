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

  const configRes = await fetch(`${WP_API_BASE}/usuarios/me/whatsapp-config`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  const config = configRes.ok ? await configRes.json() : null

  if (!config?.instance) {
    return NextResponse.json({ state: 'not_configured', instance: null })
  }

  // Fallback: instância configurada mas connection_state ainda não registrado → assume open
  const raw: string = config.connection_state ?? ''
  const state = (config.instance && !raw)
    ? 'open'
    : (/^(open|connected)$/i.test(raw) ? 'open' : (raw.toLowerCase() || 'unknown'))

  return NextResponse.json({ state, instance: config.instance })
}
