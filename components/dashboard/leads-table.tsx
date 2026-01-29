'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Eye, Mail, Phone, MapPin, Store } from 'lucide-react'
import type { Lead } from '@/lib/types'

interface LeadsTableProps {
  leads: Lead[]
  basePath: string
  showLoja?: boolean
  isLoading?: boolean
}

export function LeadsTable({ leads, basePath, showLoja = false, isLoading = false }: LeadsTableProps) {
  if (isLoading) {
    return <LeadsTableSkeleton />
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <Mail className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">Nenhum lead encontrado</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Os leads aparecerão aqui quando forem capturados
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Localização</TableHead>
            {showLoja && <TableHead>Loja</TableHead>}
            <TableHead>Interesse</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="w-[80px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <div className="font-medium">{lead.nome}</div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Mail className="h-3 w-3" />
                    <span className="truncate max-w-[150px]">{lead.email}</span>
                  </a>
                  <a
                    href={`tel:${lead.telefone}`}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Phone className="h-3 w-3" />
                    {lead.telefone}
                  </a>
                </div>
              </TableCell>
              <TableCell>
                {lead.cidade || lead.estado ? (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {[lead.cidade, lead.estado].filter(Boolean).join('/')}
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              {showLoja && (
                <TableCell>
                  {lead.loja_nome ? (
                    <div className="flex items-center gap-1">
                      <Store className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{lead.loja_nome}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              )}
              <TableCell>
                {lead.interesse ? (
                  <Badge variant="secondary" className="text-xs">
                    {lead.interesse}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <time
                  dateTime={lead.data_criacao}
                  className="text-sm text-muted-foreground"
                  title={new Date(lead.data_criacao).toLocaleString('pt-BR')}
                >
                  {formatDistanceToNow(new Date(lead.data_criacao), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </time>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`${basePath}/leads/${lead.id}`}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Ver detalhes</span>
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function LeadsTableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Localização</TableHead>
            <TableHead>Interesse</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="w-[80px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
