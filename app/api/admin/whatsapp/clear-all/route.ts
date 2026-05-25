import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'
import { markUserDeleted } from '@/lib/wp-delete-cache'

const WP_API_BASE = process.env.NEXT_PUBLIC_API_URL

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth_token')?.value ?? null
}

// Limpa configuração WhatsApp de TODOS os usuários que possuem instância no WP.
// Também tenta deletar instâncias remanescentes no Evolution GO.
// Acesso restrito a admin ID 1.
export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  if (session.user.role !== 'administrator' || session.user.id !== 1) {
    return NextResponse.json({ success: false }, { status: 403 })
  }

  const token = await getAuthToken()

  // Busca todos os usuários com instância configurada
  const usersRes = await fetch(`${WP_API_BASE}/admin/usuarios?_=${Date.now()}`, {
    headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
    cache: 'no-store',
  })
  if (!usersRes.ok) {
    return NextResponse.json({ success: false, mensagem: 'Erro ao buscar usuários.' }, { status: 500 })
  }

  const usersData = await usersRes.json()
  const withInstance = (usersData.usuarios ?? []).filter(
    (u: { instance?: string | null }) => u.instance
  )

  // Busca configurações do Evolution para tentar limpar instâncias remanescentes
  const settingsRes = await fetch(`${WP_API_BASE}/settings/whatsapp`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const settings = settingsRes.ok ? await settingsRes.json() : null

  const results: Array<{ userId: number; instance: string; wpCleared: boolean; evolutionDeleted: boolean; error?: string }> = []

  for (const u of withInstance as Array<{ id: number; instance: string; api_key?: string; instance_id?: string }>) {
    let evolutionDeleted = false

    // Tenta deletar do Evolution GO se configurado
    if (settings?.evolution_api_url && settings?.evolution_api_key) {
      const evolutionUrl = (settings.evolution_api_url as string).replace(/\/$/, '')
      const globalKey = settings.evolution_api_key as string
      const instanceToken = u.api_key
      let uuid = u.instance_id ?? null

      // Lookup UUID se não tiver
      if (!uuid) {
        try {
          const allRes = await fetch(`${evolutionUrl}/instance/all`, {
            headers: { apikey: globalKey }, cache: 'no-store',
          })
          if (allRes.ok) {
            const allData = await allRes.json()
            const found = (allData?.data ?? []).find((i: { name: string; id: string }) => i.name === u.instance)
            uuid = found?.id ?? null
          }
        } catch { /* ignora */ }
      }

      if (instanceToken) {
        await fetch(`${evolutionUrl}/instance/logout`, {
          method: 'DELETE', headers: { apikey: instanceToken },
        }).catch(() => {})
      }

      if (uuid) {
        try {
          const delRes = await fetch(`${evolutionUrl}/instance/delete/${uuid}`, {
            method: 'DELETE', headers: { apikey: globalKey },
          })
          evolutionDeleted = delRes.ok
        } catch { /* ignora */ }
      }
    }

    // Limpa WP
    const clearRes = await fetch(`${WP_API_BASE}/admin/usuarios/${u.id}/whatsapp-config`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ instance: null, api_key: null, connection_state: null, instance_id: null }),
    })

    markUserDeleted(u.id)

    results.push({
      userId: u.id,
      instance: u.instance,
      wpCleared: clearRes.ok,
      evolutionDeleted,
    })
  }

  return NextResponse.json({ success: true, limpados: results })
}
