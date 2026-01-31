import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatLastCapture(date?: string | null) {
  if (!date) return "—";

  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", {
    locale: ptBR,
  });
}
