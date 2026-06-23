import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const WP = process.env.NEXT_PUBLIC_WP_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/wp-json/api/v1', '')

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const { id } = await params
  const res = await fetch(`${WP}/wp-json/api/v1/comissoes/fechamentos/${id}/aprovar`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${session.token}`, Accept: 'application/json' },
  })
  return NextResponse.json(await res.json(), { status: res.status })
}
