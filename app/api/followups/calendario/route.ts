import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const WP_API = process.env.NEXT_PUBLIC_WP_URL
  || process.env.NEXT_PUBLIC_API_URL?.replace('/wp-json/api/v1', '')

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const year  = searchParams.get('year')  ?? String(new Date().getFullYear())
  const month = searchParams.get('month') ?? String(new Date().getMonth() + 1)

  const qs = new URLSearchParams({ year, month })

  const res = await fetch(
    `${WP_API}/wp-json/api/v1/followups/calendar?${qs}`,
    {
      headers: { Authorization: `Bearer ${session.token}`, Accept: 'application/json' },
      cache: 'no-store',
    }
  )
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
