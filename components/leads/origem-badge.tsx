import { Building2, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getLeadOrigem } from "@/lib/utils";
import type { Lead } from "@/lib/types";

const UTM_SOURCE_CONFIG: Record<string, { label: string; className: string }> = {
  google:    { label: 'Google',    className: 'border-blue-400/40 bg-blue-50 text-blue-700' },
  facebook:  { label: 'Facebook',  className: 'border-indigo-400/40 bg-indigo-50 text-indigo-700' },
  instagram: { label: 'Instagram', className: 'border-pink-400/40 bg-pink-50 text-pink-700' },
  tiktok:    { label: 'TikTok',   className: 'border-slate-400/40 bg-slate-100 text-slate-700' },
  youtube:   { label: 'YouTube',   className: 'border-red-400/40 bg-red-50 text-red-700' },
  whatsapp:  { label: 'WhatsApp', className: 'border-emerald-400/40 bg-emerald-50 text-emerald-700' },
  email:     { label: 'E-mail',   className: 'border-amber-400/40 bg-amber-50 text-amber-700' },
}

function resolveUtmSource(raw: string): { label: string; className: string } {
  const lower = raw.toLowerCase()
  for (const [key, cfg] of Object.entries(UTM_SOURCE_CONFIG)) {
    if (lower.includes(key)) return cfg
  }
  return { label: raw, className: 'border-slate-300/50 bg-slate-50 text-slate-600' }
}

export function UtmSourceBadge({ utm_source, size = 'xs' }: { utm_source?: string | null; size?: 'xs' | 'sm' }) {
  if (!utm_source) return null
  const { label, className } = resolveUtmSource(utm_source)
  return (
    <Badge
      variant="outline"
      className={`flex w-fit items-center font-medium ${className} ${
        size === 'xs' ? 'text-[10px] px-1.5 py-0' : 'text-[11px] px-2.5 py-0.5'
      }`}
    >
      {label}
    </Badge>
  )
}

interface OrigemBadgeProps {
  lead: Lead;
  size?: "sm" | "xs";
}

export function OrigemBadge({ lead, size = "sm" }: OrigemBadgeProps) {
  const origem = getLeadOrigem(lead);

  if (origem === "industria") {
    return (
      <Badge
        variant="outline"
        className={`flex w-fit items-center gap-1 font-medium border-violet-500/30 bg-violet-500/10 text-violet-700 ${
          size === "xs" ? "text-[10px] px-1.5 py-0" : "text-[11px] px-2.5 py-0.5"
        }`}
      >
        <Building2 className={size === "xs" ? "h-2.5 w-2.5" : "h-3.5 w-3.5"} />
        Indústria
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={`flex w-fit items-center gap-1 font-medium border-emerald-500/30 bg-emerald-500/10 text-emerald-700 ${
        size === "xs" ? "text-[10px] px-1.5 py-0" : "text-[11px] px-2.5 py-0.5"
      }`}
    >
      <Store className={size === "xs" ? "h-2.5 w-2.5" : "h-3.5 w-3.5"} />
      Próprio
    </Badge>
  );
}
