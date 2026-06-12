import { NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { fetchAiContexto } from '@/lib/ai-context'
import Groq from 'groq-sdk'

export const maxDuration = 60

export async function POST(req: Request) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  if (isAdmin(session.user)) return NextResponse.json({ success: false }, { status: 403 })
  if (!session.user.is_gerente) return NextResponse.json({ success: false }, { status: 403 })

  const lojaIds = session.user.loja_ids
  if (!lojaIds.length) {
    return NextResponse.json({ success: false, error: 'Nenhuma loja associada' }, { status: 400 })
  }

  const { pergunta } = await req.json()
  if (!pergunta?.trim()) {
    return NextResponse.json({ success: false, error: 'Missing pergunta' }, { status: 400 })
  }

  // O endpoint WP usa o token do gerente para filtrar automaticamente por loja_ids via ACF.
  // Passamos lojaIds explicitamente como fallback (o PHP usa o token como fonte primária).
  const context = await fetchAiContexto(session.token, lojaIds)

  const lojaNome = session.user.loja_nome || 'sua loja'

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `Você é um consultor de vendas especializado em móveis planejados da Simonetto. Está auxiliando o gerente de "${lojaNome}" com análises precisas sobre os leads da sua loja. Responda sempre em português brasileiro, de forma direta e focada na realidade operacional do gerente. Use os números exatos fornecidos nos dados.`,
      },
      {
        role: 'user',
        content: `Dados da minha loja:\n${context}\n\nPergunta:\n${pergunta}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 2048,
  })

  const resposta = completion.choices[0]?.message?.content || ''

  return NextResponse.json({ success: true, resposta })
}
