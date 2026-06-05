import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const WP = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ??
           'https://manager.simonetto.com.br/wp-json'

type Ctx = { params: Promise<{ id: string }> }

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))

  const res = await fetch(`${WP}/api/v1/lead-arquivos/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
