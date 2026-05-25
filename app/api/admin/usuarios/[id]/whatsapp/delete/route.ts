import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'
import { markUserDeleted } from '@/lib/wp-delete-cache'

const WP_API_BASE = process.env.NEXT_PUBLIC_API_URL

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth_token')?.value ?? null
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  if (session.user.role !== 'administrator') {
    return NextResponse.json({ success: false }, { status: 403 })
  }

  const { id: userId } = await params
  const token = await getAuthToken()

  const [configRes, settingsRes] = await Promise.all([
    fetch(`${WP_API_BASE}/admin/usuarios/${userId}/whatsapp-config`, {
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

  console.log('[whatsapp/delete] userId=%s instance=%s instance_id=%s', userId, config?.instance ?? 'null', config?.instance_id ?? 'null')

  let evolutionError: string | null = null

  if (config?.instance && settings?.evolution_api_url && settings?.evolution_api_key) {
    const evolutionUrl = settings.evolution_api_url.replace(/\/$/, '')
    const globalKey = settings.evolution_api_key as string
    const instanceToken = config.api_key as string | undefined
    const instanceName = config.instance as string

    // Resolve UUID: usa instance_id salvo ou busca pelo nome em /instance/all
    let instanceUUID: string | null = (config.instance_id as string) ?? null

    if (!instanceUUID) {
      console.log('[whatsapp/delete] instance_id não salvo — buscando pelo nome em /instance/all')
      try {
        const allRes = await fetch(`${evolutionUrl}/instance/all`, {
          headers: { apikey: globalKey },
          cache: 'no-store',
        })
        if (allRes.ok) {
          const allData = await allRes.json()
          const found = (allData?.data ?? []).find(
            (i: { name: string; id: string }) => i.name === instanceName
          )
          instanceUUID = found?.id ?? null
          console.log('[whatsapp/delete] found UUID by name=%s → id=%s', instanceName, instanceUUID ?? 'null')
        }
      } catch (err) {
        console.warn('[whatsapp/delete] /instance/all error:', err)
      }
    }

    // Logout (desconecta o número) — usa token da instância
    if (instanceToken) {
      try {
        const logoutRes = await fetch(`${evolutionUrl}/instance/logout`, {
          method: 'DELETE',
          headers: { apikey: instanceToken },
        })
        const logoutText = await logoutRes.text()
        console.log('[whatsapp/delete] logout status=%d body=%s', logoutRes.status, logoutText)
      } catch (err) {
        console.warn('[whatsapp/delete] logout network error:', err)
      }
    }

    // Delete da instância — usa UUID e chave global
    if (instanceUUID) {
      try {
        const delRes = await fetch(`${evolutionUrl}/instance/delete/${instanceUUID}`, {
          method: 'DELETE',
          headers: { apikey: globalKey },
        })
        const delText = await delRes.text()
        console.log('[whatsapp/delete] delete status=%d body=%s', delRes.status, delText)

        if (!delRes.ok) {
          let parsed: Record<string, unknown> = {}
          try { parsed = JSON.parse(delText) } catch { /* non-JSON */ }
          evolutionError = (parsed?.error as string) ?? delText
          console.error('[whatsapp/delete] delete falhou:', evolutionError)
        }
      } catch (err) {
        evolutionError = `Falha de rede ao conectar no Evolution: ${String(err)}`
        console.error('[whatsapp/delete] delete exception:', err)
      }
    } else {
      evolutionError = `Instância "${instanceName}" não encontrada no servidor Evolution.`
      console.warn('[whatsapp/delete]', evolutionError)
    }
  } else {
    console.log('[whatsapp/delete] sem instância configurada ou settings ausente — pulando Evolution')
  }

  // Limpa user_meta no WordPress (independente do resultado no Evolution)
  const clearRes = await fetch(`${WP_API_BASE}/admin/usuarios/${userId}/whatsapp-config`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ instance: null, api_key: null, connection_state: null, instance_id: null }),
  })

  const clearText = await clearRes.text()
  console.log('[whatsapp/delete] WP clear status=%d body=%s', clearRes.status, clearText)

  if (!clearRes.ok) {
    return NextResponse.json({
      success: false,
      mensagem: `Falha ao limpar dados no WordPress (${clearRes.status}): ${clearText}`,
    }, { status: 500 })
  }

  markUserDeleted(Number(userId))

  return NextResponse.json({
    success: true,
    aviso: evolutionError
      ? `Instância removida localmente, mas houve erro no servidor Evolution: ${evolutionError}`
      : null,
  })
}
