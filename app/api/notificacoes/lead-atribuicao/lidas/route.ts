import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const WP = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ??
           'https://manager.simonetto.com.br/wp-json'

export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const res = await fetch(`${WP}/api/v1/notificacoes/lead-atribuicao/lidas`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.token}` },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
