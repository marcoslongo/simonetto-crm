"use client"

import * as React from "react"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DateRange } from "react-day-picker"
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

  const [open, setOpen] = React.useState(false)

  // Inicializa o range a partir dos searchParams
  const [date, setDate] = React.useState<DateRange | undefined>(() => {
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    return from || to
      ? {
          from: from ? new Date(from) : undefined,
          to: to ? new Date(to) : undefined,
        }
      : undefined
  })

  const hasFilter = !!date?.from || !!date?.to

  function applyFilter(range: DateRange | undefined) {
    const params = new URLSearchParams(searchParams.toString())

    // Reseta para a página 1 ao filtrar
    params.delete("page")

    if (range?.from) {
      params.set("from", format(range.from, "yyyy-MM-dd"))
    } else {
      params.delete("from")
    }

    if (range?.to) {
      params.set("to", format(range.to, "yyyy-MM-dd"))
    } else {
      params.delete("to")
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  function clearFilter() {
    setDate(undefined)
    applyFilter(undefined)
    setOpen(false)
  }

  function handleSelect(range: DateRange | undefined) {
    setDate(range)
    // Aplica assim que tiver from e to selecionados
    if (range?.from && range?.to) {
      applyFilter(range)
      setOpen(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "min-w-[240px] justify-start text-left font-normal",
              !hasFilter && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd/MM/yyyy", { locale: ptBR })} →{" "}
                  {format(date.to, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                format(date.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span>Filtrar por período</span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={ptBR}
          />
          <div className="flex items-center justify-between border-t px-3 py-2">
            <p className="text-xs text-muted-foreground">
              {date?.from && !date?.to
                ? "Selecione a data final"
                : "Selecione o período desejado"}
            </p>
            {hasFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilter}
                className="h-7 px-2 text-xs"
              >
                Limpar
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {hasFilter && (
        <Button
          variant="ghost"
          size="icon"
          onClick={clearFilter}
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          title="Remover filtro de data"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}