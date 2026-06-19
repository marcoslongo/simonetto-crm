import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isSupervisor } from '@/lib/auth'
import { cookies } from 'next/headers'

const WP = process.env.NEXT_PUBLIC_WP_URL

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false }, { status: 401 })
  if (!isSupervisor(user)) {
    return NextResponse.json(
      { success: false, mensagem: 'Apenas supervisores podem transferir leads entre lojas.' },
      { status: 403 }
    )
  }

  const { id } = await params
  const body = await req.json()

  const cookieStore = await cookies()
  const token = cookieStore.get('crm_token')?.value

  const res = await fetch(`${WP}/wp-json/api/v1/leads/${id}/transferir`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
