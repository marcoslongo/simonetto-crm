import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const WP_API = process.env.NEXT_PUBLIC_API_URL || 'https://manager.simonetto.com.br/wp-json/api/v1'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const lojaIds = searchParams.get('loja_ids') ?? ''

  const qs = new URLSearchParams()
  if (lojaIds) qs.set('loja_ids', lojaIds)

  const res = await fetch(
    `${WP_API}/stats/funil-por-atendente${qs.toString() ? `?${qs}` : ''}`,
    { cache: 'no-store', headers: { Authorization: `Bearer ${session.token}` } }
  )
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
