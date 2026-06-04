import type { KanbanColuna } from './types'

/**
 * Única fonte de verdade para labels dos status fixos do kanban.
 * Consumido por todos os componentes — nunca hardcode labels diretamente.
 */
export const STATUS_LABELS: Record<string, string> = {
  nao_atendido:        'Não Atendido',
  em_negociacao:       'Em Negociação',
  venda_realizada:     'Venda Realizada',
  venda_nao_realizada: 'Venda Não Realizada',
}

/** Colunas padrão usadas quando o backend ainda não retornou (fallback). */
export const DEFAULT_KANBAN_COLUNAS: KanbanColuna[] = [
  { id: 0, loja_id: 0, slug: 'nao_atendido',        label: STATUS_LABELS.nao_atendido,        cor: 'amber',   ordem: 0, fixo: 1 },
  { id: 0, loja_id: 0, slug: 'em_negociacao',       label: STATUS_LABELS.em_negociacao,       cor: 'blue',    ordem: 1, fixo: 1 },
  { id: 0, loja_id: 0, slug: 'venda_realizada',     label: STATUS_LABELS.venda_realizada,     cor: 'emerald', ordem: 2, fixo: 1 },
  { id: 0, loja_id: 0, slug: 'venda_nao_realizada', label: STATUS_LABELS.venda_nao_realizada, cor: 'red',     ordem: 3, fixo: 1 },
]

/** Cores para badges de status (compatível com LeadsRecentes e qualquer tabela). */
export const STATUS_BADGE_CLASSES: Record<string, string> = {
  nao_atendido:        'bg-amber-100 text-amber-800 border-amber-200',
  em_negociacao:       'bg-blue-100 text-blue-800 border-blue-200',
  venda_realizada:     'bg-emerald-100 text-emerald-800 border-emerald-200',
  venda_nao_realizada: 'bg-red-100 text-red-800 border-red-200',
}

/** Mapa cor-kanban → classe CSS de badge (para colunas customizadas). */
export const COR_TO_BADGE_CLASS: Record<string, string> = {
  amber:   'bg-amber-100 text-amber-800 border-amber-200',
  blue:    'bg-blue-100 text-blue-800 border-blue-200',
  emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  red:     'bg-red-100 text-red-800 border-red-200',
  rose:    'bg-rose-100 text-rose-800 border-rose-200',
  slate:   'bg-slate-100 text-slate-700 border-slate-200',
  purple:  'bg-purple-100 text-purple-800 border-purple-200',
  indigo:  'bg-indigo-100 text-indigo-800 border-indigo-200',
  teal:    'bg-teal-100 text-teal-800 border-teal-200',
  orange:  'bg-orange-100 text-orange-800 border-orange-200',
  pink:    'bg-pink-100 text-pink-800 border-pink-200',
  violet:  'bg-violet-100 text-violet-800 border-violet-200',
  cyan:    'bg-cyan-100 text-cyan-800 border-cyan-200',
  gray:    'bg-gray-100 text-gray-700 border-gray-200',
}
