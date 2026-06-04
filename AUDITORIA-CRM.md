# Auditoria Completa — Simonetto CRM
**Perfis: Atendente & Gerente · Data: 04/06/2026**

---

## SUMÁRIO EXECUTIVO

O CRM está tecnicamente sólido — Server Components, Suspense, colunas dinâmicas, polling em tempo real. Mas o produto sofre de um problema clássico de primeira versão: **ele exibe dados em vez de entregar respostas**. Um atendente abre o dashboard e vê números. Ele precisava ver *"você tem 3 leads parados há mais de 2 dias — aja agora"*. O gap entre dados e decisão é o principal problema a resolver.

---

## PARTE 1 — PROBLEMAS ENCONTRADOS

### 🔴 ALTA GRAVIDADE

---

**P-01 · Tela: `/crm` (Resumo)**
**Problema:** `KanbanStatsCards` e `FunilStatus` são redundantes — ambos mostram contagem por status na mesma tela, em formatos diferentes (cards + barra de progresso). O usuário processa a mesma informação duas vezes sem ganho adicional.
**Impacto:** Cognitive overload, perda de espaço para informações acionáveis.

---

**P-02 · Tela: `/crm` (Resumo) — Perfil Atendente**
**Problema:** O dashboard principal não tem **nenhum indicador pessoal**. Mostra totais da loja, mas o atendente precisa saber: quantos leads são meus? Qual minha taxa de conversão? Tenho follow-ups atrasados? O CRM não responde nenhuma dessas perguntas sem navegar para o Kanban.
**Impacto:** O atendente usa o Kanban como dashboard principal (workaround), ignorando o `/crm`. A tela perde propósito.

---

**P-03 · Tela: `/crm/desempenho`**
**Problema:** 7 gráficos em sequência vertical sem hierarquia narrativa. Não há separação clara de "O que aconteceu?" vs "Por quê?" vs "O que fazer?". O Gerente chega na tela e precisa interpretar 7 visualizações independentes para construir sozinho uma história.
**Impacto:** A tela é analítica mas não é decisória. Alto esforço cognitivo para baixo resultado prático.

---

**P-04 · Gráfico: `ChartFunilKanban` (`chart-funil-kanban.tsx`)**
**Problema:** O componente recebe `nao_atendido`, `em_negociacao`, `venda_realizada`, `venda_nao_realizada` como props fixas — ignora completamente as colunas customizadas do kanban. Se a loja criou "Em Análise" ou "Aguardando Proposta", esses leads somem do funil.
**Impacto:** O gráfico de funil mostra dados incorretos/incompletos para lojas com fluxo customizado. Decisão baseada em dado errado.

---

**P-05 · Componente: `fetchLeadsByStatusPaginated` (`leads-actions.ts`)**
**Problema:** Para calcular os totais do modal de status, o código faz `getMultiLojaLeads(session!.user.loja_ids, 1000)` e filtra client-side. Com lojas que têm mais de 1000 leads, os totais ficam errados silenciosamente.
**Impacto:** Dado errado exibido ao usuário (modal mostra "55 leads" mas pode ser 300).

---

### 🟡 MÉDIA GRAVIDADE

---

**P-06 · Tipografia**
**Problema:** Toda a interface usa a fonte padrão do Next.js/sistema operacional. Não há escolha tipográfica intencional. Nenhum caráter visual próprio.
**Impacto:** Percepção de valor reduzida. O CRM parece um template, não um produto.

---

**P-07 · Cores e contraste**
**Problema:** O gradiente `from-slate-50 to-slate-100` aplicado em praticamente todos os cards é quase invisível (variação de ~2% de luminosidade). Cria ruído visual sem contribuir esteticamente. Os cards se confundem com o background.
**Impacto:** Baixa hierarquia visual. Difícil separar card de container.

---

**P-08 · Tela: `/crm/comportamento`**
**Problema:** A tela tem apenas 2 gráficos (Horário e Dispositivo) e nenhuma narrativa conectando os dados. "Pico às 14h em mobile" → e daí? Não há recomendação, comparativo histórico ou ação sugerida.
**Impacto:** Tela subutilizada. Baixa frequência de acesso esperada.

---

**P-09 · Grid do `KanbanStatsCards` com colunas > 4**
**Problema:** O grid é fixo em `md:grid-cols-2 lg:grid-cols-4`. Com 7 colunas customizadas (como na screenshot), os cards extrapolam em 2 linhas com alturas inconsistentes e um card viúvo na última linha.
**Impacto:** Layout quebrado visualmente em lojas com muitas colunas.

