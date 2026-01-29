import type { Lead, Loja } from './types'

// Lojas de demonstração
export const mockLojas: Loja[] = [
  {
    id: 101,
    nome: 'Loja São Paulo - Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    localizacao: 'São Paulo/SP',
    emails: [{ email: 'saopaulo@empresa.com' }],
  },
  {
    id: 102,
    nome: 'Loja Rio - Copacabana',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    localizacao: 'Rio de Janeiro/RJ',
    emails: [{ email: 'rio@empresa.com' }],
  },
  {
    id: 103,
    nome: 'Loja Curitiba',
    cidade: 'Curitiba',
    estado: 'PR',
    localizacao: 'Curitiba/PR',
    emails: [{ email: 'curitiba@empresa.com' }],
  },
  {
    id: 104,
    nome: 'Loja Belo Horizonte',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    localizacao: 'Belo Horizonte/MG',
    emails: [{ email: 'bh@empresa.com' }],
  },
]

// Leads de demonstração
export const mockLeads: Lead[] = [
  {
    id: 1,
    nome: 'João Silva',
    email: 'joao.silva@email.com',
    telefone: '(11) 99999-1234',
    cidade: 'São Paulo',
    estado: 'SP',
    interesse: 'Franquia',
    expectativa_investimento: 'R$ 100.000 - R$ 200.000',
    loja_regiao: 'Zona Sul',
    mensagem: 'Gostaria de saber mais sobre oportunidades de franquia na região.',
    pipefy_card_id: null,
    loja_id: 101,
    loja_nome: 'Loja São Paulo - Centro',
    loja_cidade: 'São Paulo',
    loja_estado: 'SP',
    data_criacao: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hora atrás
    data_atualizacao: new Date().toISOString(),
  },
  {
    id: 2,
    nome: 'Maria Santos',
    email: 'maria.santos@gmail.com',
    telefone: '(21) 98888-5678',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    interesse: 'Produtos',
    expectativa_investimento: null,
    loja_regiao: 'Copacabana',
    mensagem: 'Quero conhecer os produtos disponíveis.',
    pipefy_card_id: null,
    loja_id: 102,
    loja_nome: 'Loja Rio - Copacabana',
    loja_cidade: 'Rio de Janeiro',
    loja_estado: 'RJ',
    data_criacao: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 horas atrás
    data_atualizacao: new Date().toISOString(),
  },
  {
    id: 3,
    nome: 'Carlos Oliveira',
    email: 'carlos.oliveira@empresa.com',
    telefone: '(11) 97777-9012',
    cidade: 'Guarulhos',
    estado: 'SP',
    interesse: 'Franquia',
    expectativa_investimento: 'R$ 200.000 - R$ 500.000',
    loja_regiao: null,
    mensagem: null,
    pipefy_card_id: null,
    loja_id: 101,
    loja_nome: 'Loja São Paulo - Centro',
    loja_cidade: 'São Paulo',
    loja_estado: 'SP',
    data_criacao: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 dia atrás
    data_atualizacao: new Date().toISOString(),
  },
  {
    id: 4,
    nome: 'Ana Costa',
    email: 'ana.costa@hotmail.com',
    telefone: '(41) 96666-3456',
    cidade: 'Curitiba',
    estado: 'PR',
    interesse: 'Serviços',
    expectativa_investimento: 'Até R$ 50.000',
    loja_regiao: 'Centro',
    mensagem: 'Gostaria de agendar uma visita.',
    pipefy_card_id: null,
    loja_id: 103,
    loja_nome: 'Loja Curitiba',
    loja_cidade: 'Curitiba',
    loja_estado: 'PR',
    data_criacao: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dias atrás
    data_atualizacao: new Date().toISOString(),
  },
  {
    id: 5,
    nome: 'Pedro Almeida',
    email: 'pedro.almeida@outlook.com',
    telefone: '(31) 95555-7890',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    interesse: 'Franquia',
    expectativa_investimento: 'Acima de R$ 500.000',
    loja_regiao: 'Savassi',
    mensagem: 'Tenho interesse em abrir uma unidade na região.',
    pipefy_card_id: null,
    loja_id: 104,
    loja_nome: 'Loja Belo Horizonte',
    loja_cidade: 'Belo Horizonte',
    loja_estado: 'MG',
    data_criacao: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dias atrás
    data_atualizacao: new Date().toISOString(),
  },
  {
    id: 6,
    nome: 'Fernanda Lima',
    email: 'fernanda.lima@gmail.com',
    telefone: '(11) 94444-1122',
    cidade: 'Santo André',
    estado: 'SP',
    interesse: 'Produtos',
    expectativa_investimento: null,
    loja_regiao: 'ABC Paulista',
    mensagem: null,
    pipefy_card_id: null,
    loja_id: 101,
    loja_nome: 'Loja São Paulo - Centro',
    loja_cidade: 'São Paulo',
    loja_estado: 'SP',
    data_criacao: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 dias atrás
    data_atualizacao: new Date().toISOString(),
  },
  {
    id: 7,
    nome: 'Ricardo Souza',
    email: 'ricardo.souza@email.com',
    telefone: '(21) 93333-4455',
    cidade: 'Niterói',
    estado: 'RJ',
    interesse: 'Franquia',
    expectativa_investimento: 'R$ 100.000 - R$ 200.000',
    loja_regiao: 'Icaraí',
    mensagem: 'Solicito informações sobre o modelo de franquia.',
    pipefy_card_id: null,
    loja_id: 102,
    loja_nome: 'Loja Rio - Copacabana',
    loja_cidade: 'Rio de Janeiro',
    loja_estado: 'RJ',
    data_criacao: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias atrás
    data_atualizacao: new Date().toISOString(),
  },
  {
    id: 8,
    nome: 'Juliana Rocha',
    email: 'juliana.rocha@empresa.com',
    telefone: '(41) 92222-6677',
    cidade: 'Londrina',
    estado: 'PR',
    interesse: 'Serviços',
    expectativa_investimento: 'R$ 50.000 - R$ 100.000',
    loja_regiao: null,
    mensagem: 'Tenho interesse nos serviços oferecidos.',
    pipefy_card_id: null,
    loja_id: 103,
    loja_nome: 'Loja Curitiba',
    loja_cidade: 'Curitiba',
    loja_estado: 'PR',
    data_criacao: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 dias atrás
    data_atualizacao: new Date().toISOString(),
  },
]

