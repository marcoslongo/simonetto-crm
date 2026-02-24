import { Lead, LeadsResponse, TimeStoreResponse } from "./types";

const WP_API_BASE = process.env.NEXT_PUBLIC_WP_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/wp-json/api/v1', '');

async function fetchAPI(endpoint: string, errorMessage: string, token?: string) {
  const url = `${WP_API_BASE}/wp-json/api/v1/${endpoint}`;

  const res = await fetch(url, { 
    cache: "no-store",
    headers: {
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    }
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ ${errorMessage}:`, text.substring(0, 200));
    throw new Error(`${errorMessage}: ${res.status}`);
  }

  const text = await res.text();
  
  const cleanText = text.trim();
  
  if (!cleanText.startsWith('{') && !cleanText.startsWith('[')) {
    console.error('❌ Resposta inválida:', cleanText.substring(0, 500));
    throw new Error(`API retornou conteúdo inválido. Endpoint: ${endpoint}`);
  }

  try {
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('❌ Erro ao fazer parse do JSON:', cleanText.substring(0, 500));
    throw new Error(`Erro ao processar resposta JSON. Endpoint: ${endpoint}`);
  }
}

/* ============================
   LEADS BASE
============================ */

export async function getLeads(
  page = 1,
  perPage = 10,
  lojaId?: number,
  search?: string,
  from?: string,
  to?: string,
  token?: string
): Promise<LeadsResponse> {
  let endpoint = `leads?page=${page}&per_page=${perPage}`;

  if (lojaId) endpoint += `&loja_id=${lojaId}`;
  if (search) endpoint += `&search=${encodeURIComponent(search)}`;
  if (from)   endpoint += `&from=${encodeURIComponent(from)}`;
  if (to)     endpoint += `&to=${encodeURIComponent(to)}`;

  const data = await fetchAPI(endpoint, 'Erro ao buscar leads', token);

  if (!data.success) {
    throw new Error("Resposta da API indica falha");
  }

  return data;
}

export async function getAllLeads(lojaId?: number, token?: string): Promise<Lead[]> {
  let endpoint = `leads?page=1&per_page=10000`;

  if (lojaId) endpoint += `&loja_id=${lojaId}`;

  const data = await fetchAPI(endpoint, 'Erro ao buscar todos os leads', token);

  return data.leads || [];
}

export async function getLeadById(id: number, token?: string): Promise<Lead | null> {
  try {
    const data = await fetchAPI(`leads/${id}`, `Erro ao buscar lead ${id}`, token);
    return data.success ? data.lead : null;
  } catch (error) {
    console.error('Erro ao buscar lead:', error);
    return null;
  }
}

export async function getLojas(token?: string) {
  const data = await fetchAPI('lojas', 'Erro ao buscar lojas', token);
  return data;
}

export async function getLojasWithStats(token?: string) {
  const data = await fetchAPI('lojas-with-stats', 'Erro ao buscar lojas com stats', token);
  return data;
}

/* ============================
   STATS GERAIS
============================ */

export async function getLeadsStatsGeral(token?: string) {
  const json = await fetchAPI('leads-stats-geral', 'Erro ao buscar stats gerais', token);
  
  return json.data || {
    total: 0,
    today: 0,
    ultimaCaptura: null,
  };
}

/* ============================
   AGRUPAMENTOS
============================ */

export async function getLeadsPorInvestimento(token?: string) {
  const json = await fetchAPI('leads-por-investimento', 'Erro ao buscar leads por investimento', token);
  
  const grouped: Record<string, number> = {};
  
  if (json.data && Array.isArray(json.data)) {
    json.data.forEach((item: any) => {
      const faixa = item.expectativa_investimento?.trim() || "Não informado";
      grouped[faixa] = parseInt(item.total) || 0;
    });
  }

  return grouped;
}

export async function getLeadsByDate(date: string, token?: string) {
  const data = await getLeads(1, 100, undefined, undefined, date, date, token);

  return {
    success: true,
    data: data.leads || [],
  };
}

export async function getLeadsPorInteresse(token?: string) {
  const json = await fetchAPI('leads-por-interesse', 'Erro ao buscar leads por interesse', token);
  
  const grouped: Record<string, number> = {};
  
  if (json.data && Array.isArray(json.data)) {
    json.data.forEach((item: any) => {
      const interesse = item.interesse?.trim() || "Não informado";
      grouped[interesse] = parseInt(item.total) || 0;
    });
  }

  return grouped;
}

export async function getLeadsPorLoja(token?: string) {
  const json = await fetchAPI('leads-por-loja', 'Erro ao buscar leads por loja', token);
  
  const grouped: Record<string, number> = {};
  
  if (json.data && Array.isArray(json.data)) {
    json.data.forEach((item: any) => {
      const loja = item.loja_regiao?.trim() || "Não informado";
      grouped[loja] = parseInt(item.total) || 0;
    });
  }

  return grouped;
}

/* ============================
   LEADS ÚLTIMOS 30 DIAS
============================ */

export async function getLeadsLast30Days(from?: string, to?: string, token?: string) {
  let endpoint = `leads-30dias`;

  if (from) endpoint += `?from=${from}`;
  if (to)   endpoint += `${from ? "&" : "?"}to=${to}`;

  const json = await fetchAPI(endpoint, 'Erro ao buscar leads período', token);

  if (!json.data || !Array.isArray(json.data)) {
    return [];
  }

  return json.data.map((item: any) => ({
    date: item.data,
    total: parseInt(item.total) || 0,
  }));
}

export async function getLeadsStatsFilterDate(from: string, to: string) {
  const res = await fetch(`/api/leads/leads-stats?from=${from}&to=${to}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Erro ao buscar leads");
  }

  return res.json();
}

/* ============================
   STATS POR ESTADO
============================ */

export interface LojaGeo {
  id: number
  nome: string
  leads: number
}

export interface EstadoGeoStat {
  estado: string
  total: number
  lojas: LojaGeo[]
}

export async function getLeadsGeoStats(
  estado?: string,
  from?: string,
  to?: string,
  token?: string
): Promise<Record<string, { total: number; lojas: LojaGeo[] }>> {
  let endpoint = 'leads-por-estado';
  const params: string[] = [];

  if (estado) params.push(`estado=${encodeURIComponent(estado.toUpperCase())}`);
  if (from)   params.push(`from=${encodeURIComponent(from)}`);
  if (to)     params.push(`to=${encodeURIComponent(to)}`);

  if (params.length) endpoint += `?${params.join('&')}`;

  const json = await fetchAPI(endpoint, 'Erro ao buscar stats geográficas', token);

  if (!json.data || !Array.isArray(json.data)) {
    return {};
  }

  const grouped: Record<string, { total: number; lojas: LojaGeo[] }> = {};

  json.data.forEach((item: EstadoGeoStat) => {
    grouped[item.estado] = {
      total: item.total,
      lojas: item.lojas ?? [],
    };
  });

  return grouped;
}

export async function getLeadsGeoStatsByEstado(
  estado: string,
  from?: string,
  to?: string,
  token?: string
): Promise<EstadoGeoStat | null> {
  const grouped = await getLeadsGeoStats(estado, from, to, token);
  const estadoData = grouped[estado.toUpperCase()];

  if (!estadoData) return null;

  return {
    estado: estado.toUpperCase(),
    ...estadoData,
  };
}

/* ============================
   STATS DE ATENDIMENTO
============================ */

export async function getLeadsStatsService(token?: string) {
  const json = await fetchAPI('leads-stats-service', 'Erro ao buscar stats de atendimento', token);

  const data = json.data || {};

  return {
    totalLeads: parseInt(data.total_leads) || 0,
    leadsContatados: parseInt(data.leads_contatados) || 0,
    leadsNaoContatados: parseInt(data.leads_nao_contatados) || 0,
    percContatados: parseFloat(data.perc_contatados) || 0,
    percNaoContatados: parseFloat(data.perc_nao_contatados) || 0,
    tempoMedioMinutos: parseFloat(data.tempo_medio_minutos) || 0,
    tempoMedioHoras: parseFloat(data.tempo_medio_horas) || 0,
  };
}

/* ============================
   TEMPO MÉDIO POR LOJA
============================ */

export async function getTempoMedioPorLoja(token?: string): Promise<TimeStoreResponse> {
  const json = await fetchAPI('leads-tempo-por-loja', 'Erro ao buscar tempo por loja', token);

  return {
    success: json.success || true,
    total_lojas: json.total_lojas || 0,
    data: Array.isArray(json.data) ? json.data : [],
  };
}

/* ============================
   REGISTRAR CONTATO COM LEAD
============================ */

export async function registrarContatoLead(params: {
  lead_id: number;
  tipo_contato: string;
  usuario_id?: number;
  observacao?: string;
}, token?: string) {
  const url = `${WP_API_BASE}/wp-json/api/v1/lead-contato`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('❌ Erro ao registrar contato:', text);
    throw new Error(`Erro ao registrar contato: ${res.status}`);
  }

  const text = await res.text();
  const cleanText = text.trim();
  
  try {
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('❌ Erro ao fazer parse do JSON:', cleanText);
    throw new Error('Erro ao processar resposta');
  }
}

