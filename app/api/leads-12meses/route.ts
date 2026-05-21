import { NextRequest, NextResponse } from 'next/server'
import { getLeadsLast12MonthsServer } from '@/lib/server-leads-service'

export async function GET(request: NextRequest) {
  const origem = request.nextUrl.searchParams.get('origem') as 'industria' | 'proprio' | null

  try {
    const data = await getLeadsLast12MonthsServer(origem ?? undefined)
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
