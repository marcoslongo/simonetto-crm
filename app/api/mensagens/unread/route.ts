import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'

const WP_API_BASE = process.env.NEXT_PUBLIC_API_URL

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth_token')?.value ?? null
}

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const lojaId = searchParams.get('loja_id') ?? ''

  const token = await getAuthToken()
  const qs = lojaId ? `?loja_id=${lojaId}` : ''

  const res = await fetch(`${WP_API_BASE}/mensagens/unread-counts${qs}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  })

  if (!res.ok) return NextResponse.json({ success: false }, { status: res.status })

  const data = await res.json()
  return NextResponse.json(data)
}
