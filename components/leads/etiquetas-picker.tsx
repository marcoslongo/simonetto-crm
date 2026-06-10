"use client";

import { useState, useEffect } from "react";
import { Tag, Plus, X, Check, Loader2, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Etiqueta } from "@/lib/types";
import { cn } from "@/lib/utils";

const COR_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  purple:  { bg: "bg-purple-100",  text: "text-purple-700",  dot: "bg-purple-500"  },
  indigo:  { bg: "bg-indigo-100",  text: "text-indigo-700",  dot: "bg-indigo-500"  },
  teal:    { bg: "bg-teal-100",    text: "text-teal-700",    dot: "bg-teal-500"    },
  orange:  { bg: "bg-orange-100",  text: "text-orange-700",  dot: "bg-orange-500"  },
  pink:    { bg: "bg-pink-100",    text: "text-pink-700",    dot: "bg-pink-500"    },
  gray:    { bg: "bg-gray-100",    text: "text-gray-700",    dot: "bg-gray-500"    },
  violet:  { bg: "bg-violet-100",  text: "text-violet-700",  dot: "bg-violet-500"  },
  cyan:    { bg: "bg-cyan-100",    text: "text-cyan-700",    dot: "bg-cyan-500"    },
  lime:    { bg: "bg-lime-100",    text: "text-lime-700",    dot: "bg-lime-500"    },
  yellow:  { bg: "bg-yellow-100",  text: "text-yellow-700",  dot: "bg-yellow-500"  },
  red:     { bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500"     },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  blue:    { bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500"    },
  amber:   { bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500"   },
};

const CORES_DISPONIVEIS = Object.keys(COR_MAP);

const LABELS_COR: Record<string, string> = {
  purple: "Roxo", indigo: "Índigo", teal: "Verde-água", orange: "Laranja",
  pink: "Rosa", gray: "Cinza", violet: "Violeta", cyan: "Ciano",
  lime: "Lima", yellow: "Amarelo", red: "Vermelho", emerald: "Esmeralda",
  blue: "Azul", amber: "Âmbar",
};

export function EtiquetaBadge({ etiqueta, onRemove, size = "sm" }: {
  etiqueta: Etiqueta;
  onRemove?: () => void;
  size?: "xs" | "sm";
}) {
  const colors = COR_MAP[etiqueta.cor] ?? COR_MAP.gray;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5",
        colors.bg,
        colors.text
      )}
    >
      {etiqueta.nome}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="hover:opacity-70 transition-opacity"
          aria-label={`Remover etiqueta ${etiqueta.nome}`}
        >
          <X className={size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3"} />
        </button>
      )}
    </span>
  );
}

interface EtiquetasPickerProps {
  leadId: string;
  lojaId: string | null;
  etiquetas: Etiqueta[];
  isGerente?: boolean;
  onUpdate: (etiquetas: Etiqueta[]) => void;
}