/* ============================
   CRIAR NOVO LEAD
============================ */

export async function createLead(leadData: {
  nome: string;
  email: string;
  telefone: string;
  cidade?: string;
  estado?: string;
  interesse?: string;
  expectativa_investimento?: string;
  loja_regiao?: string;
  mensagem?: string;
  loja_id?: number;
  pipefy_card_id?: string;
}, token?: string) {
  const url = `${WP_API_BASE}/wp-json/api/v1/leads`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(leadData),
  });

  if (!res.ok) {
    const text = await res.text();
    const cleanText = text.trim();
    
    try {
      const error = JSON.parse(cleanText);
      throw new Error(error.mensagem || `Erro ao criar lead: ${res.status}`);
    } catch {
      throw new Error(`Erro ao criar lead: ${res.status}`);
    }
  }

  const text = await res.text();
  const cleanText = text.trim();
  
  try {
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('❌ Erro ao fazer parse do JSON:', cleanText);
    throw new Error('Erro ao processar resposta');
  }
}

/* ============================
   ORIGEM DE LEADS (UTM)
============================ */

export interface OrigemItem {
  utm_source: string
  utm_medium: string
  total: number
  pct: number
}

export async function getLeadsPorOrigem(from?: string, to?: string): Promise<OrigemItem[]> {
  const base = process.env.NEXT_PUBLIC_SITE_URL;

  let url = `${base}/api/leads/origem`;
  if (from) url += `?from=${from}`;
  if (to)   url += `${from ? "&" : "?"}to=${to}`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) throw new Error("Erro ao buscar origens de leads");

  const json = await res.json();

  if (!json.data || !Array.isArray(json.data)) return [];

  return json.data as OrigemItem[];
}

/* ============================
   FUNÇÕES AUXILIARES
============================ */

export function getLastLeadDate(leads: Lead[]): string | null {
  if (!leads.length) return null;

  const lastLead = leads.reduce((latest, current) => {
    return new Date(current.data_criacao) > new Date(latest.data_criacao)
      ? current
      : latest;
  });

  return lastLead.data_criacao;
}

// Aliases para compatibilidade
export const getFaturamentoStats = getLeadsPorInvestimento;
export const getInteresseStats = getLeadsPorInteresse;
export const getLojaStats = getLeadsPorLoja;
export const getEstadoStats = getLeadsGeoStats;
export const gettimeStoreAtend = getTempoMedioPorLoja;
export const getLeadsStats = getLeadsStatsGeral;