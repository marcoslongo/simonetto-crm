import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const WP_BASE = process.env.NEXT_PUBLIC_WP_URL || ''

async function wpFetch(method: 'GET' | 'POST', token: string) {
  const res = await fetch(`${WP_BASE}/wp-json/api/v1/presence`, {
    method,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  return res
}

export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false }, { status: 401 })

  try {
    await wpFetch('POST', session.token)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false }, { status: 401 })

  try {
    const res = await wpFetch('GET', session.token)
    if (!res.ok) return NextResponse.json({ ok: false }, { status: res.status })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
