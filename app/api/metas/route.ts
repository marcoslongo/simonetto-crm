import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const WP_API_BASE = process.env.NEXT_PUBLIC_WP_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/wp-json/api/v1', '')

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const qs = searchParams.toString()

  const res = await fetch(`${WP_API_BASE}/wp-json/api/v1/metas${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${session.token}`, Accept: 'application/json' },
  })
  return NextResponse.json(await res.json(), { status: res.status })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const body = await req.json()
  const res = await fetch(`${WP_API_BASE}/wp-json/api/v1/metas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}`, Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  return NextResponse.json(await res.json(), { status: res.status })
}
