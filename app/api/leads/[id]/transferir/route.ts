import { NextRequest, NextResponse } from 'next/server'
import { getSession, isSupervisor } from '@/lib/auth'

const WP = process.env.NEXT_PUBLIC_WP_URL

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  if (!isSupervisor(session.user)) {
    return NextResponse.json(
      { success: false, mensagem: 'Apenas supervisores podem transferir leads entre lojas.' },
      { status: 403 }
    )
  }

  const { id } = await params
  const body = await req.json()

  const res = await fetch(`${WP}/wp-json/api/v1/leads/${id}/transferir`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
