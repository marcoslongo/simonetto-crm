'use client'

import { FileText, Table2, Calendar as CalendarIcon2, Download, Loader2, Eraser } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fetchAllLeadsForExport } from "@/actions/leads-actions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

const reports = [
  { id: 1, name: "Relatório de Leads — Mensal", type: "PDF", size: "2.4 MB", date: "01/06/2024", icon: FileText, desc: "Resumo completo de leads gerados" },
  { id: 2, name: "Performance por Loja", type: "Excel", size: "1.8 MB", date: "01/06/2024", icon: Table2, desc: "Métricas de cada unidade: leads" },
  { id: 3, name: "Exportação de Leads", type: "CSV", size: "890 KB", date: "25/05/2024", icon: Table2, desc: "Base completa de leads com todos os campos" },
];

const PERIOD_PRESETS = [
  { id: "ultima-semana", label: "Última Semana", days: 7 },
  { id: "ultimo-mes",    label: "Último Mês",    days: 30 },
  { id: "ultimo-trimestre", label: "Último Trimestre", days: 90 },
  { id: "ultimo-ano",   label: "Último Ano",     days: 365 },
];

function getPresetRange(days: number): { fromDate: Date; toDate: Date } {
  const toDate = new Date();
  toDate.setHours(23, 59, 59, 999);
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  fromDate.setHours(0, 0, 0, 0);
  return { fromDate, toDate };
}

