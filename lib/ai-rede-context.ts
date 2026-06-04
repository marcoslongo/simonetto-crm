import { cookies } from 'next/headers'
import { getConversaoPorLoja, getTodasLojasSaude } from './api-loja'
import { getLojasServer } from './server-lojas-service'
import { getLeadsStatusTotalServer } from './server-leads-service'

export async function buildRedeContext(_token: string): Promise<string> {
  const cookieStore = await cookies()
  const authToken = cookieStore.get('auth_token')?.value

  if (!authToken) return ''

  const [lojas, conversao, statusTotal] = await Promise.all([
    getLojasServer(),
    getConversaoPorLoja(),
    getLeadsStatusTotalServer(),
  ])

  const lojasInput = (lojas as any[])
    .map(l => ({ id: Number(l.id), nome: l.nome }))
    .filter(l => l.id)

  const todasSaude = await getTodasLojasSaude(lojasInput)

  const lines: string[] = []
  lines.push('=== DADOS DA REDE DE 80 FRANQUEADOS ===')
  lines.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`)
  lines.push('')

  // Taxa de conversão da rede
  const totalStatus = statusTotal.venda_realizada + statusTotal.venda_nao_realizada + statusTotal.em_negociacao + statusTotal.nao_atendido
  const taxaRede = totalStatus > 0 ? ((statusTotal.venda_realizada / totalStatus) * 100).toFixed(1) : '0'
  lines.push('CONVERSÃO DA REDE:')
  lines.push(`  Taxa média: ${taxaRede}%`)
  lines.push(`  Vendas realizadas: ${statusTotal.venda_realizada}`)
  lines.push(`  Em negociação: ${statusTotal.em_negociacao}`)
  lines.push(`  Não atendidos: ${statusTotal.nao_atendido}`)
  lines.push(`  Total leads no funil: ${totalStatus}`)
  lines.push('')

  // SLA da rede
  const totalAtivos = todasSaude.reduce((s, l) => s + l.active_leads, 0)
  const totalBreach = todasSaude.reduce((s, l) => s + l.sla_breach_count, 0)
  const totalSemContato = todasSaude.reduce((s, l) => s + l.sla_nao_atendido, 0)
  const slaBreachPct = totalAtivos > 0 ? ((totalBreach / totalAtivos) * 100).toFixed(1) : '0'
  lines.push('SLA DA REDE:')
  lines.push(`  Leads ativos totais: ${totalAtivos}`)
  lines.push(`  SLA breach: ${totalBreach} (${slaBreachPct}% dos ativos)`)
  lines.push(`  Sem primeiro contato: ${totalSemContato}`)
  lines.push('')

  // Top 10 conversores
  const comDados = conversao.filter(l => l.total_leads >= 3)
  const sorted = [...comDados].sort((a, b) => b.taxa_conversao - a.taxa_conversao)
  if (sorted.length > 0) {
    lines.push('TOP 10 CONVERSORES:')
    sorted.slice(0, 10).forEach((l, i) => {
      lines.push(`  ${i + 1}. ${l.loja_nome}: ${l.taxa_conversao}% (${l.vendas_realizadas}/${l.total_leads} leads)`)
    })
    lines.push('')
  }

  // Bottom 10 conversores
  if (sorted.length > 5) {
    lines.push('10 FRANQUEADOS COM MENOR CONVERSÃO:')
    sorted.slice(-10).reverse().forEach((l, i) => {
      lines.push(`  ${i + 1}. ${l.loja_nome}: ${l.taxa_conversao}% (${l.vendas_realizadas}/${l.total_leads} leads)`)
    })
    lines.push('')
  }

  // Franqueados com SLA crítico
  const criticos = todasSaude
    .filter(l => l.sla_breach_pct >= 20 && l.active_leads > 0)
    .sort((a, b) => b.sla_breach_pct - a.sla_breach_pct)
    .slice(0, 10)

  if (criticos.length > 0) {
    lines.push('FRANQUEADOS COM SLA CRÍTICO (>20% breach):')
    criticos.forEach(l => {
      lines.push(`  ${l.loja_nome}: ${l.sla_breach_count} leads em breach (${l.sla_breach_pct}%), ${l.sla_nao_atendido} sem contato`)
    })
    lines.push('')
  }

  // Franqueados sobrecarregados
  const avgAtivos = totalAtivos / (todasSaude.filter(l => l.active_leads > 0).length || 1)
  const sobrecarregados = todasSaude
    .filter(l => l.active_leads > avgAtivos * 1.8)
    .sort((a, b) => b.active_leads - a.active_leads)
    .slice(0, 5)

  if (sobrecarregados.length > 0) {
    lines.push(`FRANQUEADOS SOBRECARREGADOS (>1.8× da média ${avgAtivos.toFixed(0)} ativos):`)
    sobrecarregados.forEach(l => {
      lines.push(`  ${l.loja_nome}: ${l.active_leads} leads ativos`)
    })
    lines.push('')
  }

  lines.push('=== FIM DOS DADOS DA REDE ===')

  return lines.join('\n')
}
