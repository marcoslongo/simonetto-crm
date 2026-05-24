import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const WP_API = process.env.NEXT_PUBLIC_WP_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/wp-json/api/v1', '')

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const res = await fetch(`${WP_API}/wp-json/api/v1/followups/overdue`, {
    headers: { Authorization: `Bearer ${session.token}`, Accept: 'application/json' },
    cache: 'no-store',
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
