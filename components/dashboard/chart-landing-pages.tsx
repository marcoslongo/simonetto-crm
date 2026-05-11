"use client"

import { useState } from "react"
import { Globe, ArrowUpRight } from "lucide-react"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import type { LandingPageItem } from "@/lib/leads-service"

interface ChartLandingPagesProps {
  landingPages: LandingPageItem[]
  referrers: LandingPageItem[]
}

function shortenUrl(url: string, maxLen = 45): string {
  if (url === "(direto)") return "(direto)"
  try {
    const u = new URL(url)
    const path = u.hostname + u.pathname
    return path.length > maxLen ? path.slice(0, maxLen - 1) + "…" : path
  } catch {
    return url.length > maxLen ? url.slice(0, maxLen - 1) + "…" : url
  }
}

function PageList({ items }: { items: LandingPageItem[] }) {
  const max = items[0]?.total ?? 1

  if (!items.length) {
    return <p className="text-slate-400 text-sm text-center py-6">Sem dados disponíveis</p>
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="group flex items-center gap-3">
          <span className="text-xs font-bold text-[#16255c]/40 w-4 text-right flex-shrink-0">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-xs text-slate-700 font-medium truncate">
                {shortenUrl(item.pagina)}
              </span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-xs font-bold text-[#16255c]">{item.total}</span>
                <span className="text-xs text-slate-400">({item.pct}%)</span>
              </div>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#16255c] rounded-full transition-all"
                style={{ width: `${(item.total / max) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ChartLandingPages({ landingPages, referrers }: ChartLandingPagesProps) {
  const [tab, setTab] = useState<"landing" | "referrer">("landing")

  const hasLanding  = landingPages.some((d) => d.total > 0)
  const hasReferrer = referrers.some((d) => d.total > 0)
  const hasAny      = hasLanding || hasReferrer

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold text-[#16255c]">
          Origem das Páginas
        </CardTitle>
        <CardDescription className="flex items-center gap-2 text-slate-500">
          <Globe className="h-4 w-4" />
          Top landing pages e referrers dos leads
        </CardDescription>

        <div className="flex gap-1 bg-slate-200/60 rounded-lg p-1 w-fit">
          {(["landing", "referrer"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`
                text-xs font-semibold px-3 py-1.5 rounded-md transition-all
                ${tab === t
                  ? "bg-white text-[#16255c] shadow-sm"
                  : "text-slate-500 hover:text-[#16255c]"
                }
              `}
            >
              {t === "landing" ? "Landing Pages" : "Referrers"}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {!hasAny ? (
          <div className="h-48 flex items-center justify-center">
            <p className="text-slate-400 text-sm">Sem dados de rastreamento disponíveis</p>
          </div>
        ) : (
          <div className="bg-white/50 rounded-xl p-4 shadow-inner min-h-[220px]">
            <PageList items={tab === "landing" ? landingPages : referrers} />
          </div>
        )}

        <p className="mt-3 text-xs text-slate-400 flex items-center gap-1">
          <ArrowUpRight className="h-3 w-3" />
          Baseado nos dados de tracking registrados no momento do cadastro
        </p>
      </CardContent>
    </Card>
  )
}
