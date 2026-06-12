import { Content } from "@/components/relatorios/content"
import { getLojasServer } from "@/lib/server-lojas-service"
import { requireAdmin, isMaster } from "@/lib/auth"

export const metadata = {
  title: 'Relatórios | Noxus',
}

export default async function ReportsPage() {
  const [user, lojas] = await Promise.all([requireAdmin(), getLojasServer()])
  const master = isMaster(user)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Relatórios</h2>
        <p className="text-muted-foreground mt-1">
          Gere e exporte relatórios do sistema
        </p>
      </div>

      <Content lojas={lojas.map(l => ({ id: Number(l.id), nome: l.nome }))} showProprio={master} />
    </div>
  )
}
