"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Building2, Store, LayoutList } from "lucide-react";

const ALL_TABS = [
  { value: "", label: "Todos", Icon: LayoutList },
  { value: "industria", label: "Indústria", Icon: Building2 },
  { value: "proprio", label: "Próprio", Icon: Store },
] as const;

interface OrigemFilterProps {
  showProprio?: boolean
}

export function OrigemFilter({ showProprio = false }: OrigemFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("origem") ?? "";

  const tabs = showProprio ? ALL_TABS : ALL_TABS.filter(t => t.value !== "proprio");

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("origem", value);
    } else {
      params.delete("origem");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
      {tabs.map(({ value, label, Icon }) => {
        const isActive = current === value;
        return (
          <button
            key={value || "todos"}
            onClick={() => handleChange(value)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all cursor-pointer ${
              isActive
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
