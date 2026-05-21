import { Building2, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getLeadOrigem } from "@/lib/utils";
import type { Lead } from "@/lib/types";

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
