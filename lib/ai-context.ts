/**
 * Busca o contexto agregado do endpoint /api/v1/ai/contexto e formata
 * em texto estruturado para o Groq.
 */

const WP_API = process.env.NEXT_PUBLIC_WP_URL

export async function fetchAiContexto(token: string, lojaIds?: number[]): Promise<string> {
  const params = lojaIds?.length ? `?loja_ids=${lojaIds.join(',')}` : ''
  const res = await fetch(`${WP_API}/wp-json/api/v1/ai/contexto${params}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`Erro ao buscar contexto IA: ${res.status}`)

  const d = await res.json()
  if (!d.success) throw new Error('Contexto indisponível')

  return buildContextString(d)
}

function pct(part: number, total: number): string {
  if (!total) return '0%'
  return `${((part / total) * 100).toFixed(1)}%`
}

function sortedEntries(obj: Record<string, number>): [string, number][] {
  return Object.entries(obj).sort((a, b) => b[1] - a[1])
}

function buildContextString(d: any): string {
  const total = d.volume?.total ?? 0
  const lines: string[] = []

  // ── Cabeçalho ─────────────────────────────────────────────────────────────
  const lojaNomes = (d.lojas as any[]).map((l: any) => l.nome).join(', ')
  lines.push(`DADOS DO CRM — ${lojaNomes || 'Todas as lojas'}`)
  lines.push(`Data de referência: ${new Date(d.gerado_em).toLocaleDateString('pt-BR')}`)
  lines.push(`Total de leads: ${total}`)
  lines.push('')

  // ── Volume e tendência ────────────────────────────────────────────────────
  const v = d.volume
  const crescStr = v.crescimento_pct !== null
    ? ` (${v.crescimento_pct > 0 ? '+' : ''}${v.crescimento_pct}% vs mês anterior)`
    : ''

  lines.push('VOLUME DE LEADS:')
  lines.push(`  Hoje: ${v.hoje}`)
  lines.push(`  Últimos 7 dias: ${v.ultimos_7_dias}`)
  lines.push(`  Este mês: ${v.este_mes}${crescStr}`)
  lines.push(`  Mês passado: ${v.mes_passado}`)
  lines.push('')

  // ── Alertas operacionais ──────────────────────────────────────────────────
  const a = d.alertas
  lines.push('ALERTAS OPERACIONAIS:')
  lines.push(`  Não atendidos: ${a.nao_atendidos} (${pct(a.nao_atendidos, total)})`)
  lines.push(`  Novos hoje sem atendimento: ${a.novos_hoje_sem_atendimento}`)
  lines.push(`  Em negociação sem follow-up agendado: ${a.sem_followup_agendado}`)
  lines.push(`  Follow-ups vencidos: ${a.followup_vencido}`)
  lines.push(`  Mensagens não lidas: ${a.mensagens_nao_lidas}`)
  if (a.tempo_medio_1o_atend_horas > 0) {
    lines.push(`  Tempo médio até 1º atendimento: ${a.tempo_medio_1o_atend_horas}h`)
  }
  lines.push('')

  // ── Status do funil ───────────────────────────────────────────────────────
  lines.push('STATUS DO FUNIL:')
  for (const [label, qtd] of sortedEntries(d.por_status)) {
    lines.push(`  ${label}: ${qtd} (${pct(qtd as number, total)})`)
  }
  lines.push('')

  // ── Temperatura ───────────────────────────────────────────────────────────
  const s = d.score
  lines.push('TEMPERATURA DOS LEADS:')
  for (const [temp, qtd] of sortedEntries(d.por_temperatura)) {
    lines.push(`  ${temp}: ${qtd} (${pct(qtd as number, total)})`)
  }
  lines.push(
    `  Score médio: ${s.medio} | Quente: ${s.quente} | Morno: ${s.morno} | Frio: ${s.frio}`
  )
  lines.push('')

  // ── Performance por atendente ─────────────────────────────────────────────
  lines.push('PERFORMANCE POR ATENDENTE:')
  for (const at of d.por_atendente as any[]) {
    lines.push(
      `  ${at.atendente}: ${at.total} leads | ${at.em_negociacao} em neg. | ${at.vendas} vendas | ${at.conv_pct}% conversão`
    )
  }
  lines.push('')

  // ── Principais cidades ────────────────────────────────────────────────────
  lines.push('PRINCIPAIS CIDADES (top 20):')
  for (const [cidade, info] of Object.entries(d.por_cidade) as any[]) {
    lines.push(`  ${cidade}: ${info.total}`)
    if (info.lojas?.length > 1) {
      for (const lj of info.lojas) {
        lines.push(`    → ${lj.loja}: ${lj.total}`)
      }
    }
  }
  lines.push('')

  // ── Faixa de investimento ─────────────────────────────────────────────────
  lines.push('FAIXA DE INVESTIMENTO:')
  for (const [label, qtd] of sortedEntries(d.por_investimento)) {
    lines.push(`  ${label}: ${qtd} (${pct(qtd as number, total)})`)
  }
  lines.push('')

  // ── Ambientes de interesse ────────────────────────────────────────────────
  lines.push('AMBIENTES DE INTERESSE:')
  for (const [label, qtd] of sortedEntries(d.por_interesse)) {
    lines.push(`  ${label}: ${qtd}`)
  }
  lines.push('')

  // ── Motivos de perda ──────────────────────────────────────────────────────
  if (Object.keys(d.motivos_nao_venda ?? {}).length > 0) {
    lines.push('MOTIVOS DE PERDA (venda não realizada):')
    for (const [label, qtd] of sortedEntries(d.motivos_nao_venda)) {
      lines.push(`  ${label}: ${qtd}`)
    }
    lines.push('')
  }

  // ── Tendência semanal ─────────────────────────────────────────────────────
  if ((d.tendencia_semanal as any[]).length > 0) {
    lines.push('TENDÊNCIA SEMANAL (últimas semanas):')
    for (const tw of d.tendencia_semanal as any[]) {
      lines.push(`  Semana de ${tw.inicio_semana}: ${tw.total} leads`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
