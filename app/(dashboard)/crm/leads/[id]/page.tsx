import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth, canAccessLead } from '@/lib/auth'
import { getLeadById } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Store, 
  Calendar,
  DollarSign,
  MessageSquare,
  User
} from 'lucide-react'

export const metadata = {
  title: 'Detalhes do Lead | CRM Multi-Unidades',
}

interface LeadDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const user = await requireAuth()
  const { id } = await params
  
  const lojaId = user.role === 'loja' ? user.loja_id : undefined
  const lead = getLeadById(Number(id), lojaId)

  if (!lead) {
    notFound()
  }

  // Verifica permissão de acesso
  if (!canAccessLead(user, lead.loja_id)) {
    notFound()
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/crm/leads">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{lead.nome}</h2>
          <p className="text-muted-foreground">Lead #{lead.id}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações de Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <a 
                  href={`mailto:${lead.email}`} 
                  className="font-medium hover:underline"
                >
                  {lead.email}
                </a>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <a 
                  href={`tel:${lead.telefone}`} 
                  className="font-medium hover:underline"
                >
                  {lead.telefone}
                </a>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Localização</p>
                <p className="font-medium">
                  {lead.cidade && lead.estado
                    ? `${lead.cidade}/${lead.estado}`
                    : 'Não informado'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interesse e Investimento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Interesse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tipo de Interesse</p>
              {lead.interesse ? (
                <Badge variant="secondary" className="text-sm">
                  {lead.interesse}
                </Badge>
              ) : (
                <p className="text-muted-foreground">Não informado</p>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-1">Expectativa de Investimento</p>
              <p className="font-medium">
                {lead.expectativa_investimento || 'Não informado'}
              </p>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-1">Região de Interesse</p>
              <p className="font-medium">
                {lead.loja_regiao || 'Não informado'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Loja Associada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Loja Associada
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lead.loja_nome ? (
              <div className="space-y-2">
                <p className="font-medium text-lg">{lead.loja_nome}</p>
                {(lead.loja_cidade || lead.loja_estado) && (
                  <p className="text-muted-foreground">
                    {[lead.loja_cidade, lead.loja_estado].filter(Boolean).join('/')}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhuma loja associada</p>
            )}
          </CardContent>
        </Card>

        {/* Datas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Datas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Data de Criação</p>
              <p className="font-medium">{formatDate(lead.data_criacao)}</p>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-1">Última Atualização</p>
              <p className="font-medium">{formatDate(lead.data_atualizacao)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mensagem */}
      {lead.mensagem && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Mensagem
            </CardTitle>
            <CardDescription>Mensagem enviada pelo lead</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-foreground">{lead.mensagem}</p>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      <Card>
        <CardContent className="flex flex-wrap gap-4 pt-6">
          <Button asChild>
            <a href={`mailto:${lead.email}`}>
              <Mail className="mr-2 h-4 w-4" />
              Enviar Email
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={`tel:${lead.telefone}`}>
              <Phone className="mr-2 h-4 w-4" />
              Ligar
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a 
              href={`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
