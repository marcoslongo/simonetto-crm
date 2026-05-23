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
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined

  if (!lojaIds.length) {
    return NextResponse.json({ success: true, data: [] })
  }

  try {
    const allLeads: Lead[] = []
    const seenIds = new Set<string>()

    await Promise.all(
      lojaIds.map(async id => {
        let page = 1
        while (true) {
          const { leads, total } = await getLojaLeads(id, page, 200, from, to)
          for (const lead of leads) {
            if (!seenIds.has(lead.id)) {
              seenIds.add(lead.id)
              allLeads.push(lead)
            }
          }
          if (allLeads.length >= total || leads.length < 200) break
          page++
        }
      })
    )

    const byDay = new Map<string, number>()
    for (const lead of allLeads) {
      const day = lead.data_criacao?.split('T')[0]
      if (day) byDay.set(day, (byDay.get(day) ?? 0) + 1)
    }

    const data = Array.from(byDay.entries())
      .map(([data, total]) => ({ data, total }))
      .sort((a, b) => a.data.localeCompare(b.data))

    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, data: [] }, { status: 500 })
  }
}
