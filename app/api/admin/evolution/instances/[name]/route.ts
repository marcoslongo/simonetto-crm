import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'

const WP_API_BASE = process.env.NEXT_PUBLIC_API_URL

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth_token')?.value ?? null
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  if (session.user.role !== 'administrator' || session.user.id !== 1) {
    return NextResponse.json({ success: false }, { status: 403 })
  }

  const { name } = await params
  const token = await getAuthToken()

  const settingsRes = await fetch(`${WP_API_BASE}/settings/whatsapp`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const settings = settingsRes.ok ? await settingsRes.json() : null

  if (!settings?.evolution_api_url || !settings?.evolution_api_key) {
    return NextResponse.json({ success: false, mensagem: 'Servidor Evolution não configurado.' }, { status: 400 })
  }

  const evolutionUrl = settings.evolution_api_url.replace(/\/$/, '')

  await fetch(`${evolutionUrl}/instance/logout/${name}`, {
    method: 'DELETE',
    headers: { apikey: settings.evolution_api_key },
  }).catch(() => {})

  const delRes = await fetch(`${evolutionUrl}/instance/delete/${name}`, {
    method: 'DELETE',
    headers: { apikey: settings.evolution_api_key },
  })

  const rawText = await delRes.text()
  let data: Record<string, unknown> = {}
  try { data = JSON.parse(rawText) } catch { /* non-JSON */ }

  if (!delRes.ok) {
    console.error('[evolution/instances/delete]', delRes.status, rawText)
    return NextResponse.json({
      success: false,
      mensagem: (data?.error as string) ?? `Evolution retornou ${delRes.status}`,
    }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
