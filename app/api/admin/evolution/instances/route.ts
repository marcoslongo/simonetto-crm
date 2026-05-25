import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'
import { isUserDeleted } from '@/lib/wp-delete-cache'

const WP_API_BASE = process.env.NEXT_PUBLIC_API_URL

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth_token')?.value ?? null
}

interface EvolutionInstance {
  id: string
  name: string
  token: string
  connected: boolean
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  if (session.user.role !== 'administrator' || session.user.id !== 1) {
    return NextResponse.json({ success: false }, { status: 403 })
  }

  const token = await getAuthToken()

  const [res, settingsRes] = await Promise.all([
    fetch(`${WP_API_BASE}/admin/usuarios?_=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      cache: 'no-store',
    }),
    fetch(`${WP_API_BASE}/settings/whatsapp`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }),
  ])

  if (res.status === 401) {
    return NextResponse.json({ success: false, mensagem: 'Sessão expirada.' }, { status: 401 })
  }
  if (!res.ok) {
    return NextResponse.json({ success: false, mensagem: `Erro ao buscar usuários (${res.status}).` }, { status: res.status })
  }

  const data = await res.json()
  const settings = settingsRes.ok ? await settingsRes.json() : null

  // Busca instâncias reais do Evolution GO
  const evolutionMap = new Map<string, { connected: boolean; id: string }>()

  if (settings?.evolution_api_url && settings?.evolution_api_key) {
    try {
      const allRes = await fetch(
        `${settings.evolution_api_url.replace(/\/$/, '')}/instance/all`,
        { headers: { apikey: settings.evolution_api_key }, cache: 'no-store' }
      )
      if (allRes.ok) {
        const allData = await allRes.json()
        for (const inst of (allData?.data ?? []) as EvolutionInstance[]) {
          evolutionMap.set(inst.name, { connected: inst.connected, id: inst.id })
          evolutionMap.set(inst.id,   { connected: inst.connected, id: inst.id })
        }
      }
    } catch { /* Evolution inacessível — usa dados do WP sem alteração */ }
  }

  if (data.success && Array.isArray(data.usuarios)) {
    data.usuarios = data.usuarios.map((u: {
      id: number
      instance?: string | null
      connection_state?: string
    }) => {
      if (isUserDeleted(u.id)) {
        return { ...u, instance: null, connection_state: 'not_configured' }
      }
      if (!u.instance) return u

      const evo = evolutionMap.get(u.instance)

      // Instância existe no WP mas NÃO no servidor Evolution → apaga do display
      if (evolutionMap.size > 0 && !evo) {
        return { ...u, instance: null, connection_state: 'not_configured' }
      }

      if (evo) {
        return { ...u, connection_state: evo.connected ? 'open' : 'close' }
      }

      return u
    })
  }

  return NextResponse.json(data, { status: res.status })
}
