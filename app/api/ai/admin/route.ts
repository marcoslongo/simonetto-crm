import { NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { fetchAiContexto } from '@/lib/ai-context'
import { buildRedeContext } from '@/lib/ai-rede-context'
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

  const [context, redeContext] = await Promise.all([
    fetchAiContexto(session.token).catch(() => ''),
    buildRedeContext(session.token).catch(() => ''),
  ])

  const fullContext = [context, redeContext].filter(Boolean).join('\n\n')

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          'Você é um analista especializado em gestão de redes de franquias de móveis planejados da Simonetto. ' +
          'Você gerencia uma rede de 80 franqueados e tem acesso a dados em tempo real de performance, SLA e conversão. ' +
          'Responda sempre em português brasileiro. Seja direto, use os números exatos dos dados e dê insights acionáveis. ' +
          'Quando identificar franqueados com problemas, cite-os pelo nome. ' +
          'Priorize sempre: 1) Alertas operacionais urgentes, 2) Comparativos entre franqueados, 3) Recomendações concretas.',
      },
      {
        role: 'user',
        content: `Dados em tempo real da rede:\n${fullContext}\n\nPergunta do administrador:\n${pergunta}`,
      },
    ],
    temperature: 0.4,
    max_tokens: 2048,
  })

  const resposta = completion.choices[0]?.message?.content || ''

  return NextResponse.json({ success: true, resposta })
}
