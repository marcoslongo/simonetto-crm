import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getLeads } from '@/lib/leads-service'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const NOTIF_PER_STATUS = 60

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

    const [realizadas, naoRealizadas] = await Promise.all([
      getLeads(1, NOTIF_PER_STATUS, undefined, undefined, undefined, undefined, session.token, undefined, 'venda_realizada'),
      getLeads(1, NOTIF_PER_STATUS, undefined, undefined, undefined, undefined, session.token, undefined, 'venda_nao_realizada'),
    ])

    const notifications = [...realizadas.leads, ...naoRealizadas.leads]
      .filter(lead => new Date(lead.data_atualizacao) >= sevenDaysAgo)
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
