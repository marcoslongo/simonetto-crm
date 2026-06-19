import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'

const WP_API_BASE = process.env.NEXT_PUBLIC_API_URL

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth_token')?.value ?? null
}

// GET /api/leads/[leadId]/whatsapp-avatar
// Busca a foto de perfil do WhatsApp chamando o Evolution GO diretamente do Next.js
// (WordPress não consegue alcançar o Evolution GO por restrições de rede no servidor)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ avatarUrl: null }, { status: 401 })

  const { id: leadId } = await params
  const token = await getAuthToken()

  // 1. Busca credenciais do lead no WordPress
  const credsRes = await fetch(`${WP_API_BASE}/leads/${leadId}/whatsapp-creds`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  console.log(`[whatsapp-avatar] lead=${leadId} creds status=${credsRes.status}`)
  if (!credsRes.ok) {
    const body = await credsRes.text()
    console.log(`[whatsapp-avatar] creds error body:`, body)
    return NextResponse.json({ avatarUrl: null })
  }

  const creds = await credsRes.json() as {
    success: boolean
    evo_url: string
    evo_key: string
    instance: string
    phone: string
    debug?: unknown
  }

  console.log(`[whatsapp-avatar] creds:`, { success: creds.success, instance: creds.instance, phone: creds.phone, debug: creds.debug })

  if (!creds.success) return NextResponse.json({ avatarUrl: null })

  // 2. Chama Evolution GO diretamente do Next.js (Node.js)
  let avatarUrl: string | null = null
  try {
    const evoUrl = `${creds.evo_url.replace(/\/$/, '')}/user/avatar`
    console.log(`[whatsapp-avatar] calling Evolution GO: ${evoUrl}`)
    const avatarRes = await fetch(evoUrl, {
      method: 'POST',
      headers: {
        apikey: creds.evo_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instanceId: creds.instance,
        number: creds.phone,
        preview: false,
      }),
      signal: AbortSignal.timeout(10000),
    })

    const rawBody = await avatarRes.text()
    console.log(`[whatsapp-avatar] Evolution GO status=${avatarRes.status} body=`, rawBody)

    if (avatarRes.ok) {
      const data = JSON.parse(rawBody) as Record<string, unknown>
      avatarUrl = (data.profilePictureUrl as string)
        ?? (data.avatar as string)
        ?? (data.url as string)
        ?? null
    }
  } catch (err) {
    console.log(`[whatsapp-avatar] Evolution GO error:`, err)
  }

  // 3. Salva no WordPress se encontrou
  if (avatarUrl) {
    await fetch(`${WP_API_BASE}/leads/${leadId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ avatar_url: avatarUrl }),
    }).catch(() => {})
  }

  return NextResponse.json({ avatarUrl })
}
