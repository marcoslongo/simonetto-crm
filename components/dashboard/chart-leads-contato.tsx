"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, MapPin } from "lucide-react"
import { formatMinutes } from "@/utils/formatMinutes"
import { MdOutlineContactPhone } from "react-icons/md";

interface LeadsContatoChartProps {
  contatados: number
  naoContatados: number
  tempoMedioAtendimentoMinutos: number 
  percentContatados: number
  percentNaoContatados: number
}

export default function ChartLeadsContato({
  contatados,
  naoContatados,
  tempoMedioAtendimentoMinutos,
  percentContatados,
  percentNaoContatados
}: LeadsContatoChartProps) {
  const total = contatados + naoContatados


  const data = [
    {
      name: "Contatados",
      quantidade: contatados,
      percentual: Number(percentContatados),
      color: "hsl(142, 76%, 36%)",
    },
    {
      name: "Não Contatados",
      quantidade: naoContatados,
      percentual: Number(percentNaoContatados),
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
    <Card className="w-full border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-[#0e1627]">Status de Contato dos Leads</CardTitle>
        
        <CardDescription className="flex items-center gap-2 text-slate-600">
          <MdOutlineContactPhone className="h-4 w-4" />
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

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-[#0e1627]/5 p-3 rounded-lg border border-[#0e1627]/10">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-3 w-3 rounded-full bg-green-600"></div>
              <p className="text-xs text-[#0e1627] font-semibold">Contatados</p>
            </div>
            <p className="text-2xl font-bold text-[#0e1627]">{contatados}</p>
            <p className="text-xs text-slate-500 font-medium">{percentContatados}% do total</p>
          </div>

          <div className="bg-[#0e1627]/5 p-3 rounded-lg border border-[#0e1627]/10">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-3 w-3 rounded-full bg-red-600"></div>
              <p className="text-xs text-[#0e1627] font-semibold">Não Contatados</p>
            </div>
            <p className="text-2xl font-bold text-[#0e1627]">{naoContatados}</p>
            <p className="text-xs text-slate-500 font-medium">{percentNaoContatados}% do total</p>
          </div>

          <div className="bg-[#0e1627]/5 p-3 rounded-lg border border-[#0e1627]/10">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3 w-3 text-[#0e1627]" />
              <p className="text-xs text-[#0e1627] font-semibold">Tempo Médio</p>
            </div>
            <p className="text-2xl font-bold text-[#0e1627]">{formatMinutes(tempoMedioAtendimentoMinutos)}</p>
            <p className="text-xs text-slate-500 font-medium">para realizar o atendimento</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}