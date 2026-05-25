import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'

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
  if (session.user.role !== 'administrator') {
    return NextResponse.json({ success: false }, { status: 403 })
  }

  const token = await getAuthToken()

  // Busca usuários do WP e instâncias reais do Evolution GO em paralelo
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
    return NextResponse.json({ success: false, mensagem: 'Sessão expirada. Faça login novamente.' }, { status: 401 })
  }
  if (!res.ok) {
    return NextResponse.json({ success: false, mensagem: `Erro ao buscar usuários (${res.status}).` }, { status: res.status })
  }

  const data = await res.json()
  const settings = settingsRes.ok ? await settingsRes.json() : null

  // Busca instâncias reais no servidor Evolution GO
  // Mantém mapa: instanceName → { connected, id }
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
          // Indexa por nome E por UUID para cobrir ambos os formatos
          evolutionMap.set(inst.name, { connected: inst.connected, id: inst.id })
          evolutionMap.set(inst.id,   { connected: inst.connected, id: inst.id })
        }
      }
    } catch {
      // Se Evolution GO não estiver acessível, mostra dados do WP sem alteração
    }
  }

  if (data.success && Array.isArray(data.usuarios)) {
    data.usuarios = data.usuarios.map((u: {
      id: number
      instance?: string | null
      connection_state?: string
    }) => {
      // Sem instância configurada no WP
      if (!u.instance) return u

      // Verifica se a instância existe no Evolution GO
      const evo = evolutionMap.get(u.instance)
      if (evolutionMap.size > 0 && !evo) {
        // Instância está no WP mas NÃO existe no servidor Evolution
        return { ...u, connection_state: 'not_configured' }
      }

      if (evo) {
        return {
          ...u,
          connection_state: evo.connected ? 'open' : 'close',
        }
      }

      return u
    })
  }

  return NextResponse.json(data, { status: res.status })
}
