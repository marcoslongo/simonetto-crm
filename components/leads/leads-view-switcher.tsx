"use client";

import { useState } from "react";
import { LayoutGrid, Table2, Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";


import { Lead } from "@/lib/types";
import { LeadsCardGrid, LeadsCompactList, LeadsTable } from "./leads-table";

interface Props {
  leads: Lead[];
  showLoja?: boolean;
}

export function LeadsViewSwitcher({ leads, showLoja }: Props) {
  const [view, setView] = useState<"table" | "card" | "compact">("table");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={view === "table" ? "default" : "outline"}
          onClick={() => setView("table")}
          className="gap-2"
        >
          <Table2 className="h-4 w-4" />
          Tabela
        </Button>

        <Button
          size="sm"
          variant={view === "card" ? "default" : "outline"}
          onClick={() => setView("card")}
          className="gap-2"
        >
          <LayoutGrid className="h-4 w-4" />
          Cards
        </Button>

        <Button
          size="sm"
          variant={view === "compact" ? "default" : "outline"}
          onClick={() => setView("compact")}
          className="gap-2"
        >
          <Rows3 className="h-4 w-4" />
          Lista
        </Button>
      </div>

      {view === "table" && (
        <LeadsTable leads={leads} showLoja={showLoja} />
      )}

      {view === "card" && (
        <LeadsCardGrid leads={leads} showLoja={showLoja} />
      )}

      {view === "compact" && (
        <LeadsCompactList leads={leads} showLoja={showLoja} />
      )}
    </div>
  );
}