---

**P-10 · Ausência de estados vazios consistentes**
**Problema:** Alguns componentes têm empty states elegantes (ícone + mensagem), outros simplesmente renderizam nada ou um card vazio. `LeadsRecentes`, `ChartFunilPorAtendente` e `ChartConversaoPorLoja` não têm empty state padronizado.
**Impacto:** Telas em branco em ambientes novos/sem dados, confundindo novos usuários.

---

**P-11 · `ChartTempoPorEtapa` com altura fixa (`h-56`)**
**Problema:** Com 8+ etapas (colunas customizadas), o gráfico fica espremido, as labels se sobrepõem e os valores ficam ilegíveis. Não adapta a altura ao volume de dados.
**Impacto:** Gráfico ilegível para lojas com funil customizado.

---

**P-12 · Tela: `/crm/unidades` — Cards sem dado de conversão**
**Problema:** Os cards de unidades mostram "Total de leads" e "Leads hoje", mas não mostram taxa de conversão — a métrica mais importante para comparação entre unidades.
**Impacto:** O Gerente com múltiplas unidades não consegue identificar rapidamente qual unidade está performando melhor/pior.

---

### 🟢 BAIXA GRAVIDADE

---

**P-13 · Emojis em `TemperaturaLeads`**
**Problema:** O componente usa emojis (🔥, 🌡️, ❄️) como ícones. Inconsistente com o restante da interface que usa `lucide-react`.
**Impacto:** Quebra de consistência visual.

---

**P-14 · Ausência de animações de entrada**
**Problema:** Charts e cards aparecem instantaneamente após o Suspense. A transição de skeleton → conteúdo é abrupta. Não há `fade-in`, `stagger` ou qualquer animação de revelação.
**Impacto:** Experiência de carregamento brusca, perda de percepção de polimento.

---

**P-15 · Rótulos de status inconsistentes**
**Problema:** O mesmo status aparece com labels diferentes em componentes diferentes:
- `KanbanStatsCards`: "Não Atendidos" (plural)
- `FunilStatus`: "Não Atendido" (singular)
- `LeadsRecentes`: "Não Atendido" (singular)
- `label_map` no PHP: "Não atendido" (minúsculas)

**Impacto:** Microinconsistência que reduz credibilidade do produto.

---

**P-16 · Sem cache — todas as chamadas usam `cache: 'no-store'`**
**Problema:** Absolutamente todas as chamadas ao backend usam `cache: 'no-store'`. Dados como colunas do kanban, lista de lojas e stats mensais não mudam a cada segundo e poderiam ser cacheados por minutos.
**Impacto:** Performance desnecessariamente baixa. Custo de servidor elevado.

---

## PARTE 2 — ANÁLISE POR PERFIL

### Atendente — Perguntas que o CRM não responde hoje

| Pergunta | Respondida? | Onde encontrar |
|---|---|---|
| Quantos leads recebi? | ❌ | Não existe visão pessoal |
| Quantos contatos realizei? | ❌ | Não existe |
| Minha taxa de conversão? | ❌ | Não existe |
| Meu desempenho no período? | ❌ | Não existe |
| Metas atingidas? | ❌ | Não existe conceito de meta |
| Leads pendentes de ação? | ⚠️ Parcial | Apenas no Kanban (badge SLA) |
| Gargalos no meu funil? | ❌ | Não existe visão individual |

> **Diagnóstico:** O atendente não tem dashboard. Ele tem o Kanban como tela operacional e nada mais. O `/crm` mostra dados da loja, não dele. A tela perde propósito para esse perfil.

---

### Gerente — Perguntas que o CRM responde (parcialmente)

| Pergunta | Respondida? | Qualidade |
|---|---|---|
| Desempenho da equipe | ⚠️ | `ChartFunilPorAtendente` — mas sem filtro de período |
| Comparativo entre vendedores | ⚠️ | Tabela existe, sem ranking visual claro |
| Conversão por unidade | ✅ | `ChartConversaoPorLoja` — bom |
| Conversão por origem | ✅ | `ChartPieOrigem` — bom |
| Evolução temporal | ✅ | Charts 30d/12m — bom |
| Gargalos do funil | ⚠️ | `ChartTempoPorEtapa` quebra com colunas customizadas |
| Tempo médio de atendimento | ✅ | `MetricasAtendimento` — bom |
| Tempo médio de conversão | ⚠️ | `ChartTempoPorEtapa` existe mas é difícil de interpretar |
| Projeções e tendências | ❌ | Não existe |

---

