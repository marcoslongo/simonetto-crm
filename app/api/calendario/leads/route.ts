import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const WP_BASE = process.env.NEXT_PUBLIC_WP_URL
  || process.env.NEXT_PUBLIC_API_URL?.replace('/wp-json/api/v1', '')
const WP_API = process.env.NEXT_PUBLIC_API_URL || 'https://manager.simonetto.com.br/wp-json/api/v1'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''

  const headers = {
    Authorization: `Bearer ${session.token}`,
    Accept: 'application/json',
  }

  try {
    if (session.user.role === 'administrator') {
      const qs = new URLSearchParams({ per_page: '100', page: '1' })
      if (search) qs.set('busca', search)
      const res = await fetch(`${WP_API}/leads?${qs}`, { headers, cache: 'no-store' })
      const data = await res.json()
      return NextResponse.json({ success: true, leads: data.leads ?? [] })
    }

    const lojaIds = session.user.loja_ids
    if (!lojaIds.length) return NextResponse.json({ success: true, leads: [] })

    const results = await Promise.all(
      lojaIds.map(async (id) => {
        const qs = new URLSearchParams({ per_page: '100', page: '1' })
        if (search) qs.set('busca', search)
        const res = await fetch(
          `${WP_BASE}/wp-json/api/v1/lojas/${id}/leads?${qs}`,
          { headers, cache: 'no-store' }
        )
        if (!res.ok) return []
        const data = await res.json()
        return data.leads ?? []
      })
    )

    return NextResponse.json({ success: true, leads: results.flat() })
  } catch {
    return NextResponse.json({ success: false, leads: [] }, { status: 500 })
  }
}
