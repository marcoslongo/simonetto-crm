import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'

const WP_API_BASE = process.env.NEXT_PUBLIC_API_URL

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth_token')?.value ?? null
}

// GET /api/mensagens/[leadId] — buscar mensagens do lead
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ success: false, mensagem: 'Não autorizado.' }, { status: 401 })
  }

  const { leadId } = await params
  const token = await getAuthToken()

  const res = await fetch(`${WP_API_BASE}/mensagens/${leadId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

// POST /api/mensagens/[leadId] — enviar mensagem via WhatsApp + salvar no banco
export async function POST(
  req: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ success: false, mensagem: 'Não autorizado.' }, { status: 401 })
  }

  const { leadId } = await params
  const token = await getAuthToken()
  const body = await req.json()
  const { conteudo, telefone, loja_id } = body

  if (!conteudo?.trim()) {
    return NextResponse.json({ success: false, mensagem: 'Mensagem não pode ser vazia.' }, { status: 400 })
  }

  // 1. Envia via Meta Cloud API (se configurado)
  let wamid: string | null = null
  let statusMensagem = 'erro'

  const metaToken = process.env.META_WHATSAPP_TOKEN
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID

  if (metaToken && phoneNumberId && telefone) {
    try {
      const cleanPhone = telefone.replace(/\D/g, '')
      const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`

      const metaRes = await fetch(
        `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${metaToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phoneWithCountry,
            type: 'text',
            text: { body: conteudo },
          }),
        }
      )

      if (metaRes.ok) {
        const metaData = await metaRes.json()
        wamid = metaData?.messages?.[0]?.id ?? null
        statusMensagem = 'enviada'
      } else {
        const err = await metaRes.json()
        console.error('[Meta API]', err?.error?.message ?? 'Erro desconhecido')
      }
    } catch (err) {
      console.error('[Meta API] Falha ao enviar:', err)
    }
  }

  // 2. Salva no banco via WordPress REST API
  const wpPayload = {
    conteudo,
    direcao: 'enviada',
    status: statusMensagem,
    canal: 'whatsapp',
    loja_id: loja_id ?? session.user.loja_id,
    wamid,
  }

  const wpRes = await fetch(`${WP_API_BASE}/mensagens/${leadId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(wpPayload),
  })

  const wpData = await wpRes.json()

  if (!wpRes.ok) {
    return NextResponse.json(
      { success: false, mensagem: wpData?.mensagem ?? 'Erro ao salvar mensagem.' },
      { status: wpRes.status }
    )
  }

  return NextResponse.json(wpData, { status: 201 })
}
