"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface LeadsContatoChartProps {
  contatados: number
  naoContatados: number
}

export default function ChartLeadsContato({
  contatados,
  naoContatados,
}: LeadsContatoChartProps) {
  const total = contatados + naoContatados
  const percContatados = total > 0 ? ((contatados / total) * 100).toFixed(2) : 0
  const percNaoContatados = total > 0 ? ((naoContatados / total) * 100).toFixed(2) : 0

  const data = [
    {
      name: "Contatados",
      quantidade: contatados,
      percentual: Number(percContatados),
      color: "hsl(142, 76%, 36%)",
    },
    {
      name: "Não Contatados",
      quantidade: naoContatados,
      percentual: Number(percNaoContatados),
      color: "hsl(0, 84%, 60%)",
    },
  ]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <p className="font-semibold text-sm mb-1">{payload[0].payload.name}</p>
          <p className="text-sm text-muted-foreground">
            Quantidade: <span className="font-medium text-foreground">{payload[0].payload.quantidade}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Percentual: <span className="font-medium text-foreground">{payload[0].payload.percentual}%</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Status de Contato dos Leads</CardTitle>
        <CardDescription>
          Distribuição entre leads contatados e não contatados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              className="text-sm"
              tick={{ fill: 'hsl(var(--foreground))' }}
            />
            <YAxis 
              className="text-sm"
              tick={{ fill: 'hsl(var(--foreground))' }}
              label={{ value: 'Quantidade', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar 
              dataKey="quantidade" 
              radius={[8, 8, 0, 0]}
              maxBarSize={120}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-3 w-3 rounded-full bg-green-600"></div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">Contatados</p>
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{contatados}</p>
            <p className="text-sm text-green-600 dark:text-green-500">{percContatados}% do total</p>
          </div>

          <div className="rounded-lg border bg-red-50 dark:bg-red-950/20 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-3 w-3 rounded-full bg-red-600"></div>
              <p className="text-sm font-medium text-red-900 dark:text-red-100">Não Contatados</p>
            </div>
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">{naoContatados}</p>
            <p className="text-sm text-red-600 dark:text-red-500">{percNaoContatados}% do total</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}