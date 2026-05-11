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

export async function getLeadsStatsGeral(token?: string) {
  const json = await fetchAPI('leads-stats-geral', 'Erro ao buscar stats gerais', token);
  
  return json.data || {
    total: 0,
    today: 0,
    ultimaCaptura: null,
  };
}

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

export async function getLeadsClassificacao(
  from?: string,
  to?: string,
  token?: string
): Promise<{ frio: number; morno: number; quente: number; total: number }> {
  const params = new URLSearchParams()

  if (from) params.append('from', from)
  if (to) params.append('to', to)

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/leads-classificacao?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    }
  )

  const json = await res.json()

  return {
    ...json.data,
    total: json.total,
  }
}

export async function getLeadsByDate(lojaId: string | null | undefined, date: string, token?: string) {
  const lojaIdNum = lojaId ? parseInt(lojaId) : undefined;
  const data = await getLeads(1, 100, lojaIdNum, undefined, date, date, token);

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
  const res = await fetch(`${process.env.NEXT_PUBLIC_WP_URL}/wp-json/api/v1/leads-30dias?from=${from}&to=${to}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Erro ao buscar leads");
  }

  return res.json();
}


export async function getLeadsStatsFilterDateStats(
  from: string,
  to: string,
  lojaId?: string | number
) {
  const params = new URLSearchParams({ from, to });
  if (lojaId) params.set("loja_id", String(lojaId));

  const url = `${process.env.NEXT_PUBLIC_WP_URL}/wp-json/api/v1/leads/stats?${params.toString()}`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Erro ao buscar estatísticas — status ${res.status}`);
  }

  return res.json();
}


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

const IBGE_TO_UF: Record<string, string> = {
  '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA',
  '16': 'AP', '17': 'TO', '21': 'MA', '22': 'PI', '23': 'CE',
  '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE',
  '29': 'BA', '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
  '41': 'PR', '42': 'SC', '43': 'RS', '50': 'MS', '51': 'MT',
  '52': 'GO', '53': 'DF',
}

const NOME_TO_UF: Record<string, string> = {
  'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM',
  'Bahia': 'BA', 'Ceará': 'CE', 'Distrito Federal': 'DF',
  'Espírito Santo': 'ES', 'Goiás': 'GO', 'Maranhão': 'MA',
  'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS', 'Minas Gerais': 'MG',
  'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR', 'Pernambuco': 'PE',
  'Piauí': 'PI', 'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN',
  'Rio Grande do Sul': 'RS', 'Rondônia': 'RO', 'Roraima': 'RR',
  'Santa Catarina': 'SC', 'São Paulo': 'SP', 'Sergipe': 'SE', 'Tocantins': 'TO',
}

const VALID_UFS = new Set([
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
])

function normalizeEstado(raw: string): string | null {
  const s = raw.trim()
  if (IBGE_TO_UF[s])         return IBGE_TO_UF[s]
  if (NOME_TO_UF[s])         return NOME_TO_UF[s]
  const upper = s.toUpperCase()
  if (VALID_UFS.has(upper))  return upper
  return null
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
    const uf = normalizeEstado(item.estado)
    if (!uf) return

    if (!grouped[uf]) {
      grouped[uf] = { total: 0, lojas: [] }
    }

    grouped[uf].total += item.total

    for (const loja of item.lojas ?? []) {
      const existing = grouped[uf].lojas.find(l => l.id === loja.id)
      if (existing) {
        existing.leads += loja.leads
      } else {
        grouped[uf].lojas.push({ ...loja })
      }
    }
  })

  for (const uf in grouped) {
    grouped[uf].lojas.sort((a, b) => b.leads - a.leads)
  }

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

export async function getTempoMedioPorLoja(token?: string): Promise<TimeStoreResponse> {
  const json = await fetchAPI('leads-tempo-por-loja', 'Erro ao buscar tempo por loja', token);

  return {
    success: json.success || true,
    total_lojas: json.total_lojas || 0,
    data: Array.isArray(json.data) ? json.data : [],
  };
}

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

export interface OrigemItem {
  utm_source: string
  utm_medium: string
  total: number
  pct: number
}

