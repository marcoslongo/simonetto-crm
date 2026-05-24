'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Server, Users } from 'lucide-react'
import { EvolutionServerSettings } from './evolution-server-settings'
import { UsuariosWhatsAppList } from './usuarios-whatsapp-list'

export function AdminConfigTabs() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-[#16255c]">Administração</h3>
        <p className="text-sm text-muted-foreground">Configurações globais e gestão de usuários</p>
      </div>

      <Tabs defaultValue="servidor" className="space-y-4">
        <TabsList className="h-auto p-1">
          <TabsTrigger value="servidor" className="flex items-center gap-1.5 text-sm">
            <Server className="h-4 w-4" />
            Servidor Evolution
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex items-center gap-1.5 text-sm">
            <Users className="h-4 w-4" />
            Usuários WhatsApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="servidor" className="mt-0">
          <EvolutionServerSettings />
        </TabsContent>

        <TabsContent value="usuarios" className="mt-0">
          <UsuariosWhatsAppList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