## PARTE 3 — ANÁLISE DE PRODUTO E NEGÓCIO

### Métricas redundantes (para eliminar ou fundir)

- **`KanbanStatsCards` + `FunilStatus`** na mesma tela `/crm` → escolher um formato único
- **`LeadsTemperature`** na tela `/crm` duplica informação que já está no Kanban

### Métricas ausentes mas de alto valor

| Métrica | Perfil | Complexidade |
|---|---|---|
| SLA breach rate (% leads fora do prazo) | Atendente + Gerente | Baixa |
| Follow-up compliance (agendados vs realizados) | Atendente | Média |
| Pipeline value (valor esperado por etapa) | Gerente | Alta |
| Lead aging heatmap (dias parado por status) | Gerente | Média |
| Taxa de resposta no primeiro contato | Gerente | Baixa |
| Tendência de conversão (MoM %) | Gerente | Baixa |
| Score médio da carteira ativa | Atendente + Gerente | Baixa |

### Gráficos que podem ser simplificados

- `ChartBarInvestment` + `ChartInvestimentoClass` mostram o mesmo público com cortes diferentes → fundir em uma visualização
- `ChartCampanhasUTM` + `ChartLandingPages` + `ChartUtmContentMedium` → unificar em tela "Origem & Mídia"
- `FunilStatus` + `KanbanStatsCards` → eliminar um dos dois

---

## PARTE 4 — BACKEND E DADOS

### Problemas de escalabilidade

**`fetchLeadsByStatusPaginated`** faz `getMultiLojaLeads(lojaIds, 1000)` e filtra no JavaScript. Com crescimento de base, isso quebra silenciosamente.
- **Solução:** endpoint dedicado `GET /leads-count-by-status?loja_ids=&status=`

**Ausência de cache:** As chamadas `getKanbanColumns`, `getLojas`, stats mensais/semanais são excelentes candidatas a revalidação com TTL de 60–300s.
- **Impacto esperado:** redução de 60–80% nas chamadas repetidas.

### Tabelas de analytics ausentes

| Tabela | Finalidade | Prioridade |
|---|---|---|
| `wp_lead_events` | Histórico de mudanças de status por lead (base para funil por etapa real e visão individual do atendente) | Alta |
| `wp_daily_stats` | Snapshot diário de métricas por loja (elimina recalcular do zero a cada acesso) | Média |
| `wp_follow_up_log` | Registro de follow-ups realizados vs agendados | Média |

### Queries a otimizar

- `tempo_por_etapa` executa 2 queries separadas (ativos + fechados) que poderiam ser 1 `UNION ALL`
- `status_funil` com `GROUP BY status` não usa índice em `status` → adicionar `INDEX (loja_id, status)` na tabela `wp_leads`
- Todas as buscas de colunas do kanban poderiam usar `React.cache()` já aplicado, mas precisam de TTL no nível HTTP também

---

## PARTE 5 — BENCHMARK DE MERCADO

| Funcionalidade | HubSpot | Pipedrive | RD Station | Simonetto CRM |
|---|---|---|---|---|
| Dashboard pessoal do atendente | ✅ | ✅ | ✅ | ❌ |
| Metas e quotas | ✅ | ✅ | ✅ | ❌ |
| Alertas automáticos de SLA | ✅ | ⚠️ | ✅ | ❌ (só no Kanban) |
| Forecast de pipeline | ✅ | ✅ | ⚠️ | ❌ |
| Velocidade do funil (tempo por etapa) | ✅ | ✅ | ⚠️ | ⚠️ |
| Ranking de atendentes | ✅ | ✅ | ✅ | ⚠️ |
| Notificações proativas | ✅ | ✅ | ✅ | ⚠️ (unread msg) |
| Filtro global de período | ✅ | ✅ | ✅ | ⚠️ (parcial) |
| Mobile-first | ✅ | ✅ | ⚠️ | ⚠️ |
| Exportação de relatórios | ✅ | ✅ | ✅ | ❌ |

---

## PARTE 6 — QUICK WINS (menos de 1 dia cada)

