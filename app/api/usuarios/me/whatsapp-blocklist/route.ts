import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'

const WP_API_BASE = process.env.NEXT_PUBLIC_API_URL

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth_token')?.value ?? null
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const token = await getAuthToken()
  const res = await fetch(`${WP_API_BASE}/usuarios/me/whatsapp-blocklist`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  return NextResponse.json(await res.json(), { status: res.status })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const token = await getAuthToken()
  const body = await req.json()
  const res = await fetch(`${WP_API_BASE}/usuarios/me/whatsapp-blocklist`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return NextResponse.json(await res.json(), { status: res.status })
}

export async function DELETE(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const token = await getAuthToken()
  const body = await req.json()
  const res = await fetch(`${WP_API_BASE}/usuarios/me/whatsapp-blocklist`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return NextResponse.json(await res.json(), { status: res.status })
}
