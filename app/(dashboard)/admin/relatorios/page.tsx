import { Suspense } from 'react'
import { Content } from "@/components/relatorios/content"
import { getConversaoPorLoja, getFunilPorAtendente, getTempoPorEtapa } from '@/lib/api-loja'
import { ChartConversaoPorLoja } from '@/components/dashboard/chart-conversao-por-loja'
import { ChartFunilPorAtendente } from '@/components/dashboard/chart-funil-por-atendente'
import { ChartTempoPorEtapa } from '@/components/dashboard/chart-tempo-por-etapa'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Relatórios | Noxus',
}

function ChartSkeleton() {
  return <Skeleton className="w-full h-80 rounded-xl" />
}

async function ConversaoChart() {
  const data = await getConversaoPorLoja()
  return <ChartConversaoPorLoja data={data} />
}

async function FunilAtendenteChart() {
  const data = await getFunilPorAtendente()
  return <ChartFunilPorAtendente data={data} />
}

async function TempoPorEtapaChart() {
  const data = await getTempoPorEtapa()
  return <ChartTempoPorEtapa data={data} />
}

export default async function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Relatórios</h2>
        <p className="text-muted-foreground mt-1">
          Gere e exporte relatórios do sistema
        </p>
      </div>

      <Content />

      <div>
        <h3 className="text-xl font-bold tracking-tight text-[#16255c] mb-4">Análise de Desempenho</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Suspense fallback={<ChartSkeleton />}>
            <ConversaoChart />
          </Suspense>

          <Suspense fallback={<ChartSkeleton />}>
            <TempoPorEtapaChart />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<ChartSkeleton />}>
        <FunilAtendenteChart />
      </Suspense>
    </div>
  )
}
