import { NextRequest, NextResponse } from 'next/server'
import { getSession, isMaster, podeAtribuirLeads, canAccessLoja } from '@/lib/auth'
import { getLeadsLast12MonthsServer } from '@/lib/server-leads-service'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const { searchParams } = request.nextUrl
  const origem = searchParams.get('origem') as 'industria' | 'proprio' | null
  const lojaId = searchParams.get('loja_id') ?? undefined

  if (origem === 'proprio') {
    // Masters veem tudo; lojistas com podeAtribuirLeads veem próprios da sua loja
    const podeVerProprio =
      isMaster(session.user) ||
      (podeAtribuirLeads(session.user) && !!lojaId && canAccessLoja(session.user, Number(lojaId)))
    if (!podeVerProprio) {
      return NextResponse.json({ success: false }, { status: 403 })
    }
  }

  try {
    const data = await getLeadsLast12MonthsServer(origem ?? undefined, lojaId)
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
