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