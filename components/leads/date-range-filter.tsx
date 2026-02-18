"use client"

import * as React from "react"
import { CalendarIcon, Eraser, Search, X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DateRangeFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [from, setFrom] = React.useState<Date | undefined>(() => {
    const param = searchParams.get("from")
    return param ? new Date(param) : undefined
  })

  const [to, setTo] = React.useState<Date | undefined>(() => {
    const param = searchParams.get("to")
    return param ? new Date(param) : undefined
  })

  const hasFilter = !!from || !!to

  function applyFilter() {
    const params = new URLSearchParams(searchParams.toString())

    params.delete("page")

    if (from) {
      params.set("from", format(from, "yyyy-MM-dd"))
    } else {
      params.delete("from")
    }

    if (to) {
      params.set("to", format(to, "yyyy-MM-dd"))
    } else {
      params.delete("to")
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  function clearFilter() {
    setFrom(undefined)
    setTo(undefined)

    const params = new URLSearchParams(searchParams.toString())
    params.delete("from")
    params.delete("to")
    params.delete("page")

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-40 h-12 justify-start text-left font-normal",
              !from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {from
              ? format(from, "dd/MM/yyyy", { locale: ptBR })
              : "Data inicial"}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={from}
            onSelect={setFrom}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-40 h-12 justify-start text-left font-normal",
              !to && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {to
              ? format(to, "dd/MM/yyyy", { locale: ptBR })
              : "Data final"}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={to}
            onSelect={setTo}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
      <div className="flex gap-4">
        <Button onClick={applyFilter} size="lg" className='h-11 px-6 bg-[#16255c] cursor-pointer hover:bg-[#16255c] hover:opacity-90'>
          <Search className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Buscar</span>
        </Button>

        {hasFilter && (
          <Button
            variant="destructive"
            size="icon"
            onClick={clearFilter}
            className="w-34 h-11 hover:text-white flex gap-2 items-center text-white cursor-pointer"
          >
            Limpar datas
            <Eraser size={24} />
          </Button>
        )}
      </div>
    </div>
  )
}
