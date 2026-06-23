"use client"

import React, { useTransition } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Building2, Store, TrendingUp, TrendingDown, Download, BarChart2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { exportLeadsByOrigem } from "@/actions/leads-actions"

// ── types ─────────────────────────────────────────────────────────────────────

export interface MonthData {
  date:  string  // "2025-06"
  total: number
}

interface CaptacaoMes {
  mes:       string
  label:     string
  industria: number
  proprio:   number
}

interface Props {
  dataIndustria: MonthData[]
  dataProprio:   MonthData[]
  showProprio:   boolean
  lojaIds:       number[]
  lojaNome?:     string
}

// ── helpers ───────────────────────────────────────────────────────────────────

function labelMes(date: string): string {
  const [y, m] = date.substring(0, 7).split("-").map(Number)
  return new Date(y, m - 1, 1)
    .toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
    .replace(/\.\s*/g, "/")
    .toUpperCase()
}

function buildData(ind: MonthData[], prop: MonthData[]): CaptacaoMes[] {
  const map = new Map<string, CaptacaoMes>()
  for (const { date, total } of ind)
    map.set(date, { mes: date, label: labelMes(date), industria: total, proprio: 0 })
  for (const { date, total } of prop) {
    const ex = map.get(date)
    if (ex) ex.proprio = total
    else map.set(date, { mes: date, label: labelMes(date), industria: 0, proprio: total })
  }
  return [...map.values()].sort((a, b) => a.mes.localeCompare(b.mes))
}

function triggerCSV(rows: any[], suffix: string) {
  const headers = [
    "Nome", "Telefone", "Email", "Cidade", "Estado",
    "Origem", "Status", "Responsável", "Loja",
    "Data de Entrada", "Interesse", "Investimento",
  ]
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
  const lines = [
    headers.join(","),
    ...rows.map(l =>
      [
        l.nome, l.telefone, l.email, l.cidade, l.estado,
        l.origem === "proprio" ? "Próprio" : "Indústria",
        l.status, l.responsavel_nome ?? "",
        l.loja_regiao ?? l.loja_nome ?? "",
        (l.data_criacao ?? "").substring(0, 10),
        l.interesse ?? "", l.expectativa_investimento ?? "",
      ].map(esc).join(",")
    ),
  ]
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement("a"), {
    href: url,
    download: `leads_captacao${suffix}_${new Date().toISOString().slice(0, 10)}.csv`,
  })
  a.click()
  URL.revokeObjectURL(url)
}

// ── chart config ──────────────────────────────────────────────────────────────

const chartConfig = {
  industria: { label: "Indústria", color: "#7c3aed" },
  proprio:   { label: "Próprio",   color: "#10b981" },
} satisfies ChartConfig

// ── component ─────────────────────────────────────────────────────────────────

export function ChartCaptacaoOrigens({
  dataIndustria, dataProprio, showProprio, lojaIds, lojaNome,
}: Props) {
  const [pending, startTransition] = useTransition()

  const data     = buildData(dataIndustria, showProprio ? dataProprio : [])
  const totInd   = data.reduce((s, m) => s + m.industria, 0)
  const totProp  = showProprio ? data.reduce((s, m) => s + m.proprio, 0) : 0
  const totGeral = totInd + totProp

  const last = data[data.length - 1]
  const prev = data[data.length - 2]
  const trendInd  = last && prev && prev.industria > 0
    ? Math.round((last.industria - prev.industria) / prev.industria * 100) : null
  const trendProp = showProprio && last && prev && prev.proprio > 0
    ? Math.round((last.proprio  - prev.proprio)  / prev.proprio  * 100) : null

  function handleExport(origem: "industria" | "proprio" | "") {
    startTransition(async () => {
      try {
        toast.loading("Preparando exportação…", { id: "csv" })
        const leads = await exportLeadsByOrigem(lojaIds, origem || undefined)
        triggerCSV(leads, origem ? `_${origem}` : "")
        toast.success(`${leads.length} leads exportados`, { id: "csv" })
      } catch {
        toast.error("Erro ao exportar", { id: "csv" })
      }
    })
  }

  return (
    <Card className="overflow-hidden border-[#16255c]/12 shadow-xl pt-0">

      {/* cabeçalho */}
      <div className="bg-linear-to-r from-[#16255c] to-[#1e3a8a] px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/12">
              <BarChart2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg text-white">Captação de Leads</CardTitle>
              <CardDescription className="text-blue-200 mt-0.5">
                {lojaNome ?? "Sua unidade"} · últimos 12 meses por origem
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {showProprio && (
              <>
                <button
                  onClick={() => handleExport("industria")} disabled={pending}
                  className="flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" /> Indústria
                </button>
                <button
                  onClick={() => handleExport("proprio")} disabled={pending}
                  className="flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" /> Próprio
                </button>
              </>
            )}
            <button
              onClick={() => handleExport("")} disabled={pending}
              className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-1.5 text-xs font-bold text-[#16255c] transition hover:bg-blue-50 disabled:opacity-60"
            >
              <Download className="h-3.5 w-3.5" />
              {pending ? "Exportando…" : "CSV Completo"}
            </button>
          </div>
        </div>
      </div>

      {/* métricas */}
      <div className={`grid divide-x border-b ${showProprio ? "grid-cols-3" : "grid-cols-2"}`}>

        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-violet-700" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Indústria</span>
          </div>
          <p className="text-3xl font-extrabold tabular-nums text-violet-700">{totInd.toLocaleString("pt-BR")}</p>
          {trendInd !== null ? (
            <span className={`mt-1.5 flex items-center gap-1 text-xs font-semibold ${trendInd >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {trendInd >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {Math.abs(trendInd)}% vs mês ant.
            </span>
          ) : (
            <p className="mt-1.5 text-xs text-slate-400">este mês: {last?.industria ?? 0}</p>
          )}
        </div>

        {showProprio && (
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Store className="h-4 w-4 text-emerald-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Próprio</span>
            </div>
            <p className="text-3xl font-extrabold tabular-nums text-emerald-600">{totProp.toLocaleString("pt-BR")}</p>
            {trendProp !== null ? (
              <span className={`mt-1.5 flex items-center gap-1 text-xs font-semibold ${trendProp >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {trendProp >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {Math.abs(trendProp)}% vs mês ant.
              </span>
            ) : (
              <p className="mt-1.5 text-xs text-slate-400">este mês: {last?.proprio ?? 0}</p>
            )}
          </div>
        )}

        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="h-4 w-4 text-slate-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total</span>
          </div>
          <p className="text-3xl font-extrabold tabular-nums text-slate-800">{totGeral.toLocaleString("pt-BR")}</p>
          {showProprio && totGeral > 0 ? (
            <p className="mt-1.5 text-xs text-slate-400">
              <span className="font-semibold text-violet-700">{Math.round(totInd / totGeral * 100)}%</span> ind. ·{" "}
              <span className="font-semibold text-emerald-600">{Math.round(totProp / totGeral * 100)}%</span> próprio
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-slate-400">~{data.length ? Math.round(totGeral / data.length) : 0}/mês</p>
          )}
        </div>
      </div>

      {/* gráfico */}
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-5 pb-4">
        <ChartContainer config={chartConfig} className="aspect-auto h-65 w-full">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradInd" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradProp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={30} />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
                />
              }
            />

            <Area
              dataKey="industria"
              type="monotone"
              fill="url(#gradInd)"
              stroke="#7c3aed"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            {showProprio && (
              <Area
                dataKey="proprio"
                type="monotone"
                fill="url(#gradProp)"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            )}

            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
