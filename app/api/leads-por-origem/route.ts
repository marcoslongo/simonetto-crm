import { NextRequest, NextResponse } from 'next/server'
import { getLeadsPorOrigemServer } from '@/lib/server-leads-service'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined

  try {
    const data = await getLeadsPorOrigemServer(from, to)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}