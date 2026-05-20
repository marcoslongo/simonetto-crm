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

// POST /api/mensagens/[leadId] — enviar mensagem via Evolution API + salvar (lógica no PHP)
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

  const wpPayload = {
    conteudo,
    telefone,
    direcao: 'enviada',
    canal: 'whatsapp',
    loja_id: loja_id ?? session.user.loja_id,
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
      { success: false, mensagem: wpData?.mensagem ?? 'Erro ao enviar mensagem.' },
      { status: wpRes.status }
    )
  }

  return NextResponse.json(wpData, { status: 201 })
}
