import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'

const WP_API_BASE = process.env.NEXT_PUBLIC_API_URL

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth_token')?.value ?? null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  if (session.user.role !== 'administrator') {
    return NextResponse.json({ success: false }, { status: 403 })
  }

  const { id: userId } = await params
  const token = await getAuthToken()

  const body = await req.json().catch(() => ({}))
  const instance = String(body.instance ?? '').trim()
  const api_key = String(body.api_key ?? '').trim()

  if (!instance) {
    return NextResponse.json({ success: false, mensagem: 'Nome da instância obrigatório.' }, { status: 400 })
  }

  // Tenta buscar o UUID da instância pelo nome no servidor Evolution
  let instance_id: string | null = null
  try {
    const settingsRes = await fetch(`${WP_API_BASE}/settings/whatsapp`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    const settings = settingsRes.ok ? await settingsRes.json() : null
    if (settings?.evolution_api_url && settings?.evolution_api_key) {
      const evolutionUrl = (settings.evolution_api_url as string).replace(/\/$/, '')
      const allRes = await fetch(`${evolutionUrl}/instance/all`, {
        headers: { apikey: settings.evolution_api_key },
        cache: 'no-store',
      })
      if (allRes.ok) {
        const allData = await allRes.json()
        const found = (allData?.data ?? []).find(
          (i: { name: string; id: string }) => i.name === instance
        )
        instance_id = found?.id ?? null
        console.log('[assign] found UUID for name=%s → id=%s', instance, instance_id ?? 'null')
      }
    }
  } catch (err) {
    console.warn('[assign] UUID lookup error (non-fatal):', err)
  }

  const payload: Record<string, string | null> = { instance }
  if (api_key) payload.api_key = api_key
  if (instance_id) payload.instance_id = instance_id

  const res = await fetch(`${WP_API_BASE}/admin/usuarios/${userId}/whatsapp-config`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    return NextResponse.json({ success: false, mensagem: 'Erro ao salvar configuração.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, instance, instance_id })
}
