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
    <Card className="border-0 shadow-lg bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Leads por Estado
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-teal-700">
              <MapPin className="h-4 w-4" />
              Distribuição geográfica nacional
            </CardDescription>
          </div>

          <div className="text-right bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-teal-100">
            <p className="text-xs text-teal-600 font-semibold">Estado líder</p>
            <p className="text-2xl font-bold text-teal-700">{estadoMaisLeads.estado}</p>
            <p className="text-xs text-teal-500 font-medium">{estadoMaisLeads.total} leads</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="h-100 bg-white/50 backdrop-blur-sm rounded-xl p-4 shadow-inner">
          <Chart
            chartType="GeoChart"
            width="100%"
            height="100%"
            data={chartData}
            options={{
              region: "BR",
              resolution: "provinces",
              colorAxis: {
                colors: ["#a7f3d0", "#10b981", "#059669", "#047857"],
                minValue: 0,
              },
              backgroundColor: "transparent",
              datalessRegionColor: "#e5e7eb",
              defaultColor: "#d1d5db",
              tooltip: {
                textStyle: {
                  color: "#1f2937",
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
          <div className="bg-linear-to-br from-emerald-100 to-teal-100 p-3 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <p className="text-xs text-emerald-700 font-semibold">Total Nacional</p>
            </div>
            <p className="text-2xl font-bold text-emerald-800">{totalLeads}</p>
            <p className="text-xs text-emerald-600 font-medium">leads capturados</p>
          </div>

          <div className="bg-linear-to-br from-teal-100 to-cyan-100 p-3 rounded-lg border border-teal-200">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-teal-600" />
              <p className="text-xs text-teal-700 font-semibold">Estados Ativos</p>
            </div>
            <p className="text-2xl font-bold text-teal-800">{data.length}</p>
            <p className="text-xs text-teal-600 font-medium">com captação</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}