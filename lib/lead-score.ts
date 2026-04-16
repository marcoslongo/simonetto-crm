import { Lead } from "@/lib/types"

export type Classificacao = "quente" | "morno" | "frio"

export function classificarLead(lead: Lead): {
  score: number
  classificacao: Classificacao
  motivos: string[]
} {
  let score = 0
  const motivos: string[] = []

  // 💰 Expectativa de investimento
  if (lead.expectativa_investimento) {
    const valor = lead.expectativa_investimento.toLowerCase()

    if (valor.includes("acima") || valor.includes("100")) {
      score += 30
      motivos.push("Alto investimento esperado")
    } else if (valor.includes("50")) {
      score += 20
      motivos.push("Investimento médio esperado")
    } else {
      score += 10
      motivos.push("Baixo investimento esperado")
    }
  }

  // 💬 Mensagem (intenção + tamanho)
  if (lead.mensagem) {
    const msg = lead.mensagem.toLowerCase()
    const palavras = msg.trim().split(/\s+/).length

    // Intenção de compra direta
    if (
      msg.includes("quero comprar") ||
      msg.includes("tenho interesse") ||
      msg.includes("urgente") ||
      msg.includes("preciso") ||
      msg.includes("quero adquirir") ||
      msg.includes("fechar")
    ) {
      score += 30
      motivos.push("Intenção de compra explícita")
    }

    // Dúvidas sobre preço (sinal de interesse)
    if (
      msg.includes("preço") ||
      msg.includes("valor") ||
      msg.includes("quanto custa") ||
      msg.includes("condições") ||
      msg.includes("parcel")
    ) {
      score += 20
      motivos.push("Interesse em preço/condições")
    }

    // Perguntas técnicas / comparações (sinal de pesquisa ativa)
    if (
      msg.includes("modelo") ||
      msg.includes("diferença") ||
      msg.includes("comparar") ||
      msg.includes("qual o melhor") ||
      msg.includes("especificaç")
    ) {
      score += 10
      motivos.push("Pesquisa ativa de produto")
    }

    // Mensagem longa = lead mais engajado
    if (palavras >= 30) {
      score += 20
      motivos.push("Mensagem longa e detalhada")
    } else if (palavras >= 15) {
      score += 10
      motivos.push("Mensagem moderadamente detalhada")
    }

    // Urgência temporal
    if (
      msg.includes("hoje") ||
      msg.includes("essa semana") ||
      msg.includes("rápido") ||
      msg.includes("quanto antes")
    ) {
      score += 15
      motivos.push("Urgência temporal indicada")
    }
  }

  // 📍 Localização próxima à loja
  if (lead.cidade && lead.loja_cidade) {
    if (lead.cidade === lead.loja_cidade) {
      score += 10
      motivos.push("Mesma cidade da loja")
    }
  }

  // 📧 Dados de contato completos
  if (lead.email) {
    score += 5
    motivos.push("E-mail fornecido")
  }
  if (lead.telefone) {
    score += 5
    motivos.push("Telefone fornecido")
  }

  // 🧠 Normalização
  score = Math.min(score, 100)

  let classificacao: Classificacao = "frio"
  if (score >= 60) classificacao = "quente"
  else if (score >= 30) classificacao = "morno"

  return { score, classificacao, motivos }
}