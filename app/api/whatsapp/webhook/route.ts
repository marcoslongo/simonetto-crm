import { NextRequest, NextResponse } from 'next/server'

const WP_API_BASE = process.env.NEXT_PUBLIC_API_URL
const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN

// GET — verificação do webhook pela Meta (feita uma única vez na configuração)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST — recebe eventos de mensagens e status da Meta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Repassa para o WordPress processar e salvar no banco
    const res = await fetch(`${WP_API_BASE}/mensagens/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      console.error('[Webhook] WordPress retornou:', res.status)
    }

    // A Meta exige resposta 200 imediata — sempre retornamos OK
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (err) {
    console.error('[Webhook] Erro:', err)
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  }
}
