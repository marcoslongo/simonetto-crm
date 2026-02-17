'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { Loja } from '@/lib/types'

interface LojaFilterProps {
  lojas: Loja[]
  selectedLojaId?: number
}

export function LojaFilter({ lojas, selectedLojaId }: LojaFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleLojaChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value === 'all') {
      params.delete('loja')
    } else {
      params.set('loja', value)
    }
    
    // Reset para página 1 ao mudar filtro
    params.delete('page')
    
    router.push(`?${params.toString()}`)
  }

  const clearFilter = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('loja')
    params.delete('page')
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedLojaId ? String(selectedLojaId) : 'all'}
        onValueChange={handleLojaChange}
      >
        <SelectTrigger className="w-50 bg-white">
          <SelectValue placeholder="Filtrar por loja" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as lojas</SelectItem>
          {lojas.map((loja) => (
            <SelectItem key={loja.id} value={String(loja.id)}>
              {loja.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedLojaId && (
        <Button variant="ghost" size="icon" onClick={clearFilter}>
          <X className="h-4 w-4" />
          <span className="sr-only">Limpar filtro</span>
        </Button>
      )}
    </div>
  )
}
