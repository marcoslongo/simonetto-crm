"use client"

import { Chart } from "react-google-charts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MapPin, TrendingUp } from "lucide-react"

interface ChartGeoBrasilProps {
  data: {
    estado: string
    total: number
  }[]
}

export function ChartGeoBrasil({ data }: ChartGeoBrasilProps) {
  const chartData = [
    ["State", "Leads"],
    ...data.map(item => [`BR-${item.estado}`, item.total]),
  ]

  const totalLeads = data.reduce((sum, item) => sum + item.total, 0)
  const estadoMaisLeads = data.reduce((prev, current) => 
    (prev.total > current.total) ? prev : current
  )

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-[#0e1627]">
              Leads por Estado
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-slate-600">
              <MapPin className="h-4 w-4" />
              Distribuição geográfica nacional
            </CardDescription>
          </div>

          <div className="text-right bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs text-[#0e1627] font-semibold">Estado líder</p>
            <p className="text-2xl font-bold text-[#0e1627]">{estadoMaisLeads.estado}</p>
            <p className="text-xs text-slate-500 font-medium">{estadoMaisLeads.total} leads</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="h-[400px] bg-white/50 backdrop-blur-sm rounded-xl p-4 shadow-inner">
          <Chart
            chartType="GeoChart"
            width="100%"
            height="100%"
            data={chartData}
            options={{
              region: "BR",
              resolution: "provinces",
              colorAxis: {
                colors: ["#93c5fd", "#3b82f6", "#1e40af", "#0e1627"],
                minValue: 0,
              },
              backgroundColor: "transparent",
              datalessRegionColor: "#e5e7eb",
              defaultColor: "#d1d5db",
              tooltip: {
                textStyle: {
                  color: "#0e1627",
                  fontSize: 13,
                  bold: true,
                },
                showColorCode: false,
              },
              legend: "none",
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0e1627]/5 p-3 rounded-lg border border-[#0e1627]/10">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-[#0e1627]" />
              <p className="text-xs text-[#0e1627] font-semibold">Total Nacional</p>
            </div>
            <p className="text-2xl font-bold text-[#0e1627]">{totalLeads}</p>
            <p className="text-xs text-slate-500 font-medium">leads capturados</p>
          </div>

          <div className="bg-[#0e1627]/5 p-3 rounded-lg border border-[#0e1627]/10">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-[#0e1627]" />
              <p className="text-xs text-[#0e1627] font-semibold">Estados Ativos</p>
            </div>
            <p className="text-2xl font-bold text-[#0e1627]">{data.length}</p>
            <p className="text-xs text-slate-500 font-medium">com captação</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}