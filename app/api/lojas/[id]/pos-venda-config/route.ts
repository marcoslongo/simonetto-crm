import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const WP_API_BASE = process.env.NEXT_PUBLIC_WP_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/wp-json/api/v1', '')

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get('auth_token')?.value
  if (!token) return NextResponse.json({ success: false }, { status: 401 })
  const { id } = await params
  const res = await fetch(`${WP_API_BASE}/wp-json/api/v1/lojas/${id}/pos-venda-config`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  })
  return NextResponse.json(await res.json(), { status: res.status })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get('auth_token')?.value
  if (!token) return NextResponse.json({ success: false }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const res = await fetch(`${WP_API_BASE}/wp-json/api/v1/lojas/${id}/pos-venda-config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  return NextResponse.json(await res.json(), { status: res.status })
}
