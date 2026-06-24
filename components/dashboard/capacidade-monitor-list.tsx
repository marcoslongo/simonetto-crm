'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { CapacidadeLojaItem } from '@/lib/api-loja'

const PAGE_SIZE = 15

interface Props {
  lojas: CapacidadeLojaItem[]
}

export function CapacidadeMonitorList({ lojas }: Props) {
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(lojas.length / PAGE_SIZE)
  const slice      = lojas.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const maxLeads   = slice[0]?.active_leads ?? 1

  return (
    <div className="p-5 space-y-2">
      {slice.map((l, i) => {
        const rank       = page * PAGE_SIZE + i + 1
        const isOverload = l.status === 'overload'
        const isWarning  = l.status === 'warning'
        const barPct     = Math.min(100, Math.round(l.active_leads / maxLeads * 100))
        const barColor   = isOverload ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-blue-400'
        const textColor  = isOverload ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-blue-600'

        return (
          <Link
            key={l.loja_id}
            href={`/admin/lojas/${l.loja_id}`}
            className="flex items-center gap-3 rounded-lg hover:bg-white/60 transition-colors px-2 py-1.5 -mx-2 group"
          >
            <span className="text-xs text-slate-500 w-5 shrink-0 font-medium tabular-nums">{rank}.</span>
            <span className="text-sm font-medium text-slate-700 w-36 shrink-0 truncate group-hover:text-[#16255c]">
              {l.loja_nome}
            </span>
            <div className="flex-1 h-3 bg-slate-200/60 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${barPct}%` }} />
            </div>
            <span className={`text-sm font-bold tabular-nums w-8 text-right shrink-0 ${textColor}`}>
              {l.active_leads}
            </span>
            {(isOverload || isWarning) && (
              <span className={`text-xs font-medium shrink-0 ${textColor}`}>{l.ratio.toFixed(1)}×</span>
            )}
          </Link>
        )
      })}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-200/60">
          <button
            onClick={() => setPage(p => p - 1)}
            disabled={page === 0}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Anterior
          </button>

          <span className="text-xs text-slate-400 tabular-nums">
            {page + 1} / {totalPages}
            <span className="ml-1.5 text-slate-300">·</span>
            <span className="ml-1.5">{lojas.length} franqueados</span>
          </span>

          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page === totalPages - 1}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Próximo
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
