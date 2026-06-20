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
    <div className="flex flex-col gap-2 w-full sm:flex-row sm:flex-wrap sm:items-center">
      {/* Date pickers — 2 colunas em mobile, inline em sm+ */}
      <div className="grid grid-cols-2 gap-2 sm:contents">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-11 justify-start text-left font-normal w-full sm:w-40",
                !from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">
                {from ? format(from, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={from} onSelect={setFrom} locale={ptBR} />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-11 justify-start text-left font-normal w-full sm:w-40",
                !to && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">
                {to ? format(to, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={to} onSelect={setTo} locale={ptBR} />
          </PopoverContent>
        </Popover>
      </div>

      {/* Ações */}
      <div className="flex gap-2">
        <Button
          onClick={applyFilter}
          size="lg"
          className="h-11 px-4 sm:px-6 bg-[#16255c] cursor-pointer hover:bg-[#16255c] hover:opacity-90 shrink-0"
        >
          <Search className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Filtrar</span>
        </Button>

        {hasFilter && (
          <Button
            variant="destructive"
            onClick={clearFilter}
            className="h-11 px-4 flex gap-2 items-center cursor-pointer"
          >
            <Eraser className="h-4 w-4" />
            <span className="hidden sm:inline">Limpar</span>
          </Button>
        )}
      </div>
    </div>
  )
}
