import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const WP_API_BASE = process.env.NEXT_PUBLIC_WP_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/wp-json/api/v1', '')

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ success: false, mensagem: 'Não autenticado.' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const params = new URLSearchParams()
  if (searchParams.get('loja_id')) params.set('loja_id', searchParams.get('loja_id')!)
  if (searchParams.get('from'))    params.set('from', searchParams.get('from')!)
  if (searchParams.get('to'))      params.set('to', searchParams.get('to')!)

  const qs = params.toString()
  const res = await fetch(`${WP_API_BASE}/wp-json/api/v1/leads-vnr-stats${qs ? `?${qs}` : ''}`, {
    headers: {
      Authorization: `Bearer ${session.token}`,
      Accept: 'application/json',
    },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
