import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import Groq from 'groq-sdk'

export const maxDuration = 30

const WP_API = process.env.NEXT_PUBLIC_WP_URL

type Ctx = { params: Promise<{ id: string }> }

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const STATUS_LABELS: Record<string, string> = {
  nao_atendido: 'Não atendido',
  em_negociacao: 'Em negociação',
  venda_realizada: 'Venda realizada',
  venda_nao_realizada: 'Venda não realizada',
}

const CLASSIFICACAO_LABELS: Record<string, string> = {
  quente: 'Quente (alta probabilidade)',
  morno: 'Morno (probabilidade média)',
  frio: 'Frio (baixa probabilidade)',
}

const INVESTMENT_LABELS: Record<string, string> = {
  '35-50k': 'R$ 35.000 a R$ 50.000',
  '50-100k': 'R$ 50.000 a R$ 100.000',
  '100-150k': 'R$ 100.000 a R$ 150.000',
  '150-200k': 'R$ 150.000 a R$ 200.000',
  'acima-250k': 'Acima de R$ 250.000',
}

export async function POST(req: Request, { params }: Ctx) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const { id } = await params
  const { tipo, lead } = await req.json()

  if (!tipo || !lead) {
    return NextResponse.json({ success: false, error: 'Missing tipo or lead' }, { status: 400 })
  }

  const authHeaders = {
    Authorization: `Bearer ${session.token}`,
    Accept: 'application/json',
  }

  const [notasRes, followupsRes] = await Promise.all([
    fetch(`${WP_API}/wp-json/api/v1/leads/${id}/notas`, { headers: authHeaders, cache: 'no-store' }),
    fetch(`${WP_API}/wp-json/api/v1/leads/${id}/followups`, { headers: authHeaders, cache: 'no-store' }),
  ])

  const notasData = notasRes.ok ? await notasRes.json() : { notas: [] }
  const followupsData = followupsRes.ok ? await followupsRes.json() : { followups: [] }
  const notas: any[] = notasData.notas || []
  const followups: any[] = followupsData.followups || []

  const fmtDate = (d: string) =>
    new Date(d).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  const interesses = lead.interesse
    ? lead.interesse.split(',').map((i: string) => i.trim()).join(', ')
    : 'Não informado'

  const investimento = INVESTMENT_LABELS[lead.expectativa_investimento] || lead.expectativa_investimento || 'Não informado'

  const notasText = notas.length > 0
    ? notas.map((n: any) => `- [${fmtDate(n.criado_em)}] ${n.usuario_nome}: ${n.conteudo}`).join('\n')
    : 'Nenhuma nota registrada'

  const followupsText = followups.length > 0
    ? followups.map((f: any) => {
        const status = f.concluido ? '✓ Concluído' : `Agendado para ${fmtDate(f.agendado_para)}`
        return `- ${status}: ${f.descricao}`
      }).join('\n')
    : 'Nenhum follow-up registrado'

  const leadContext = `
Nome: ${lead.nome}
Localização: ${lead.cidade}, ${lead.estado}
Interesses: ${interesses}
Orçamento previsto: ${investimento}
Status: ${STATUS_LABELS[lead.status] || lead.status}
Temperatura: ${CLASSIFICACAO_LABELS[lead.classificacao] || 'Não classificado'}
Score de qualidade: ${lead.score ?? 'N/A'}/100
Loja: ${lead.loja_nome || 'Não atribuída'} (${lead.loja_cidade || ''}, ${lead.loja_estado || ''})
Atendente responsável: ${lead.responsavel_nome || 'Não atribuído'}
Criado em: ${fmtDate(lead.data_criacao)}
Última atualização: ${fmtDate(lead.data_atualizacao)}
Mensagem inicial do lead: ${lead.mensagem || 'Nenhuma'}

Notas internas da equipe:
${notasText}

Follow-ups registrados:
${followupsText}
  `.trim()

  const prompts: Record<string, { system: string; user: string }> = {
    resumo: {
      system: 'Você é um assistente de CRM especializado em vendas de móveis planejados da marca Simonetto. Responda sempre em português brasileiro, de forma direta, profissional e objetiva.',
      user: `Crie um resumo executivo deste lead para o atendente de vendas. Use tópicos curtos e linguagem comercial. Destaque: perfil e localização do cliente, interesses e orçamento, estágio atual na negociação, histórico relevante (notas e follow-ups), e pontos de atenção para o próximo contato.

Dados do lead:
${leadContext}`,
    },
    followup: {
      system: 'Você é um consultor de vendas especializado em móveis planejados. Responda sempre em português brasileiro.',
      user: `Com base no histórico deste lead, sugira a próxima ação de follow-up mais eficaz. Inclua: melhor canal de contato, momento ideal, o que abordar na conversa, e como conduzir para avançar na negociação. Seja específico e prático.

Dados do lead:
${leadContext}`,
    },
    mensagem: {
      system: 'Você é especializado em comunicação de vendas para móveis planejados da Simonetto. Escreva mensagens naturais, calorosas e não invasivas, em português brasileiro.',
      user: `Crie um rascunho de mensagem para enviar a este lead via WhatsApp. A mensagem deve ser personalizada com o nome e interesses do cliente, ter no máximo 3 parágrafos curtos, soar natural (não robótica), e incluir uma chamada para ação sutil. Use poucos emojis.

Dados do lead:
${leadContext}`,
    },
    analise: {
      system: 'Você é um analista de vendas especializado em móveis planejados. Responda sempre em português brasileiro com análises precisas e baseadas nos dados fornecidos.',
      user: `Analise a probabilidade de conversão deste lead e apresente de forma estruturada:
1. Probabilidade estimada de fechamento (%) com justificativa
2. Pontos fortes que favorecem a venda
3. Riscos e obstáculos identificados
4. Recomendação estratégica para o atendente

Dados do lead:
${leadContext}`,
    },
  }

  const prompt = prompts[tipo]
  if (!prompt) {
    return NextResponse.json({ success: false, error: 'Invalid tipo' }, { status: 400 })
  }

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  })

  const texto = completion.choices[0]?.message?.content || ''

  return NextResponse.json({ success: true, texto })
}
