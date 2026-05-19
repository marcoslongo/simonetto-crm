import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { cookies } from 'next/headers'

const WP_API_BASE = process.env.NEXT_PUBLIC_WP_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/wp-json/api/v1', '')

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()

    const { id } = await params

    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, mensagem: 'Token não encontrado.' },
        { status: 401 }
      )
    }

    const res = await fetch(`${WP_API_BASE}/wp-json/api/v1/lojas/${id}/integration`, {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('Erro ao buscar integração LP:', error)
    return NextResponse.json(
      { success: false, mensagem: 'Erro interno.' },
      { status: 500 }
    )
  }
}
