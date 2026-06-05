import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const WP = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ??
           'https://manager.simonetto.com.br/wp-json'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const { id } = await params
  const res = await fetch(`${WP}/api/v1/leads/${id}/arquivos`, {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: 'no-store',
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const { id } = await params
  // Repassa o FormData diretamente — não re-codifica
  const formData = await req.formData()

  const res = await fetch(`${WP}/api/v1/leads/${id}/arquivos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.token}` },
    body: formData,
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
