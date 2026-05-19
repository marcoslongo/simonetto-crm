'use client'

import { Table2, Calendar as CalendarIcon2, Eraser, Loader2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fetchLojaLeadsForExport } from "@/actions/leads-actions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

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
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type FilterMode = 'preset' | 'custom';

interface CrmContentProps {
  lojaId: number;
  lojaNome?: string;
}

export function CrmContent({ lojaId, lojaNome }: CrmContentProps) {
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
      const leads = await fetchLojaLeadsForExport(lojaId);

      let fromDate: Date;
      let toDate: Date;

      if (filterMode === 'preset') {
        const preset = PERIOD_PRESETS.find(p => p.id === activePreset)!;
        ({ fromDate, toDate } = getPresetRange(preset.days));
      } else {
        fromDate = new Date(from!); fromDate.setHours(0, 0, 0, 0);
        toDate   = new Date(to!);   toDate.setHours(23, 59, 59, 999);
      }

      const filtered = leads.filter((lead: { data_criacao: string }) => {
        const d = new Date(lead.data_criacao);
        return d >= fromDate && d <= toDate;
      });

      const storeName = lojaNome ? lojaNome.toLowerCase().replace(/\s+/g, '-') : `loja-${lojaId}`;
      const csv = leadsToCSV(filtered);
      downloadCSV(csv, `leads-${storeName}-${getPeriodLabel()}.csv`);
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
      </div>
    </>
  );
}
