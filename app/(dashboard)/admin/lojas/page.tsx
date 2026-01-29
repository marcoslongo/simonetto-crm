import { requireAdmin } from '@/lib/auth'
import { mockLojas, getDashboardStats } from '@/lib/mock-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Building2, Mail, MapPin, Users } from 'lucide-react'

export const metadata = {
  title: 'Lojas | Admin CRM',
  description: 'Gerenciamento de unidades',
}

export default async function AdminLojasPage() {
  await requireAdmin()
  
  // Estatísticas por loja
  const lojasWithStats = mockLojas.map((loja) => {
    const stats = getDashboardStats(loja.id)
    return {
      ...loja,
      totalLeads: stats.totalLeads,
      leadsHoje: stats.leadsHoje,
    }
  })

  const totalLeads = lojasWithStats.reduce((acc, l) => acc + l.totalLeads, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Unidades</h2>
        <p className="text-muted-foreground">
          Gerenciamento de todas as lojas do sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Unidades
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockLojas.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Leads
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Média por Loja
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalLeads / mockLojas.length).toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas as Unidades</CardTitle>
          <CardDescription>
            Lista de todas as lojas cadastradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Leads</TableHead>
                  <TableHead className="text-center">Hoje</TableHead>
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
                          className="flex items-center gap-1 text-sm hover:underline"
                        >
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {loja.emails[0].email}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {loja.totalLeads}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {loja.leadsHoje > 0 ? (
                        <Badge variant="default">
                          +{loja.leadsHoje}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
