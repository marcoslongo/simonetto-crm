import { Lead, LeadsResponse } from "./types";

export async function getLeads(
  page = 1,
  perPage = 10,
  lojaId?: number
): Promise<LeadsResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  let url = `${baseUrl}/api/leads?page=${page}&per_page=${perPage}`;

  if (lojaId) {
    url += `&loja_id=${lojaId}`;
  }

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Erro ao buscar leads: ${res.status}`);
  }

  const data: LeadsResponse = await res.json();

  if (!data.success) {
    throw new Error("Resposta da API indica falha");
  }

  return data;
}

export async function getLojas() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const res = await fetch(`${baseUrl}/api/lojas`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Erro ao buscar lojas: ${res.status}`);
  }

  return res.json();
}

export async function getAllLeads(lojaId?: number): Promise<Lead[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  let url = `${baseUrl}/api/leads?page=1&per_page=10000`;
  if (lojaId) {
    url += `&loja_id=${lojaId}`;
  }

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Erro ao buscar todos os leads");

  const data = await res.json();
  return data.leads || [];
}

export async function getLeadsStats(lojaId?: number) {
  const leads = await getAllLeads(lojaId);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const leadsHoje = leads.filter(lead => {
    const d = new Date(lead.data_criacao);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === hoje.getTime();
  }).length;

  return {
    total: leads.length,
    today: leadsHoje,
    ultimaCaptura: getLastLeadDate(leads),
  };
}

export function getLastLeadDate(leads: Lead[]): string | null {
  if (!leads.length) return null;

  const lastLead = leads.reduce((latest, current) => {
    return new Date(current.data_criacao) > new Date(latest.data_criacao)
      ? current
      : latest;
  });

  return lastLead.data_criacao;
}

export function groupLeadsByFaturamento(leads: Lead[]) {
  const grupos: Record<string, number> = {};

  for (const lead of leads) {
    const faixa = lead.expectativa_investimento?.trim() || "Não informado";

    grupos[faixa] = (grupos[faixa] || 0) + 1;
  }

  return grupos;
}

export async function getFaturamentoStats(lojaId?: number) {
  const leads = await getAllLeads(lojaId);
  return groupLeadsByFaturamento(leads);
}

export function groupLeadsByInteresse(leads: Lead[]) {
  const grupos: Record<string, number> = {}

  for (const lead of leads) {
    const interesse = lead.interesse?.trim() || "Não informado"

    grupos[interesse] = (grupos[interesse] || 0) + 1
  }

  return grupos
}

export async function getInteresseStats(lojaId?: number) {
  const leads = await getAllLeads(lojaId)
  return groupLeadsByInteresse(leads)
}

export function groupLeadsByLoja(leads: Lead[]) {
  const grupos: Record<string, number> = {}

  for (const lead of leads) {
    const loja = lead.loja_regiao?.trim() || "Não informado"

    grupos[loja] = (grupos[loja] || 0) + 1
  }

  return grupos
}


export async function getLojaStats(lojaId?: number) {
  const leads = await getAllLeads(lojaId)
  return groupLeadsByLoja(leads)
}

export async function getLeadsLast30Days(lojaId?: number) {
  const leads = await getAllLeads(lojaId)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days: Record<string, number> = {}

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days[key] = 0
  }

  for (const lead of leads) {
    const d = new Date(lead.data_criacao)
    d.setHours(0, 0, 0, 0)
    const key = d.toISOString().slice(0, 10)

    if (key in days) {
      days[key]++
    }
  }

  return Object.entries(days).map(([date, total]) => ({
    date,
    total,
  }))
}

export function groupLeadsByEstado(leads: Lead[]) {
  const grupos: Record<string, number> = {}

  for (const lead of leads) {
    const estado = lead.estado?.trim().toUpperCase() || "N/I"
    grupos[estado] = (grupos[estado] || 0) + 1
  }

  return grupos
}

export async function getEstadoStats(lojaId?: number) {
  const leads = await getAllLeads(lojaId)
  return groupLeadsByEstado(leads)
}
