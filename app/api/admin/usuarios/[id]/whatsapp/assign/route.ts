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

  const res = await fetch(`${WP_API_BASE}/admin/usuarios/${userId}/whatsapp-config`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ instance, ...(api_key ? { api_key } : {}) }),
  })

  if (!res.ok) {
    return NextResponse.json({ success: false, mensagem: 'Erro ao salvar configuração.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, instance })
}