function leadsToCSV(leads: any[]): string {
  const headers = [
    'ID', 'Nome', 'Email', 'Telefone', 'Cidade', 'Estado',
    'Interesse', 'Expectativa de Investimento', 'Região da Loja',
    'Mensagem', 'Loja', 'Cidade da Loja', 'Estado da Loja',
    'Atendido', 'Data de Cadastro',
  ];

  const escape = (val: any) => {
    if (val == null) return '';
    const str = String(val).replace(/"/g, '""');
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str}"` : str;
  };

  const rows = leads.map(lead => [
    lead.id, lead.nome, lead.email, lead.telefone, lead.cidade, lead.estado,
    lead.interesse, lead.expectativa_investimento, lead.loja_regiao, lead.mensagem,
    lead.loja_nome, lead.loja_cidade, lead.loja_estado,
    lead.atendido ? 'Sim' : 'Não', lead.data_criacao,
  ].map(escape).join(','));

  return [headers.join(','), ...rows].join('\n');
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type FilterMode = 'preset' | 'custom';

export function Content() {
  const [filterMode, setFilterMode]   = useState<FilterMode>('preset');
  const [activePreset, setActivePreset] = useState("ultimo-mes");
  const [from, setFrom] = useState<Date | undefined>(undefined);
  const [to,   setTo]   = useState<Date | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);

  const isCustomReady = filterMode === 'custom' && !!from && !!to;
  const canExport     = filterMode === 'preset' || isCustomReady;
  const isFiltered    = !!from || !!to;

  function handleLimpar() {
    setFrom(undefined);
    setTo(undefined);
  }

  function getPeriodLabel(): string {
    if (filterMode === 'preset') {
      return activePreset.replace('ultimo-', '').replace('ultima-', '');
    }
    return `${format(from!, 'dd-MM-yyyy')}-ate-${format(to!, 'dd-MM-yyyy')}`;
  }

  function getExportDescription(): string {
    if (filterMode === 'preset') {
      const preset = PERIOD_PRESETS.find(p => p.id === activePreset)!;
      const { fromDate, toDate } = getPresetRange(preset.days);
      return `${format(fromDate, "dd/MM/yyyy")} até ${format(toDate, "dd/MM/yyyy")}`;
    }
    if (from && to) return `${format(from, "dd/MM/yyyy")} até ${format(to, "dd/MM/yyyy")}`;
    return "Selecione um período para exportar";
  }

  async function handleExportCSV() {
    if (!canExport) return;
    setIsExporting(true);

    try {
      const leads = await fetchAllLeadsForExport();

      let fromDate: Date;
      let toDate: Date;

      if (filterMode === 'preset') {
        const preset = PERIOD_PRESETS.find(p => p.id === activePreset)!;
        ({ fromDate, toDate } = getPresetRange(preset.days));
      } else {
        fromDate = new Date(from!); fromDate.setHours(0, 0, 0, 0);
        toDate   = new Date(to!);   toDate.setHours(23, 59, 59, 999);
      }

      const filtered = leads.filter(lead => {
        const d = new Date(lead.data_criacao);
        return d >= fromDate && d <= toDate;
      });

      const csv = leadsToCSV(filtered);
      downloadCSV(csv, `leads-${getPeriodLabel()}.csv`);
    } catch (err) {
      console.error('Erro ao exportar leads:', err);
      alert('Erro ao exportar leads. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Filtrar por Período</h2>
          <CalendarIcon2 size={18} className="text-muted-foreground" />
        </div>

        {/* Tabs para alternar o modo de filtro */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-4">
          <button
            onClick={() => setFilterMode('preset')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              filterMode === 'preset'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Período rápido
          </button>
          <button
            onClick={() => setFilterMode('custom')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              filterMode === 'custom'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Data personalizada
          </button>
        </div>

        {/* Modo: botões de período rápido */}
        {filterMode === 'preset' && (
          <div className="flex flex-wrap gap-2">
            {PERIOD_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePreset(p.id)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  activePreset === p.id
                    ? "bg-[#0b1437] text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Modo: calendário personalizado */}
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
                <Calendar
                  mode="single"
                  selected={from}
                  onSelect={setFrom}
                  locale={ptBR}
                  disabled={(date) => (to ? date > to : false)}
                />
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
                <Calendar
                  mode="single"
                  selected={to}
                  onSelect={setTo}
                  locale={ptBR}
                  disabled={(date) => (from ? date < from : false)}
                />
              </PopoverContent>
            </Popover>

            {isFiltered && (
              <Button
                variant="destructive"
                onClick={handleLimpar}
                disabled={isExporting}
                className="flex gap-2 items-center text-white"
              >
                <Eraser className="h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Botão de exportação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleExportCSV}
          disabled={isExporting || !canExport}
          title={!canExport ? "Selecione o período para exportar" : "Baixar relatório CSV"}
          className="bg-card cursor-pointer border border-border rounded-xl p-5 text-left hover:border-[#0b1437]/40 hover:shadow-md transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <div className="w-10 h-10 rounded-lg bg-[#0b1437]/10 flex items-center justify-center mb-3 group-hover:bg-[#0b1437]/20 transition-colors">
            {isExporting
              ? <Loader2 size={20} className="text-[#0b1437] animate-spin" />
              : <Table2 size={20} className="text-[#0b1437]" />
            }
          </div>
          <p className="text-sm font-semibold text-foreground">
            {isExporting ? 'Exportando...' : 'Exportar Leads (CSV)'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {getExportDescription()}
          </p>
        </button>

        {/* 
        <button className="bg-card border border-border rounded-xl p-5 text-left hover:border-[#0b1437]/40 hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-lg bg-[#0b1437]/10 flex items-center justify-center mb-3 group-hover:bg-[#0b1437]/20 transition-colors">
            <FileText size={20} className="text-[#0b1437]" />
          </div>
          <p className="text-sm font-semibold text-foreground">Relatório Mensal (PDF)</p>
          <p className="text-xs text-muted-foreground mt-1">Resumo do periodo selecionado com gráficos</p>
        </button>
        */}
      </div>

      {/* 
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="font-semibold mb-4">Relatórios Disponíveis</h2>
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#0b1437]/10 flex items-center justify-center shrink-0">
                <r.icon size={18} className="text-[#0b1437]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{r.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{r.type}</span>
                <p className="text-[10px] text-muted-foreground mt-1">{r.size} • {r.date}</p>
              </div>
              <button className="p-2 rounded-lg hover:bg-[#0b1437]/10 text-[#0b1437] transition-colors shrink-0">
                <Download size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
      */}
    </>
  );
}