export function EtiquetasPicker({ leadId, lojaId, etiquetas, isGerente, onUpdate }: EtiquetasPickerProps) {
  const [open, setOpen] = useState(false);
  const [disponiveis, setDisponiveis] = useState<Etiqueta[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);

  const [criando, setCriando] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novaCor, setNovaCor] = useState("gray");
  const [salvandoNova, setSalvandoNova] = useState(false);

  useEffect(() => {
    if (open && lojaId) {
      setLoading(true);
      fetch(`/api/etiquetas?loja_id=${lojaId}`)
        .then(r => r.json())
        .then(d => { if (d.success) setDisponiveis(d.data ?? []) })
        .catch(() => toast.error("Erro ao carregar etiquetas"))
        .finally(() => setLoading(false));
    }
  }, [open, lojaId]);

  const assigned = new Set(etiquetas.map(e => e.id));

  const handleToggle = async (etiqueta: Etiqueta) => {
    setSaving(etiqueta.id);
    try {
      if (assigned.has(etiqueta.id)) {
        const res = await fetch(`/api/leads/${leadId}/etiquetas/${etiqueta.id}`, { method: "DELETE" });
        if (!res.ok) { toast.error("Erro ao remover etiqueta"); return; }
        onUpdate(etiquetas.filter(e => e.id !== etiqueta.id));
      } else {
        const res = await fetch(`/api/leads/${leadId}/etiquetas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ etiqueta_id: etiqueta.id }),
        });
        if (!res.ok) { toast.error("Erro ao adicionar etiqueta"); return; }
        onUpdate([...etiquetas, etiqueta]);
      }
    } catch {
      toast.error("Erro ao atualizar etiqueta");
    } finally {
      setSaving(null);
    }
  };

  const handleCriarEtiqueta = async () => {
    if (!novoNome.trim() || !lojaId) return;
    setSalvandoNova(true);
    try {
      const res = await fetch("/api/etiquetas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loja_id: Number(lojaId), nome: novoNome.trim(), cor: novaCor }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.mensagem || "Erro ao criar etiqueta"); return; }
      const nova: Etiqueta = data.data;
      setDisponiveis(prev => [...prev, nova]);
      setNovoNome("");
      setNovaCor("gray");
      setCriando(false);
      toast.success("Etiqueta criada");
    } catch {
      toast.error("Erro ao criar etiqueta");
    } finally {
      setSalvandoNova(false);
    }
  };

  const handleDeletarEtiqueta = async (etiqueta: Etiqueta) => {
    if (!lojaId) return;
    try {
      const res = await fetch(`/api/etiquetas/${etiqueta.id}?loja_id=${lojaId}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Erro ao excluir etiqueta"); return; }
      setDisponiveis(prev => prev.filter(e => e.id !== etiqueta.id));
      onUpdate(etiquetas.filter(e => e.id !== etiqueta.id));
      toast.success("Etiqueta excluída");
    } catch {
      toast.error("Erro ao excluir etiqueta");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-muted-foreground/30 px-2.5 py-1 text-[11px] text-muted-foreground/60 hover:border-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-pointer">
          <Tag className="h-3 w-3 shrink-0" />
          Etiquetas
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" side="bottom" align="start">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-1 py-1 mb-1">
          Etiquetas
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {disponiveis.length === 0 && !criando && (
              <p className="text-xs text-muted-foreground px-1 py-2 text-center">
                Nenhuma etiqueta criada.
              </p>
            )}
            {disponiveis.map(etiqueta => {
              const colors  = COR_MAP[etiqueta.cor] ?? COR_MAP.gray;
              const checked  = assigned.has(etiqueta.id);
              const isSaving = saving === etiqueta.id;
              return (
                <div key={etiqueta.id} className="flex items-center gap-1 group/item">
                  <button
                    disabled={isSaving}
                    onClick={() => handleToggle(etiqueta)}
                    className={cn(
                      "flex-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-left transition-colors hover:bg-muted",
                      checked && "font-medium"
                    )}
                  >
                    {isSaving
                      ? <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                      : checked
                        ? <Check className="h-3 w-3 shrink-0 text-primary" />
                        : <span className="w-3 shrink-0" />
                    }
                    <span className={cn("inline-block h-2 w-2 rounded-full shrink-0", colors.dot)} />
                    <span className="truncate">{etiqueta.nome}</span>
                  </button>
                  {isGerente && (
                    <button
                      onClick={() => handleDeletarEtiqueta(etiqueta)}
                      className="opacity-0 group-hover/item:opacity-100 p-1 rounded text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all"
                      aria-label="Excluir etiqueta"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-2 border-t border-border pt-2">
          {criando ? (
            <div className="space-y-2">
              <Input
                placeholder="Nome da etiqueta"
                value={novoNome}
                onChange={e => setNovoNome(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCriarEtiqueta()}
                className="h-7 text-xs"
                autoFocus
              />
              <div className="flex flex-wrap gap-1">
                {CORES_DISPONIVEIS.map(cor => {
                  const c = COR_MAP[cor];
                  return (
                    <button
                      key={cor}
                      title={LABELS_COR[cor]}
                      onClick={() => setNovaCor(cor)}
                      className={cn(
                        "h-5 w-5 rounded-full transition-transform hover:scale-110",
                        c.dot,
                        novaCor === cor && "ring-2 ring-offset-1 ring-foreground/30 scale-110"
                      )}
                    />
                  );
                })}
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  className="h-7 flex-1 text-xs"
                  onClick={handleCriarEtiqueta}
                  disabled={salvandoNova || !novoNome.trim()}
                >
                  {salvandoNova ? <Loader2 className="h-3 w-3 animate-spin" /> : "Criar"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => { setCriando(false); setNovoNome(""); setNovaCor("gray"); }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCriando(true)}
              className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Nova etiqueta
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
