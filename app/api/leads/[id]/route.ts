import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const WP_API_BASE = process.env.NEXT_PUBLIC_WP_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/wp-json/api/v1', '')

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, mensagem: 'Não autenticado.' },
        { status: 401 }
      )
    }

    const { id } = await params

    const res = await fetch(`${WP_API_BASE}/wp-json/api/v1/leads/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.token}`,
        'Accept': 'application/json',
      },
    })

    const data = await res.json()

    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('Erro ao excluir lead:', error)
    return NextResponse.json(
      { success: false, mensagem: 'Erro interno.' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, mensagem: 'Não autenticado.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const token = session.token
    const body = await req.json()

    const res = await fetch(`${WP_API_BASE}/wp-json/api/v1/leads/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('Erro ao atualizar lead:', error)
    return NextResponse.json(
      { success: false, mensagem: 'Erro interno.' },
      { status: 500 }
    )
  }
}