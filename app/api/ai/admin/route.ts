import { NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { fetchAiContexto } from '@/lib/ai-context'
import Groq from 'groq-sdk'

export const maxDuration = 60

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })
  if (!isAdmin(session.user)) return NextResponse.json({ success: false }, { status: 403 })

  const { pergunta } = await req.json()
  if (!pergunta?.trim()) {
    return NextResponse.json({ success: false, error: 'Missing pergunta' }, { status: 400 })
  }

  const context = await fetchAiContexto(session.token)

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          'Você é um analista de dados especializado em CRM de vendas de móveis planejados da Simonetto. Responda sempre em português brasileiro, de forma clara, estruturada e com insights acionáveis. Use os números exatos fornecidos nos dados.',
      },
      {
        role: 'user',
        content: `Dados atuais do CRM:\n${context}\n\nPergunta do administrador:\n${pergunta}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 2048,
  })

  const resposta = completion.choices[0]?.message?.content || ''

  return NextResponse.json({ success: true, resposta })
}
