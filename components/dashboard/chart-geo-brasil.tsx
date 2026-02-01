"use client"

import { Chart } from "react-google-charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads por Estado</CardTitle>
      </CardHeader>

      <CardContent className="h-[400px]">
        <Chart
          chartType="GeoChart"
          width="100%"
          height="100%"
          data={chartData}
          options={{
            region: "BR",
            resolution: "provinces",
            colorAxis: {
              colors: ["#E0F2FE", "#0284C7"],
            },
            backgroundColor: "transparent",
            datalessRegionColor: "#F1F5F9",
            defaultColor: "#CBD5E1",
          }}
        />
      </CardContent>
    </Card>
  )
}
