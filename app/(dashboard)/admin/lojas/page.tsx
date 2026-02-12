import { requireAdmin } from '@/lib/auth'
import { buscarLojas, type SortBy } from '@/lib/lojas-service'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2, Mail, MapPin, Search, TrendingUp, ArrowUpDown } from 'lucide-react'
import { LeadsPagination } from '@/components/dashboard/leads-pagination'
import Link from 'next/link'
import { Input } from '@/components/ui/input'

export const metadata = {
  title: 'Lojas | Admin',
  description: 'Gerenciamento de unidades',
}

interface AdminLojasPageProps {
  searchParams: Promise<{ 
    page?: string
    search?: string
    sortBy?: string 
  }>
}

const PER_PAGE = 9

export default async function AdminLojasPage({
  searchParams,
}: AdminLojasPageProps) {
  await requireAdmin()

  const params = await searchParams
  const page = Number(params.page) || 1
  const searchQuery = params.search || ''
  const sortBy = (params.sortBy as SortBy) || 'nome'

  const resultado = await buscarLojas({
    search: searchQuery,
    sortBy,
    page,
    perPage: PER_PAGE,
  })

  const { items: lojasPaginadas, total, totalPages } = resultado

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Unidades</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie todas as lojas do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {total} {total === 1 ? 'unidade' : 'unidades'}
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                name="search"
                placeholder="Buscar por nome, localização ou email..."
                defaultValue={searchQuery}
                className="pl-10 h-11"
              />
            </div>
            <div className="flex gap-2">
              <Select name="sortBy" defaultValue={sortBy}>
                <SelectTrigger className="w-55 h-11">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nome">Nome (A-Z)</SelectItem>
                  <SelectItem value="nome-desc">Nome (Z-A)</SelectItem>
                  <SelectItem value="leads-desc">Mais leads</SelectItem>
                  <SelectItem value="leads-asc">Menos leads</SelectItem>
                  <SelectItem value="hoje-desc">Mais leads hoje</SelectItem>
                  <SelectItem value="hoje-asc">Menos leads hoje</SelectItem>
                  <SelectItem value="localizacao">Localização (A-Z)</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" size="lg" className="h-11 px-6 bg-[#16255c] cursor-pointer hover:bg-[#16255c] hover:opacity-90">
                <Search className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Buscar</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {lojasPaginadas.length > 0 ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lojasPaginadas.map((loja) => (
              <Card
                key={loja.id}
                className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg leading-tight">
                          {loja.nome}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ID: {loja.id}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="line-clamp-1">{loja.localizacao}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    {loja.emails && loja.emails[0] ? (
                      <a
                        href={`mailto:${loja.emails[0].email}`}
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors line-clamp-1"
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
                      <p className="text-xs text-muted-foreground font-medium">
                        Total de Leads
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{loja.totalLeads}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">
                        Hoje
                      </p>
                      <div className="flex items-center gap-2">
                        {loja.leadsHoje > 0 ? (
                          <>
                            <p className="text-2xl font-bold text-green-600">
                              +{loja.leadsHoje}
                            </p>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          </>
                        ) : (
                          <p className="text-2xl font-bold text-muted-foreground">
                            0
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/admin/lojas/${loja.id}`}
                    className="block w-full rounded-lg bg-[#16255c] hover:bg-[#16255c] hover:opacity-90 px-4 py-2.5 text-center text-sm font-medium text-white transition-all"
                  >
                    Ver detalhes
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <LeadsPagination
            currentPage={page}
            totalPages={totalPages}
            total={total}
            perPage={PER_PAGE}
          />
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma loja encontrada
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchQuery
                ? `Não encontramos lojas com "${searchQuery}". Tente buscar por outro termo.`
                : 'Não há lojas cadastradas no sistema.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}