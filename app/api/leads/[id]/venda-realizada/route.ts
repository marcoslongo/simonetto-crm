import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const WP_API_BASE = process.env.NEXT_PUBLIC_WP_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/wp-json/api/v1', '')

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ success: false, mensagem: 'Não autenticado.' }, { status: 401 })
  }

  const { id } = await params

  const res = await fetch(`${WP_API_BASE}/wp-json/api/v1/leads/${id}/venda-realizada`, {
    headers: {
      Authorization: `Bearer ${session.token}`,
      Accept: 'application/json',
    },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ success: false, mensagem: 'Não autenticado.' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  const res = await fetch(`${WP_API_BASE}/wp-json/api/v1/leads/${id}/venda-realizada`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.token}`,
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ success: false, mensagem: 'Não autenticado.' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  const res = await fetch(`${WP_API_BASE}/wp-json/api/v1/leads/${id}/venda-realizada`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.token}`,
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
