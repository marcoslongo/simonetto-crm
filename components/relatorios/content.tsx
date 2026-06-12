'use client'

import { useState, useMemo } from "react"
import { Table2, Calendar as CalendarIcon2, Download, Loader2, Eraser, ChevronDown, Search, BarChart3 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { fetchAllLeadsForExport, fetchPerformanceFranqueadosForExport } from "@/actions/leads-actions"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import type { LeadStatus } from "@/lib/types"

const PERIOD_PRESETS = [
  { id: "ultima-semana",    label: "Última semana",    days: 7 },
  { id: "ultimo-mes",       label: "Último mês",       days: 30 },
  { id: "ultimo-trimestre", label: "Último trimestre", days: 90 },
  { id: "ultimo-ano",       label: "Último ano",       days: 365 },
]

const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: "nao_atendido",       label: "Não atendido",       color: "bg-slate-100 text-slate-700 border-slate-300" },
  { value: "em_negociacao",      label: "Em negociação",      color: "bg-blue-50 text-blue-700 border-blue-300" },
  { value: "venda_realizada",    label: "Venda realizada",    color: "bg-emerald-50 text-emerald-700 border-emerald-300" },
  { value: "venda_nao_realizada",label: "Venda não realizada",color: "bg-red-50 text-red-700 border-red-300" },
]

const STATUS_LABELS: Record<LeadStatus, string> = {
  nao_atendido:        "Não atendido",
  em_negociacao:       "Em negociação",
  venda_realizada:     "Venda realizada",
  venda_nao_realizada: "Venda não realizada",
}

function getPresetRange(days: number) {
  const toDate = new Date(); toDate.setHours(23, 59, 59, 999)
  const fromDate = new Date(); fromDate.setDate(fromDate.getDate() - days); fromDate.setHours(0, 0, 0, 0)
  return { fromDate, toDate }
}

