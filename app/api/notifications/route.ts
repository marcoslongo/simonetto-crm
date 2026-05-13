import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getLeads } from '@/lib/leads-service'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export async function GET() {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ success: false }, { status: 401 })
  }

  if (session.user.role !== 'administrator') {
    return NextResponse.json({ success: false }, { status: 403 })
  }

  try {
    const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS)

    // Busca um volume generoso de leads para filtrar por status e data_atualizacao
    const response = await getLeads(1, 500, undefined, undefined, undefined, undefined, session.token)

    const notifications = response.leads
      .filter(
        lead =>
          (lead.status === 'venda_realizada' || lead.status === 'venda_nao_realizada') &&
          new Date(lead.data_atualizacao) >= sevenDaysAgo
      )
      .sort((a, b) => new Date(b.data_atualizacao).getTime() - new Date(a.data_atualizacao).getTime())
      .slice(0, 50)

    return NextResponse.json({ success: true, notifications })
  } catch (error) {
    console.error('Erro ao buscar notificações:', error)
    return NextResponse.json(
      { success: false, mensagem: 'Erro ao buscar notificações' },
      { status: 500 }
    )
  }
}
