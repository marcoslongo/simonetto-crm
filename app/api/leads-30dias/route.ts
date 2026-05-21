import { NextRequest, NextResponse } from 'next/server'
import { getLeadsLast30DaysServer } from '@/lib/server-leads-service'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const origem = searchParams.get('origem') as 'industria' | 'proprio' | null

  try {
    const data = await getLeadsLast30DaysServer(undefined, undefined, origem ?? undefined)
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
