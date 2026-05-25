import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'
import { isUserDeleted } from '@/lib/wp-delete-cache'

const WP_API_BASE = process.env.NEXT_PUBLIC_API_URL

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth_token')?.value ?? null
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  if (session.user.role !== 'administrator') {
    return NextResponse.json({ success: false }, { status: 403 })
  }

  const token = await getAuthToken()

  const res = await fetch(`${WP_API_BASE}/admin/usuarios?_=${Date.now()}`, {
    headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    cache: 'no-store',
  })

  if (res.status === 401) {
    return NextResponse.json({ success: false, mensagem: 'Sessão expirada. Faça login novamente.' }, { status: 401 })
  }

  if (!res.ok) {
    return NextResponse.json({ success: false, mensagem: `Erro ao buscar usuários (${res.status}).` }, { status: res.status })
  }

  const data = await res.json()
  if (data.success && Array.isArray(data.usuarios)) {
    data.usuarios = data.usuarios.map((u: { id: number; instance?: string | null }) =>
      isUserDeleted(u.id) ? { ...u, instance: null, connection_state: 'not_configured' } : u
    )
  }
  return NextResponse.json(data, { status: res.status })
}
