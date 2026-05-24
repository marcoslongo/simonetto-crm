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

  if (!config?.instance || !settings?.evolution_api_url) {
    return NextResponse.json({ state: 'not_configured', instance: null })
  }

  const evolutionUrl = settings.evolution_api_url.replace(/\/$/, '')
  const apiKey = config.api_key ?? settings.evolution_api_key

  try {
    const stateRes = await fetch(`${evolutionUrl}/instance/connectionState/${config.instance}`, {
      headers: { apikey: apiKey },
      cache: 'no-store',
    })
    const stateData = await stateRes.json()
    const state: string = stateData?.instance?.state ?? stateData?.state ?? 'unknown'
    return NextResponse.json({ state, instance: config.instance })
  } catch {
    return NextResponse.json({ state: 'error', instance: config.instance })
  }
}
