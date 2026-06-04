import { NextRequest, NextResponse } from 'next/server'
import { getSession, setSession } from '@/lib/auth'
import { cookies } from 'next/headers'

const WP_API_BASE = process.env.WORDPRESS_API_URL || 'https://manager.simonetto.com.br/wp-json'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) {
    return NextResponse.json({ success: false, mensagem: 'Não autenticado.' }, { status: 401 })
  }

  // Recebe o formData do cliente e repassa direto ao WordPress
  const formData = await request.formData()

  const wpRes = await fetch(`${WP_API_BASE}/api/v1/usuarios/me/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  const data = await wpRes.json()

  if (!wpRes.ok || !data.success) {
    return NextResponse.json(
      { success: false, mensagem: data.mensagem ?? 'Erro ao fazer upload.' },
      { status: wpRes.status }
    )
  }

  // Atualiza o avatar_url na sessão para que o server component reflita sem novo login
  const session = await getSession()
  if (session) {
    session.user.avatar_url = data.avatar_url
    await setSession(session)
  }

  return NextResponse.json({ success: true, avatar_url: data.avatar_url })
}
