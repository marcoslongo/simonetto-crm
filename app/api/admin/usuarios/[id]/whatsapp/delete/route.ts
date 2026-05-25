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

  // Busca config atual do usuário
  const configRes = await fetch(`${WP_API_BASE}/admin/usuarios/${userId}/whatsapp-config`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const config = configRes.ok ? await configRes.json() : null

  // Busca configurações globais do Evolution
  const settingsRes = await fetch(`${WP_API_BASE}/settings/whatsapp`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const settings = settingsRes.ok ? await settingsRes.json() : null

  // Deleta do Evolution se instância existir
  if (config?.instance && settings?.evolution_api_url && settings?.evolution_api_key) {
    const evolutionUrl = settings.evolution_api_url.replace(/\/$/, '')
    const instanceName = config.instance
    const apiKey = config.api_key ?? settings.evolution_api_key

    // Tenta fazer logout primeiro (desconecta WhatsApp)
    await fetch(`${evolutionUrl}/instance/logout/${instanceName}`, {
      method: 'DELETE',
      headers: { apikey: apiKey },
    }).catch(() => {})

    // Deleta a instância do Evolution
    await fetch(`${evolutionUrl}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: { apikey: settings.evolution_api_key },
    }).catch(() => {})
  }

  // Limpa o user_meta no WordPress
  const clearRes = await fetch(`${WP_API_BASE}/admin/usuarios/${userId}/whatsapp-config`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ instance: null, api_key: null, connection_state: null }),
  })

  const clearText = await clearRes.text()
  console.log('[whatsapp/delete] WP clear status:', clearRes.status, clearText)

  if (!clearRes.ok) {
    return NextResponse.json({
      success: false,
      mensagem: `Falha ao limpar dados no WordPress (${clearRes.status}): ${clearText}`,
    }, { status: 500 })
  }

  markUserDeleted(Number(userId))

  return NextResponse.json({ success: true })
}
