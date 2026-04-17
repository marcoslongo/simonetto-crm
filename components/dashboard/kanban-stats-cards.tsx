import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  UserPlus,
  MessageSquare,
  CheckCircle2,
  XCircle
} from "lucide-react"

interface KanbanStatsCardsProps {
  data: {
    nao_atendido: number
    em_negociacao: number
    venda_realizada: number
    venda_nao_realizada: number
  }
}

export function KanbanStatsCards({ data }: KanbanStatsCardsProps) {
  const stats = [
    {
      title: "Não Atendidos",
      value: data.nao_atendido,
      icon: UserPlus,
      color: "text-slate-500",
      bg: "bg-slate-100",
    },
    {
      title: "Em Negociação",
      value: data.em_negociacao,
      icon: MessageSquare,
      color: "text-blue-500",
      bg: "bg-blue-100",
    },
    {
      title: "Vendas Realizadas",
      value: data.venda_realizada,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-100",
    },
    {
      title: "Vendas Perdidas",
      value: data.venda_nao_realizada,
      icon: XCircle,
      color: "text-rose-500",
      bg: "bg-rose-100",
    },
  ]

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-[#16255c]">
          Status do Funil
        </h2>
        <p className="flex items-center gap-2 text-slate-600">
          Acompanhamento em tempo real da jornada de vendas de todas as lojas
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="overflow-hidden border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-[#16255c]/70">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#16255c]">
                {stat.value.toLocaleString('pt-BR')}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">
                Total na coluna
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}