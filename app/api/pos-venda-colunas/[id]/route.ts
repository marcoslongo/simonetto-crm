import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const API = process.env.NEXT_PUBLIC_API_URL

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const res = await fetch(`${API}/pos-venda-colunas/${id}/move`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
    body: JSON.stringify(body),
  })
  return NextResponse.json(await res.json(), { status: res.status })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const loja_id = searchParams.get('loja_id') ?? ''
  const res = await fetch(`${API}/pos-venda-colunas/${id}?loja_id=${loja_id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.token}` },
  })
  return NextResponse.json(await res.json(), { status: res.status })
}
