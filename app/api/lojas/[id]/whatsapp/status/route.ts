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

  const configRes = await fetch(`${WP_API_BASE}/lojas/${id}/whatsapp-config`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  const config = configRes.ok ? await configRes.json() : null

  if (!config?.instance) {
    return NextResponse.json({ state: 'not_configured', instance: null })
  }

  // Estado rastreado via webhook CONNECTION — não precisa chamar o Evolution Go
  // Fallback: instância configurada mas connection_state ainda não registrado (WP sem deploy) → assume open
  const raw: string = config.connection_state ?? ''
  const state = (config.instance && !raw)
    ? 'open'
    : (/^(open|connected)$/i.test(raw) ? 'open' : (raw.toLowerCase() || 'unknown'))

  return NextResponse.json({ state, instance: config.instance })
}
