"use client"

import { useState } from "react"
import { Layers, Radio } from "lucide-react"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import type { UtmContentItem, UtmMediumItem } from "@/lib/leads-service"

interface ChartUtmContentMediumProps {
  contentData: UtmContentItem[]
  mediumData: UtmMediumItem[]
}

const MEDIUM_LABELS: Record<string, string> = {
  social:    "Social",
  cpc:       "CPC / Pago",
  organic:   "Orgânico",
  email:     "E-mail",
  referral:  "Referral",
  "(direto)": "Direto",
}

function RankedList({ items, keyField, pctField }: {
  items: any[]
  keyField: string
  pctField?: string
}) {
  const max = items[0]?.total ?? 1

  if (!items.length) {
    return <p className="text-slate-400 text-sm text-center py-8">Sem dados disponíveis</p>
  }

  return (
    <div className="space-y-2.5">
      {items.map((item, i) => {
        const label = MEDIUM_LABELS[item[keyField]] ?? item[keyField]
        const pct   = item[pctField ?? 'pct'] as number
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#16255c]/40 w-4 text-right flex-shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs text-slate-700 font-semibold truncate">{label}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs font-bold text-[#16255c]">{item.total}</span>
                  <span className="text-xs text-slate-400">({pct}%)</span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2563eb] rounded-full"
                  style={{ width: `${(item.total / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ChartUtmContentMedium({ contentData, mediumData }: ChartUtmContentMediumProps) {
  const [tab, setTab] = useState<"content" | "medium">("medium")

  const hasContent = contentData.some(d => d.total > 0)
  const hasMedium  = mediumData.some(d => d.total > 0)
  const hasAny     = hasContent || hasMedium

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold text-[#16255c]">
          Canais e Conteúdos
        </CardTitle>
        <CardDescription className="text-slate-500">
          Desempenho por canal de marketing (utm_medium) e variante de conteúdo (utm_content)
        </CardDescription>

        <div className="flex gap-1 bg-slate-200/60 rounded-lg p-1 w-fit">
          <button
            onClick={() => setTab("medium")}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${
              tab === "medium" ? "bg-white text-[#16255c] shadow-sm" : "text-slate-500 hover:text-[#16255c]"
            }`}
          >
            <Radio className="h-3 w-3" />
            Canal (Medium)
          </button>
          <button
            onClick={() => setTab("content")}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${
              tab === "content" ? "bg-white text-[#16255c] shadow-sm" : "text-slate-500 hover:text-[#16255c]"
            }`}
          >
            <Layers className="h-3 w-3" />
            Conteúdo
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {!hasAny ? (
          <div className="h-48 flex items-center justify-center">
            <p className="text-slate-400 text-sm">Sem dados de tracking disponíveis</p>
          </div>
        ) : (
          <div className="bg-white/50 rounded-xl p-4 shadow-inner min-h-[200px]">
            {tab === "medium" ? (
              <RankedList items={mediumData} keyField="utm_medium" />
            ) : (
              <RankedList items={contentData} keyField="utm_content" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
