import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const API = process.env.NEXT_PUBLIC_API_URL

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const { id } = await params
  const res = await fetch(`${API}/pos-venda-notas/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.token}` },
  })
  return NextResponse.json(await res.json(), { status: res.status })
}
