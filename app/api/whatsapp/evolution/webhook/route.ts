import { NextRequest, NextResponse } from 'next/server'

const WP_API_BASE = process.env.NEXT_PUBLIC_API_URL

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('[Evolution Webhook] evento recebido:', body?.event, '| instance:', body?.instanceId ?? body?.instanceName)
    console.log('[Evolution Webhook] payload completo:', JSON.stringify(body))

    const res = await fetch(`${WP_API_BASE}/mensagens/evolution-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const wpText = await res.text()
    console.log('[Evolution Webhook] WordPress respondeu:', res.status, wpText)

    if (!res.ok) {
      console.error('[Evolution Webhook] WordPress retornou erro:', res.status)
    }

    // Evolution API exige resposta 200 imediata
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (err) {
    console.error('[Evolution Webhook] Erro:', err)
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  }
}
