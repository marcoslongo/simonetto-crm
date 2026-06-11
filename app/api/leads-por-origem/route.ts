import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getLeadsPorOrigemServer } from '@/lib/server-leads-service'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const { searchParams } = request.nextUrl
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined

  try {
    // Filtragem de leads 'proprio' para admin não-master é feita no PHP
    const data = await getLeadsPorOrigemServer(from, to)
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