function performanceToCSV(rows: any[]): string {
  const headers = [
    'ID', 'Franqueado',
    'Total Leads', 'Vendas Realizadas', 'Em Negociação', 'Não Atendido',
    'Taxa Conversão (%)',
    'Leads Ativos', 'SLA Breach', 'SLA Breach (%)', 'Sem Contato',
    'Follow-up Compliance (%)',
  ]
  const escape = (val: any) => {
    if (val == null) return ''
    const str = String(val).replace(/"/g, '""')
    return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str
  }
  const dataRows = rows.map(r => [
    r.loja_id, r.loja_nome,
    r.total_leads, r.vendas_realizadas, r.em_negociacao, r.nao_atendido,
    r.taxa_conversao,
    r.active_leads, r.sla_breach_count, r.sla_breach_pct, r.sla_nao_atendido,
    r.followup_compliance ?? '',
  ].map(escape).join(','))
  return [headers.join(','), ...dataRows].join('\n')
}

function leadsToCSV(leads: any[], includeProprio: boolean): string {
  const headers = [
    'ID', 'Nome', 'Email', 'Telefone',
    'Cidade', 'Estado',
    'Interesse', 'Expectativa de Investimento', 'Classificação', 'Score',
    'Loja', 'Cidade da Loja', 'Estado da Loja', 'Região',
    'Status',
    ...(includeProprio ? ['Origem'] : []),
    'Data de Cadastro', 'Mensagem',
  ]

  const escape = (val: any) => {
    if (val == null) return ''
    const str = String(val).replace(/"/g, '""')
    return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str
  }

  const rows = leads.map(lead => [
    lead.id, lead.nome, lead.email ?? '', lead.telefone,
    lead.cidade, lead.estado,
    lead.interesse, lead.expectativa_investimento,
    lead.classificacao ?? '', lead.score ?? '',
    lead.loja_nome, lead.loja_cidade, lead.loja_estado, lead.loja_regiao,
    STATUS_LABELS[lead.status as LeadStatus] ?? lead.status,
    ...(includeProprio ? [lead.origem === 'industria' ? 'Indústria' : lead.origem === 'proprio' ? 'Próprio' : lead.origem] : []),
    lead.data_criacao, lead.mensagem ?? '',
  ].map(escape).join(','))

  return [headers.join(','), ...rows].join('\n')
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

type FilterMode = 'preset' | 'custom'
type Origem = '' | 'industria' | 'proprio'

interface ContentProps {
  lojas: { id: number; nome: string }[]
  showProprio?: boolean
}

function LojaSelect({
  lojas,
  value,
  onChange,
}: {
  lojas: { id: number; nome: string }[]
  value: number | undefined
  onChange: (id: number | undefined) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () => lojas.filter(l => l.nome.toLowerCase().includes(search.toLowerCase())),
    [lojas, search]
  )

  const selected = lojas.find(l => l.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center justify-between gap-2 h-9 px-3 rounded-lg border border-border bg-background text-sm w-full min-w-0 hover:border-[#0b1437]/40 transition-colors">
          <span className="truncate text-left">
            {selected ? selected.nome : <span className="text-muted-foreground">Todas as lojas</span>}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="flex items-center gap-2 px-3 py-2 border-b">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            autoFocus
            placeholder="Buscar loja..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-sm flex-1 outline-none bg-transparent"
          />
        </div>
        <div className="max-h-56 overflow-y-auto py-1">
          <button
            onClick={() => { onChange(undefined); setOpen(false); setSearch('') }}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${!value ? 'font-semibold text-[#0b1437]' : ''}`}
          >
            Todas as lojas
          </button>
          {filtered.map(l => (
            <button
              key={l.id}
              onClick={() => { onChange(l.id); setOpen(false); setSearch('') }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors truncate ${value === l.id ? 'font-semibold text-[#0b1437]' : ''}`}
            >
              {l.nome}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground text-center">Nenhuma loja encontrada</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function Content({ lojas, showProprio = true }: ContentProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>('preset')
  const [activePreset, setActivePreset] = useState("ultimo-mes")
  const [from, setFrom] = useState<Date | undefined>(undefined)
  const [to, setTo] = useState<Date | undefined>(undefined)
  const [lojaId, setLojaId] = useState<number | undefined>(undefined)
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus[]>([])
  const [origem, setOrigem] = useState<Origem>('')
  const [isExporting, setIsExporting] = useState(false)
  const [isExportingPerformance, setIsExportingPerformance] = useState(false)

  const isCustomReady = filterMode === 'custom' && !!from && !!to
  const canExport = filterMode === 'preset' || isCustomReady

  function toggleStatus(s: LeadStatus) {
    setSelectedStatus(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  function handleLimpar() {
    setFrom(undefined); setTo(undefined)
    setLojaId(undefined)
    setSelectedStatus([])
    setOrigem('')
    setFilterMode('preset')
    setActivePreset('ultimo-mes')
  }

  function hasActiveFilters() {
    return !!lojaId || selectedStatus.length > 0 || !!origem || (filterMode === 'custom' && (!!from || !!to))
  }

  function getPeriodLabel(): string {
    if (filterMode === 'preset') return activePreset.replace('ultimo-', '').replace('ultima-', '')
    return `${format(from!, 'dd-MM-yyyy')}-ate-${format(to!, 'dd-MM-yyyy')}`
  }

  function getExportDateDescription(): string {
    if (filterMode === 'preset') {
      const preset = PERIOD_PRESETS.find(p => p.id === activePreset)!
      const { fromDate, toDate } = getPresetRange(preset.days)
      return `${format(fromDate, "dd/MM/yyyy")} até ${format(toDate, "dd/MM/yyyy")}`
    }
    if (from && to) return `${format(from, "dd/MM/yyyy")} até ${format(to, "dd/MM/yyyy")}`
    return "Selecione um período"
  }

  function getActiveFiltersSummary(): string {
    const parts: string[] = []
    if (lojaId) parts.push(lojas.find(l => l.id === lojaId)?.nome ?? 'Loja selecionada')
    if (selectedStatus.length > 0) parts.push(selectedStatus.map(s => STATUS_LABELS[s]).join(', '))
    if (origem === 'industria') parts.push('Indústria')
    else if (origem === 'proprio' && showProprio) parts.push('Próprio')
    return parts.length ? parts.join(' · ') : 'Todos os registros'
  }

  async function handleExportCSV() {
    if (!canExport) return
    setIsExporting(true)

    try {
      let fromDate: Date, toDate: Date

      if (filterMode === 'preset') {
        const preset = PERIOD_PRESETS.find(p => p.id === activePreset)!;
        ({ fromDate, toDate } = getPresetRange(preset.days))
      } else {
        fromDate = new Date(from!); fromDate.setHours(0, 0, 0, 0)
        toDate = new Date(to!); toDate.setHours(23, 59, 59, 999)
      }

      const leads = await fetchAllLeadsForExport({
        lojaId,
        from: format(fromDate, 'yyyy-MM-dd'),
        to: format(toDate, 'yyyy-MM-dd'),
        origem: origem || undefined,
        status: selectedStatus.length > 0 ? selectedStatus : undefined,
      })

      const csv = leadsToCSV(leads, showProprio)
      const lojaNome = lojaId ? lojas.find(l => l.id === lojaId)?.nome?.toLowerCase().replace(/\s+/g, '-') : 'todas-lojas'
      downloadCSV(csv, `leads-${lojaNome}-${getPeriodLabel()}.csv`)
    } catch {
      alert('Erro ao exportar leads. Tente novamente.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Filtros de Exportação</h2>
          {hasActiveFilters() && (
            <button
              onClick={handleLimpar}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Eraser className="h-3.5 w-3.5" />
              Limpar filtros
            </button>
          )}
        </div>

        {/* Período */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Período</p>
          <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
            <button
              onClick={() => setFilterMode('preset')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filterMode === 'preset' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Período rápido
            </button>
            <button
              onClick={() => setFilterMode('custom')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filterMode === 'custom' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Data personalizada
            </button>
          </div>

          {filterMode === 'preset' && (
            <div className="flex flex-wrap gap-2">
              {PERIOD_PRESETS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setActivePreset(p.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                    activePreset === p.id ? "bg-[#0b1437] text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {filterMode === 'custom' && (
            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40 justify-start text-sm">
                    <CalendarIcon2 className="mr-2 h-4 w-4" />
                    {from ? format(from, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={from} onSelect={setFrom} locale={ptBR}
                    disabled={date => (to ? date > to : false)} />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40 justify-start text-sm">
                    <CalendarIcon2 className="mr-2 h-4 w-4" />
                    {to ? format(to, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={to} onSelect={setTo} locale={ptBR}
                    disabled={date => (from ? date < from : false)} />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Loja + Origem */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Loja</p>
            <LojaSelect lojas={lojas} value={lojaId} onChange={setLojaId} />
          </div>

          {showProprio && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Origem</p>
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                {([['', 'Todas'], ['industria', 'Indústria'], ['proprio', 'Próprio']] as [Origem, string][]).map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => setOrigem(v)}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      origem === v ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Status{selectedStatus.length > 0 ? ` · ${selectedStatus.length} selecionado${selectedStatus.length > 1 ? 's' : ''}` : ' · todos'}
          </p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map(s => {
              const active = selectedStatus.includes(s.value)
              return (
                <button
                  key={s.value}
                  onClick={() => toggleStatus(s.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    active ? s.color : 'bg-muted text-muted-foreground border-transparent hover:border-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Export buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleExportCSV}
          disabled={isExporting || !canExport}
          title={!canExport ? "Selecione o período para exportar" : undefined}
          className="flex-1 bg-card cursor-pointer border border-border rounded-xl p-5 text-left hover:border-[#0b1437]/40 hover:shadow-md transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#0b1437]/10 flex items-center justify-center shrink-0 group-hover:bg-[#0b1437]/20 transition-colors">
              {isExporting
                ? <Loader2 size={20} className="text-[#0b1437] animate-spin" />
                : <Table2 size={20} className="text-[#0b1437]" />
              }
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {isExporting ? 'Exportando...' : 'Exportar Leads (CSV)'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{getExportDateDescription()}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{getActiveFiltersSummary()}</p>
            </div>
            {!isExporting && (
              <Download size={16} className="text-muted-foreground mt-1 shrink-0 ml-auto" />
            )}
          </div>
        </button>

        <button
          onClick={async () => {
            setIsExportingPerformance(true)
            try {
              const rows = await fetchPerformanceFranqueadosForExport()
              const csv = performanceToCSV(rows)
              downloadCSV(csv, `performance-franqueados-${format(new Date(), 'yyyy-MM-dd')}.csv`)
            } catch {
              alert('Erro ao exportar performance. Tente novamente.')
            } finally {
              setIsExportingPerformance(false)
            }
          }}
          disabled={isExportingPerformance}
          className="flex-1 bg-card cursor-pointer border border-border rounded-xl p-5 text-left hover:border-emerald-500/40 hover:shadow-md transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
              {isExportingPerformance
                ? <Loader2 size={20} className="text-emerald-700 animate-spin" />
                : <BarChart3 size={20} className="text-emerald-700" />
              }
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {isExportingPerformance ? 'Exportando...' : 'Performance por Franqueado (CSV)'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Todos os franqueados</p>
              <p className="text-xs text-muted-foreground mt-0.5">Conversão · SLA · Leads ativos · Follow-up</p>
            </div>
            {!isExportingPerformance && (
              <Download size={16} className="text-muted-foreground mt-1 shrink-0 ml-auto" />
            )}
          </div>
        </button>
      </div>
    </div>
  )
}
