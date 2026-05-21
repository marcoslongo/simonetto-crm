import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'

const WP_URL = process.env.NEXT_PUBLIC_WP_URL

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth_token')?.value ?? null
}

// POST /api/mensagens/upload — faz upload de arquivo para a media library do WordPress
// Retorna: { success, url, filename, mimetype }
export async function POST(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ success: false, mensagem: 'Não autorizado.' }, { status: 401 })
  }

  const token = await getAuthToken()
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ success: false, mensagem: 'Nenhum arquivo enviado.' }, { status: 400 })
  }

  const MAX_SIZE = 16 * 1024 * 1024 // 16 MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ success: false, mensagem: 'Arquivo muito grande (máx. 16 MB).' }, { status: 400 })
  }

  const buffer = await file.arrayBuffer()

  const wpRes = await fetch(`${WP_URL}/wp-json/wp/v2/media`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.name)}"`,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: buffer,
  })

  if (!wpRes.ok) {
    const err = await wpRes.json().catch(() => ({}))
    return NextResponse.json(
      { success: false, mensagem: err?.message ?? 'Erro ao fazer upload.' },
      { status: wpRes.status }
    )
  }

  const media = await wpRes.json()

  return NextResponse.json({
    success: true,
    url: media.source_url as string,
    filename: file.name,
    mimetype: file.type,
  })
}