// Função para filtrar leads
export function getFilteredLeads(lojaId?: number | null, page = 1, perPage = 20) {
  let filtered = [...mockLeads]

  // Filtra por loja se especificado
  if (lojaId) {
    filtered = filtered.filter((lead) => lead.loja_id === lojaId)
  }

  // Ordena por data (mais recente primeiro)
  filtered.sort(
    (a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()
  )

  // Paginação
  const total = filtered.length
  const totalPages = Math.ceil(total / perPage)
  const start = (page - 1) * perPage
  const leads = filtered.slice(start, start + perPage)

  return {
    success: true,
    leads,
    total,
    page,
    per_page: perPage,
    total_pages: totalPages,
  }
}

// Função para buscar lead por ID
export function getLeadById(id: number, lojaId?: number | null) {
  const lead = mockLeads.find((l) => l.id === id)

  if (!lead) return null

  // Se tem lojaId, verifica se o lead pertence à loja
  if (lojaId && lead.loja_id !== lojaId) return null

  return lead
}

// Função para calcular estatísticas
export function getDashboardStats(lojaId?: number | null) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  let leads = [...mockLeads]

  if (lojaId) {
    leads = leads.filter((l) => l.loja_id === lojaId)
  }

  const leadsHoje = leads.filter((l) => new Date(l.data_criacao) >= hoje)

  return {
    totalLeads: leads.length,
    leadsHoje: leadsHoje.length,
    ultimoLead: leads.sort(
      (a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()
    )[0] || null,
  }
}
