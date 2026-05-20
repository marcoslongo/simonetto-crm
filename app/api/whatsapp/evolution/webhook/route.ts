import { NextRequest, NextResponse } from 'next/server'

const WP_API_BASE = process.env.NEXT_PUBLIC_API_URL

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const res = await fetch(`${WP_API_BASE}/mensagens/evolution-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      console.error('[Evolution Webhook] WordPress retornou:', res.status)
    }

    // Evolution API exige resposta 200 imediata
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (err) {
    console.error('[Evolution Webhook] Erro:', err)
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  }
}
