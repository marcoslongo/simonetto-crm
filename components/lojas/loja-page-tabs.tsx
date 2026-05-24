'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayoutDashboard, Users, BarChart2, Settings } from 'lucide-react'
import type { ReactNode } from 'react'

interface LojaPageTabsProps {
  visaoGeral: ReactNode
  leads: ReactNode
  relatorios: ReactNode
  configuracoes?: ReactNode
}

export function LojaPageTabs({ visaoGeral, leads, relatorios, configuracoes }: LojaPageTabsProps) {
  return (
    <Tabs defaultValue="visao-geral" className="space-y-6">
      <TabsList className="h-auto p-1 flex flex-wrap gap-0.5">
        <TabsTrigger value="visao-geral" className="flex items-center gap-1.5 text-sm">
          <LayoutDashboard className="h-4 w-4" />
          Visão Geral
        </TabsTrigger>
        <TabsTrigger value="leads" className="flex items-center gap-1.5 text-sm">
          <Users className="h-4 w-4" />
          Leads
        </TabsTrigger>
        <TabsTrigger value="relatorios" className="flex items-center gap-1.5 text-sm">
          <BarChart2 className="h-4 w-4" />
          Relatórios
        </TabsTrigger>
        {configuracoes && (
          <TabsTrigger value="configuracoes" className="flex items-center gap-1.5 text-sm">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="visao-geral" className="space-y-6 mt-0">
        {visaoGeral}
      </TabsContent>
      <TabsContent value="leads" className="space-y-6 mt-0">
        {leads}
      </TabsContent>
      <TabsContent value="relatorios" className="space-y-6 mt-0">
        {relatorios}
      </TabsContent>
      {configuracoes && (
        <TabsContent value="configuracoes" className="space-y-6 mt-0">
          {configuracoes}
        </TabsContent>
      )}
    </Tabs>
  )
}
