import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { requireAdmin } from '@/lib/auth'

const WP_API_BASE =
  process.env.NEXT_PUBLIC_WP_URL ||
  'https://manager.simonetto.com.br'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()

    const { id } = await params

    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, mensagem: 'Token não encontrado.' },
        { status: 401 }
      )
    }

    const response = await fetch(
      `${WP_API_BASE}/wp-json/api/v1/leads/${id}/actions`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    )

    const data = await response.json().catch(() => null)

    return NextResponse.json(data, {
      status: response.status,
    })
  } catch (error) {
    console.error('Erro ao buscar ações:', error)

    return NextResponse.json(
      { success: false, mensagem: 'Erro interno.' },
      { status: 500 }
    )
  }
}