| # | Melhoria | Impacto | Estimativa |
|---|---|---|---|
| QW-01 | Remover `FunilStatus` da tela `/crm`, manter só `KanbanStatsCards` | Alto — elimina redundância visual | 10 min |
| QW-02 | Corrigir grid de `KanbanStatsCards` para `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5` | Médio — layout correto com N colunas | 30 min |
| QW-03 | Padronizar todos os labels de status em uma constante global compartilhada | Médio — credibilidade | 2h |
| QW-04 | Substituir emojis em `TemperaturaLeads` por ícones Lucide (`Flame`, `Thermometer`, `Snowflake`) | Baixo — consistência visual | 15 min |
| QW-05 | Adicionar `taxa de conversão` nos cards da tela `/crm/unidades` | Alto — gerente compara lojas de relance | 1h |
| QW-06 | Corrigir altura dinâmica em `ChartTempoPorEtapa`: `height={Math.max(220, data.length * 44)}` | Médio — legibilidade com funil customizado | 20 min |
| QW-07 | Adicionar `revalidate: 300` em `getKanbanColumns` e `getLojas` | Médio — performance sem perda de frescor | 15 min |
| QW-08 | `fetchLeadsByStatusPaginated`: trocar limite de 1000 por 9999 como paliativo imediato | Alto — dado mais correto enquanto endpoint dedicado não existe | 5 min |
| QW-09 | Adicionar `INDEX (loja_id, status)` na tabela `wp_leads` | Médio — performance de query | 10 min |
| QW-10 | Adicionar `animate-in fade-in duration-300` nos containers de chart após Suspense | Baixo — polimento de transição | 30 min |

---

## PARTE 7 — ROADMAP DE EVOLUÇÃO

### Curto Prazo (1–4 semanas)

1. **Dashboard pessoal do Atendente** — tela dedicada com: meus leads atribuídos, minha taxa de conversão, meus follow-ups do dia, meu SLA. É a maior lacuna do produto.
2. **Corrigir `ChartFunilKanban`** para aceitar colunas dinâmicas (P-04) — atualmente ignora slugs customizados.
3. **Unificar labels de status** em constante global TypeScript compartilhada entre componentes e PHP.
4. **Executar todos os Quick Wins** (QW-01 a QW-10).
5. **Padronizar empty states** em todos os componentes com ícone + título + descrição consistentes.
6. **Refatorar `desempenho/page`** — organizar em 3 blocos com títulos narrativos: "Visão Geral do Funil", "Desempenho da Equipe", "Origens & Comportamento".

### Médio Prazo (1–3 meses)

1. **Sistema de Metas** — definir meta mensal por atendente/loja, exibir progresso em gauge ou progress bar no dashboard.
2. **Alertas Proativos** — notificação/badge quando: lead excede SLA, follow-up vence hoje, lead quente sem contato há X horas.
3. **Filtro Global de Período** — `DateRangePicker` no topo da página que afeta todos os gráficos da tela simultaneamente.
4. **Criar tabela `wp_lead_events`** — histórico de transições de status por lead. Base para funil por etapa real e visão individual do atendente.
5. **Endpoint dedicado de contagem** — `GET /leads-count-by-status` para substituir o filtro client-side ineficiente.
6. **Cache strategy** — implementar `unstable_cache` com TTL escalonado por tipo de dado (colunas: 5min, stats: 1min, leads: no-store).
7. **Página `/crm/comportamento` expandida** — adicionar comparativo histórico, benchmark da loja vs média, e recomendações automáticas.

### Longo Prazo (3–6 meses)

1. **Forecast de Pipeline** — projeção de conversões com base em histórico de velocidade por etapa (requer `wp_lead_events` + `wp_daily_stats`).
2. **Ranking gamificado de atendentes** — leaderboard semanal/mensal com badges de performance.
3. **Insights automáticos** — ex: "Esta semana a loja X teve queda de 30% na conversão. Principal causa: aumento de leads frios de Instagram."
4. **Mobile-first redesign do Kanban** — o Kanban é praticamente inutilizável em telas < 768px, e atendentes usam celular em campo.
5. **Relatório exportável (PDF/CSV)** — white-label com gráficos para o gerente apresentar ao franqueador/cliente.
6. **Webhook de SLA** — disparo automático de WhatsApp/email quando lead fica parado além do limite configurado.

---

## SÍNTESE FINAL

O CRM tem uma base técnica excelente e evolui rápido. O maior retorno virá não de novos gráficos, mas de três frentes:

1. **Criar o dashboard pessoal do atendente** — hoje a pessoa mais impactada pelo produto não tem visão de si mesma.
2. **Eliminar redundâncias** — `FunilStatus` + `KanbanStatsCards` na mesma tela, métricas duplicadas em charts diferentes.
3. **Tornar cada tela verdadeiramente acionável** — a pergunta que toda tela deve responder é: *"o que devo fazer agora?"*. Hoje poucas chegam lá.

A diferença entre um CRM que as pessoas usam e um que elas ignoram está nessa pergunta.
