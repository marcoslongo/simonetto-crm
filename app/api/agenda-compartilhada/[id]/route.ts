import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const WP = process.env.WORDPRESS_API_URL || 'https://manager.simonetto.com.br/wp-json'

async function token() {
  return (await cookies()).get('auth_token')?.value ?? ''
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const res = await fetch(`${WP}/api/v1/agenda-compartilhada/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token()}` },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const res = await fetch(`${WP}/api/v1/agenda-compartilhada/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token()}` },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
