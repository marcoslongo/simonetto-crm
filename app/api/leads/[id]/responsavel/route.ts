import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const WP_API_BASE = process.env.NEXT_PUBLIC_WP_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/wp-json/api/v1', '')

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json(
      { success: false, mensagem: 'Não autenticado.' },
      { status: 401 }
    )
  }

  const { id } = await params
  const body = await req.json()

  const res = await fetch(`${WP_API_BASE}/wp-json/api/v1/leads/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.token}`,
      Accept: 'application/json',
    },
    body: JSON.stringify({ responsavel_id: body.responsavel_id ?? null }),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
