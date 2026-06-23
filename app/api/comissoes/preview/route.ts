import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const WP = process.env.NEXT_PUBLIC_WP_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/wp-json/api/v1', '')

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const res = await fetch(`${WP}/wp-json/api/v1/comissoes/preview?${searchParams.toString()}`, {
    headers: { Authorization: `Bearer ${session.token}`, Accept: 'application/json' },
  })
  return NextResponse.json(await res.json(), { status: res.status })
}
