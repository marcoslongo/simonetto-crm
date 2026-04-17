'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Search, Eraser } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function DateFilterClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [from, setFrom] = useState<Date | undefined>(
    searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined
  )
  const [to, setTo] = useState<Date | undefined>(
    searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined
  )

  const isFiltered = !!searchParams.get('from') || !!searchParams.get('to')

  function handleBuscar() {
    if (!from || !to) return
    const params = new URLSearchParams()
    params.set('from', format(from, 'yyyy-MM-dd'))
    params.set('to', format(to, 'yyyy-MM-dd'))
    router.push(`?${params.toString()}`)
  }

  function handleLimpar() {
    setFrom(undefined)
    setTo(undefined)
    router.push('?')
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-40 justify-start">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {from ? format(from, 'dd/MM/yyyy', { locale: ptBR }) : 'Data inicial'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={from} onSelect={setFrom} locale={ptBR} />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-40 justify-start">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {to ? format(to, 'dd/MM/yyyy', { locale: ptBR }) : 'Data final'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={to} onSelect={setTo} locale={ptBR} />
        </PopoverContent>
      </Popover>

      <Button
        onClick={handleBuscar}
        disabled={!from || !to}
        className="bg-[#16255c] hover:bg-[#0f1a45] flex items-center gap-1.5 cursor-pointer"
      >
        <Search className="h-4 w-4" />
        Buscar
      </Button>

      {isFiltered && (
        <Button
          variant="destructive"
          onClick={handleLimpar}
          className="flex gap-2 items-center text-white cursor-pointer"
        >
          <Eraser className="h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  )
}