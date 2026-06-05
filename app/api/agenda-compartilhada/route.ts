import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const WP = process.env.WORDPRESS_API_URL || 'https://manager.simonetto.com.br/wp-json'

async function token() {
  return (await cookies()).get('auth_token')?.value ?? ''
}

// GET /api/agenda-compartilhada?loja_id=X&year=YYYY&month=M
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const lojaId = sp.get('loja_id')
  if (!lojaId) return NextResponse.json({ success: false, mensagem: 'loja_id obrigatório' }, { status: 400 })

  const qs = new URLSearchParams()
  if (sp.get('year'))  qs.set('year',  sp.get('year')!)
  if (sp.get('month')) qs.set('month', sp.get('month')!)

  const res = await fetch(`${WP}/api/v1/lojas/${lojaId}/agenda-compartilhada?${qs}`, {
    headers: { Authorization: `Bearer ${await token()}` },
    cache: 'no-store',
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

// POST /api/agenda-compartilhada
export async function POST(req: NextRequest) {
  const body = await req.json()
  const lojaId = body.loja_id
  if (!lojaId) return NextResponse.json({ success: false, mensagem: 'loja_id obrigatório' }, { status: 400 })

  const res = await fetch(`${WP}/api/v1/lojas/${lojaId}/agenda-compartilhada`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token()}` },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
