import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getLojaLeads } from '@/lib/api-loja'
import type { Lead } from '@/lib/types'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const lojaIds = (searchParams.get('loja_ids') ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(Number)
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const perPage = Math.min(200, Math.max(1, Number(searchParams.get('per_page') ?? '100')))
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined
  const search = searchParams.get('search') ?? undefined

  if (!lojaIds.length) {
    return NextResponse.json({ success: true, leads: [], total: 0 })
  }

  try {
    const results = await Promise.all(
      lojaIds.map(id =>
        getLojaLeads(id, page, perPage, from, to, search).catch(err => {
          console.error(`[kanban/leads] loja ${id} falhou:`, err)
          return { leads: [] as Lead[], total: 0 }
        })
      )
    )
    const leads = results
      .flatMap(r => r.leads)
      .sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime())
    const total = results.reduce((s, r) => s + r.total, 0)
    return NextResponse.json({ success: true, leads, total })
  } catch {
    return NextResponse.json({ success: false, leads: [], total: 0 }, { status: 500 })
  }
}
