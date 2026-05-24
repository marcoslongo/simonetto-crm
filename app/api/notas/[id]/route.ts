import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const WP_API = process.env.NEXT_PUBLIC_WP_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/wp-json/api/v1', '')

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const { id } = await params

  const res = await fetch(`${WP_API}/wp-json/api/v1/notas/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.token}`, Accept: 'application/json' },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
