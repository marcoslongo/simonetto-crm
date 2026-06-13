import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'

const WP_API_BASE = process.env.NEXT_PUBLIC_API_URL

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

  // Repassa o arquivo para o endpoint customizado do tema (evita check de upload_files da REST core)
  const fd = new FormData()
  fd.append('file', file)

  const wpRes = await fetch(`${WP_API_BASE}/mensagens/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: fd,
  })

  if (!wpRes.ok) {
    const err = await wpRes.json().catch(() => ({}))
    return NextResponse.json(
      { success: false, mensagem: (err as Record<string, string>)?.mensagem ?? 'Erro ao fazer upload.' },
      { status: wpRes.status }
    )
  }

  const media = await wpRes.json() as { success: boolean; url: string; filename: string; mimetype: string }

  return NextResponse.json({
    success: true,
    url: media.url,
    filename: media.filename,
    mimetype: media.mimetype,
  })
}
