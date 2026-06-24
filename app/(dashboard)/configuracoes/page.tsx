import { requireAuth, isGerente, isMaster } from '@/lib/auth'
import { getLojaIntegration } from '@/lib/api-loja'
import { ConfiguracoesTabs } from './configuracoes-tabs'

export const metadata = {
  title: 'Configurações | Noxus - Lead Ops',
}

export default async function ConfiguracoesPage() {
  const user = await requireAuth()

  const isLoja        = user.loja_ids.length > 0
  const gerenteFlag   = isGerente(user)
  const masterFlag    = isMaster(user)
  const primaryLojaId = isLoja ? String(user.loja_ids[0]) : null
  const integration   = isLoja ? await getLojaIntegration(user.loja_ids[0]) : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Configurações</h2>
        <p className="text-muted-foreground mt-1">Gerencie as configurações da sua conta</p>
      </div>

      <ConfiguracoesTabs
        user={{
          id:         user.id,
          name:       user.name,
          email:      user.email,
          role:       user.role,
          avatar_url: user.avatar_url ?? null,
          loja_nome:  user.loja_nome ?? null,
          is_gerente: gerenteFlag,
          is_master:  masterFlag,
        }}
        isLoja={isLoja}
        primaryLojaId={primaryLojaId}
        integration={integration}
        siteUrl={process.env.NEXT_PUBLIC_SITE_URL}
      />
    </div>
  )
}
