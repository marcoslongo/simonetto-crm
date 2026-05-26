import { requireGerente } from '@/lib/auth'
import { getLojas } from '@/lib/api'
import { getLojaStats } from '@/lib/api-loja'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Building2, MapPin, Mail, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Unidades | Noxus - Lead Ops',
  description: 'Visão individual de cada unidade vinculada',
}

export default async function CrmUnidadesPage() {
  const user = await requireGerente()

  if (user.loja_ids.length <= 1) redirect('/crm')

  const lojasData = await getLojas().catch(() => ({ success: false, lojas: [] }))
  const lojasVinculadas = lojasData.lojas.filter(l => user.loja_ids.includes(Number(l.id)))

  const lojasComStats = await Promise.all(
    lojasVinculadas.map(async loja => {
      const stats = await getLojaStats(loja.id).catch(() => ({ total: 0, hoje: 0, semana: 0, mes: 0 }))
      return { ...loja, totalLeads: stats.total, leadsHoje: stats.hoje }
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Unidades</h2>
        <p className="text-muted-foreground mt-1">
          Resultados individuais de cada unidade vinculada ao seu usuário
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {lojasComStats.map(loja => (
          <Card
            key={loja.id}
            className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-linear-to-br from-slate-50 to-slate-100"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg leading-tight">{loja.nome}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">ID: {loja.id}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">{loja.localizacao}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                {loja.emails?.[0] ? (
                  <a
                    href={`mailto:${loja.emails[0].email}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{loja.emails[0].email}</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span>Sem email</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Total de Leads</p>
                  <p className="text-2xl font-bold">{loja.totalLeads}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Hoje</p>
                  <div className="flex items-center gap-2">
                    {loja.leadsHoje > 0 ? (
                      <>
                        <p className="text-2xl font-bold text-green-600">+{loja.leadsHoje}</p>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </>
                    ) : (
                      <p className="text-2xl font-bold text-muted-foreground">0</p>
                    )}
                  </div>
                </div>
              </div>

              <Link
                href={`/crm/unidades/${loja.id}`}
                className="block w-full rounded-lg bg-[#16255c] hover:opacity-90 px-4 py-2.5 text-center text-sm font-medium text-white transition-all"
              >
                Ver detalhes
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