export async function getLeadsPorOrigem(from?: string, to?: string, token?: string): Promise<OrigemItem[]> {
  let endpoint = 'leads-por-origem';
  const params: string[] = [];

  if (from) params.push(`from=${encodeURIComponent(from)}`);
  if (to)   params.push(`to=${encodeURIComponent(to)}`);

  if (params.length) endpoint += `?${params.join('&')}`;

  const json = await fetchAPI(endpoint, 'Erro ao buscar origens de leads', token);

  if (!json.data || !Array.isArray(json.data)) return [];

  return json.data as OrigemItem[];
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

export async function getLeadsStatusTotal(
  from?: string, 
  to?: string, 
  lojaId?: number, 
  token?: string
): Promise<{ nao_atendido: number; em_negociacao: number; venda_realizada: number; venda_nao_realizada: number }> {
  let endpoint = 'leads-status-total';
  const params: string[] = [];

  if (from) params.push(`from=${encodeURIComponent(from)}`);
  if (to)   params.push(`to=${encodeURIComponent(to)}`);
  if (lojaId) params.push(`loja_id=${lojaId}`);

  if (params.length) endpoint += `?${params.join('&')}`;

  const json = await fetchAPI(endpoint, 'Erro ao buscar totais por status', token);

  return json.data || {
    nao_atendido: 0,
    em_negociacao: 0,
    venda_realizada: 0,
    venda_nao_realizada: 0,
  };
}

export interface ScoreDistribuicaoItem {
  faixa: string
  total: number
  classificacao: 'frio' | 'morno' | 'quente'
}

export async function getLeadsScoreDistribuicao(from?: string, to?: string, token?: string): Promise<ScoreDistribuicaoItem[]> {
  let endpoint = 'leads-score-distribuicao'
  const params: string[] = []
  if (from) params.push(`from=${encodeURIComponent(from)}`)
  if (to)   params.push(`to=${encodeURIComponent(to)}`)
  if (params.length) endpoint += `?${params.join('&')}`

  const json = await fetchAPI(endpoint, 'Erro ao buscar distribuição de scores', token)
  return json.data || []
}


export interface InvestimentoClassificacaoItem {
  faixa: string
  frio: number
  morno: number
  quente: number
}

export async function getLeadsInvestimentoClassificacao(from?: string, to?: string, token?: string): Promise<InvestimentoClassificacaoItem[]> {
  let endpoint = 'leads-investimento-classificacao'
  const params: string[] = []
  if (from) params.push(`from=${encodeURIComponent(from)}`)
  if (to)   params.push(`to=${encodeURIComponent(to)}`)
  if (params.length) endpoint += `?${params.join('&')}`

  const json = await fetchAPI(endpoint, 'Erro ao buscar investimento por classificação', token)
  return json.data || []
}

export interface CampanhaUTMItem {
  utm_campaign: string
  total: number
  pct: number
}

export async function getLeadsCampanhasUTM(from?: string, to?: string, limit = 10, token?: string): Promise<CampanhaUTMItem[]> {
  let endpoint = `leads-campanhas-utm?limit=${limit}`
  if (from) endpoint += `&from=${encodeURIComponent(from)}`
  if (to)   endpoint += `&to=${encodeURIComponent(to)}`

  const json = await fetchAPI(endpoint, 'Erro ao buscar campanhas UTM', token)
  return json.data || []
}


export interface LandingPageItem {
  pagina: string
  total: number
  pct: number
}

export async function getLeadsLandingPages(
  from?: string,
  to?: string,
  tipo: 'landing_page' | 'referrer' = 'landing_page',
  limit = 10,
  token?: string
): Promise<LandingPageItem[]> {
  let endpoint = `leads-landing-pages?limit=${limit}&tipo=${tipo}`
  if (from) endpoint += `&from=${encodeURIComponent(from)}`
  if (to)   endpoint += `&to=${encodeURIComponent(to)}`

  const json = await fetchAPI(endpoint, 'Erro ao buscar landing pages', token)
  return json.data || []
}

export const getFaturamentoStats = getLeadsPorInvestimento;
export const getInteresseStats = getLeadsPorInteresse;
export const getLojaStats = getLeadsPorLoja;
export const getEstadoStats = getLeadsGeoStats;
export const gettimeStoreAtend = getTempoMedioPorLoja;
export const getLeadsStats = getLeadsStatsGeral;