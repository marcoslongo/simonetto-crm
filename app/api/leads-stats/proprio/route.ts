import { NextResponse } from 'next/server'
import { getSession, isMaster } from '@/lib/auth'
import { getLeadsStatsGeralServer } from '@/lib/server-leads-service'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  if (!isMaster(session.user)) return NextResponse.json({ success: false }, { status: 403 })

  try {
    const data = await getLeadsStatsGeralServer('proprio')
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
