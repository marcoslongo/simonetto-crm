"use client"

import { useState } from "react"
import { Chart } from "react-google-charts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import { MapPin, TrendingUp, Store, ChevronRight } from "lucide-react"
import Link from "next/link"

interface Loja {
  id: number
  nome: string
  leads: number
}

interface ChartGeoBrasilProps {
  data: {
    estado: string
    total: number
    lojas: Loja[]
  }[]
}

export function ChartGeoBrasil({ data }: ChartGeoBrasilProps) {
  const [estadoSelecionado, setEstadoSelecionado] =
    useState<ChartGeoBrasilProps["data"][0] | null>(null)

  const chartData = [
    ["State", "Leads"],
    ...data.map(item => [`BR-${item.estado}`, item.total]),
  ]

  const totalLeads = data.reduce((sum, item) => sum + item.total, 0)

  const estadoMaisLeads = data.reduce((prev, current) =>
    prev.total > current.total ? prev : current
  )

  return (
    <>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-[#16255c]">
                Leads por Estado
              </CardTitle>

              <CardDescription className="flex items-center gap-2 text-slate-600">
                <MapPin className="h-4 w-4" />
                Clique no estado para ver lojas
              </CardDescription>
            </div>

            <div className="text-right bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-slate-200">
              <p className="text-xs text-[#16255c] font-semibold">
                Estado líder
              </p>
              <p className="text-2xl font-bold text-[#16255c]">
                {estadoMaisLeads.estado}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                {estadoMaisLeads.total} leads
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="h-[400px] bg-white/50 rounded-xl p-4 shadow-inner">
            <Chart
              chartType="GeoChart"
              width="100%"
              height="100%"
              data={chartData}
              chartEvents={[
                {
                  eventName: "select",
                  callback: ({ chartWrapper }) => {
                    if (!chartWrapper) return

                    const chart = chartWrapper.getChart()
                    const selection = chart.getSelection()

                    if (!selection?.length) return

                    const row = selection[0].row
                    if (row == null) return

                    const estadoSigla = String(
                      chartData[row + 1][0]
                    ).replace("BR-", "")

                    const estadoData = data.find(
                      e => e.estado === estadoSigla
                    )

                    if (estadoData) {
                      setEstadoSelecionado(estadoData)
                    }
                  },
                },
              ]}
              options={{
                region: "BR",
                resolution: "provinces",
                colorAxis: {
                  colors: ["#93c5fd", "#3b82f6", "#1e40af", "#16255c"],
                  minValue: 0,
                },
                backgroundColor: "transparent",
                datalessRegionColor: "#e5e7eb",
                defaultColor: "#d1d5db",
                legend: "none",
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#16255c]/5 p-3 rounded-lg border border-[#16255c]/10">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-[#16255c]" />
                <p className="text-xs text-[#16255c] font-semibold">
                  Total Nacional
                </p>
              </div>
              <p className="text-2xl font-bold text-[#16255c]">
                {totalLeads}
              </p>
              <p className="text-xs text-slate-500">
                leads capturados
              </p>
            </div>

            <div className="bg-[#16255c]/5 p-3 rounded-lg border border-[#16255c]/10">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-[#16255c]" />
                <p className="text-xs text-[#16255c] font-semibold">
                  Estados Ativos
                </p>
              </div>
              <p className="text-2xl font-bold text-[#16255c]">
                {data.length}
              </p>
              <p className="text-xs text-slate-500">
                com captação
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!estadoSelecionado}
        onOpenChange={() => setEstadoSelecionado(null)}
      >
        <DialogContent className="flex flex-col h-[70vh] overflow-hidden max-w-2xl p-0">
          <div className="px-6 pt-6">
            <DialogHeader className="border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-card-foreground">
                    Lojas — {estadoSelecionado?.estado}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {estadoSelecionado?.lojas.length} {estadoSelecionado?.lojas.length === 1 ? 'loja' : 'lojas'} com captação neste estado
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-3">
              {estadoSelecionado?.lojas.map(loja => (
                <div
                  key={loja.id}
                  className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-md hover:border-accent/40"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold text-card-foreground">
                        {loja.nome}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <TrendingUp className="h-3.5 w-3.5" />
                          <span>{loja.leads} leads capturados</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link href={`/admin/lojas/${loja.id}`}>
                    <Button 
                      size="sm" 
                      className="gap-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer bg-[#16255c] hover:bg-[#16255c] hover:opacity-90"
                    >
                      Ver resultados
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}