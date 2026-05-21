import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Lead } from './types';

export type { LeadOrigem } from './types';

export function getLeadOrigem(lead: Lead): 'industria' | 'proprio' {
  // Usa o campo nativo da API quando disponível, caso contrário deriva do loja_id
  if (lead.origem === 'industria' || lead.origem === 'proprio') {
    return lead.origem;
  }
  return lead.loja_id === null || lead.loja_id === undefined ? 'industria' : 'proprio';
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatLastCapture(date?: string | null) {
  if (!date) return "—";

  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", {
    locale: ptBR,
  });
}
