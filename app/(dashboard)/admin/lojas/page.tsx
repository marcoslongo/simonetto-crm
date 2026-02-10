import { requireAdmin } from '@/lib/auth'
import { getLojas } from '@/lib/api'
import { getLeadsStats } from '@/lib/leads-service'
import type { Loja } from '@/lib/types'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { Building2, Mail, MapPin } from 'lucide-react'
import { LeadsPagination } from '@/components/dashboard/leads-pagination'
import Link from 'next/link'

export const metadata = {
  title: 'Lojas | Admin CRM',
  description: 'Gerenciamento de unidades',
}

interface AdminLojasPageProps {
  searchParams: Promise<{ page?: string }>
}

interface LojaWithStats extends Loja {
  totalLeads: number
  leadsHoje: number
}

const PER_PAGE = 10

export default async function AdminLojasPage({
  searchParams,
}: AdminLojasPageProps) {
  await requireAdmin()

  const params = await searchParams
  const page = Number(params.page) || 1

  const lojasResponse = await getLojas()
  if (!lojasResponse.success) {
    throw new Error('Falha ao carregar lojas')
  }

  const lojasOrdenadas = [...lojasResponse.lojas].sort((a, b) =>
    a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
  )

  const total = lojasOrdenadas.length
  const totalPages = Math.ceil(total / PER_PAGE)

  const start = (page - 1) * PER_PAGE
  const end = start + PER_PAGE
  const lojasPaginadas = lojasOrdenadas.slice(start, end)

  const lojasWithStats: LojaWithStats[] = await Promise.all(
    lojasPaginadas.map(async (loja) => {
      const stats = await getLeadsStats(Number(loja.id))
      return {
        ...loja,
        totalLeads: stats.total,
        leadsHoje: stats.today,
      }
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Unidades</h2>
        <p className="text-muted-foreground">
          Gerencie todas as lojas do sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lojas</CardTitle>
          <CardDescription>
            Total de {total} unidades • Ordenadas alfabeticamente
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {lojasWithStats.length > 0 ? (
            <>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Leads</TableHead>
                      <TableHead className="text-center">Hoje</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {lojasWithStats.map((loja) => (
                      <TableRow key={loja.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                              <Building2 className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{loja.nome}</p>
                              <p className="text-xs text-muted-foreground">
                                ID: {loja.id}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {loja.localizacao}
                          </div>
                        </TableCell>

                        <TableCell>
                          {loja.emails && loja.emails[0] ? (
                            <a
                              href={`mailto:${loja.emails[0].email}`}
                              className="text-sm hover:underline"
                            >
                              <Mail className="h-3 w-3 inline mr-1 text-muted-foreground" />
                              {loja.emails[0].email}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge variant="secondary">{loja.totalLeads}</Badge>
                        </TableCell>

                        <TableCell className="text-center">
                          {loja.leadsHoje > 0 ? (
                            <Badge variant="default">+{loja.leadsHoje}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          <Link
                            href={`/admin/lojas/${loja.id}`}
                            className="inline-block rounded bg-primary px-3 py-1 text-sm font-medium text-white hover:bg-primary/80 transition"
                          >
                            Ver detalhes
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <LeadsPagination
                currentPage={page}
                totalPages={totalPages}
                total={total}
                perPage={PER_PAGE}
              />
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma loja encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
