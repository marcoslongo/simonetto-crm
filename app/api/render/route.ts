import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'

export const maxDuration = 60

const WP_API_BASE = process.env.NEXT_PUBLIC_API_URL

const DEFAULT_PROMPT =
  'photorealistic photograph, same composition and structure, realistic materials, ' +
  'natural lighting, detailed textures, shadows, professional photography, high quality, 8k'

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth_token')?.value ?? null
}

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const lojaId =
    searchParams.get('loja_id') ?? session.user.loja_ids?.[0]?.toString() ?? null

  if (!lojaId) return NextResponse.json({ success: true, renders: [] })

  const token = await getAuthToken()
  const res = await fetch(`${WP_API_BASE}/renders?loja_id=${lojaId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const stabilityKey = process.env.STABILITY_API_KEY
  if (!stabilityKey) {
    return NextResponse.json(
      { success: false, mensagem: 'Chave da Stability AI não configurada no servidor.' },
      { status: 500 }
    )
  }

  const formData = await req.formData()
  const imageFile = formData.get('image') as File | null
  const prompt = (formData.get('prompt') as string | null)?.trim() || DEFAULT_PROMPT
  const titulo = (formData.get('titulo') as string | null)?.trim() || null
  const lojaIdRaw = formData.get('loja_id') as string | null
  const lojaId = lojaIdRaw ? Number(lojaIdRaw) : (session.user.loja_ids?.[0] ?? null)

  if (!imageFile) {
    return NextResponse.json({ success: false, mensagem: 'Imagem não enviada.' }, { status: 400 })
  }
  if (!lojaId) {
    return NextResponse.json({ success: false, mensagem: 'loja_id não encontrado.' }, { status: 400 })
  }

  const buffer = Buffer.from(await imageFile.arrayBuffer())
  const originalBase64 = buffer.toString('base64')

  // Chama Stability AI — endpoint "structure" preserva a composição do render
  let resultBase64: string
  try {
    const sdForm = new FormData()
    sdForm.append(
      'image',
      new Blob([buffer], { type: imageFile.type || 'image/jpeg' }),
      imageFile.name || 'render.jpg'
    )
    sdForm.append('prompt', prompt)
    sdForm.append('control_strength', '0.7')
    sdForm.append('output_format', 'png')

    const sdRes = await fetch(
      'https://api.stability.ai/v2beta/stable-image/control/structure',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stabilityKey}`,
          Accept: 'image/*',
        },
        body: sdForm,
      }
    )

    if (!sdRes.ok) {
      const errData = await sdRes.json().catch(() => ({})) as { errors?: string[]; message?: string }
      const msg = errData.errors?.[0] ?? errData.message ?? `Stability AI retornou ${sdRes.status}`
      return NextResponse.json({ success: false, mensagem: msg }, { status: 500 })
    }

    const imageBuffer = await sdRes.arrayBuffer()
    resultBase64 = Buffer.from(imageBuffer).toString('base64')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao gerar imagem.'
    return NextResponse.json({ success: false, mensagem: message }, { status: 500 })
  }

  // Salva no WordPress
  const token = await getAuthToken()
  let savedRender = null

  try {
    const wpRes = await fetch(`${WP_API_BASE}/renders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        loja_id: lojaId,
        titulo,
        prompt_usado: prompt,
        imagem_original_base64: originalBase64,
        imagem_resultado_base64: resultBase64,
      }),
    })
    const wpData = await wpRes.json()
    if (wpRes.ok && wpData.success) savedRender = wpData.render
  } catch {
    // Falha ao salvar não bloqueia o retorno da imagem
  }

  return NextResponse.json(
    { success: true, render: savedRender, resultado_base64: resultBase64 },
    { status: 201 }
  )
}
