import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const WP_API = process.env.NEXT_PUBLIC_WP_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/wp-json/api/v1', '')

type Ctx = { params: Promise<{ id: string }> }

async function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' }
}

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const { id } = await params
  const res = await fetch(`${WP_API}/wp-json/api/v1/leads/${id}/notas`, {
    headers: await authHeaders(session.token),
    cache: 'no-store',
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function POST(req: Request, { params }: Ctx) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const res = await fetch(`${WP_API}/wp-json/api/v1/leads/${id}/notas`, {
    method: 'POST',
    headers: await authHeaders(session.token),
    body: JSON.stringify({ conteudo: body.conteudo }),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
