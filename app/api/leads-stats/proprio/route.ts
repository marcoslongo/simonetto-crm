import { NextResponse } from 'next/server'
import { getLeadsStatsGeralServer } from '@/lib/server-leads-service'

export async function GET() {
  try {
    const data = await getLeadsStatsGeralServer('proprio')
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
