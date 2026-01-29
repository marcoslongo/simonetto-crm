import { LeadsResponse } from "./types";

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