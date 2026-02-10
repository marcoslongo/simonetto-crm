import { NextResponse } from 'next/server';

const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  try {
    const response = await fetch(`${WORDPRESS_API_URL}/leads-stats-service`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`WordPress API retornou erro: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Falha ao buscar estatísticas do WordPress');
    }

    return NextResponse.json({
      success: true,
      data: {
        totalLeads: parseInt(data.data.total_leads) || 0,
        leadsContatados: parseInt(data.data.leads_contatados) || 0,
        leadsNaoContatados: parseInt(data.data.leads_nao_contatados) || 0,
        percContatados: parseFloat(data.data.perc_contatados) || 0,
        percNaoContatados: parseFloat(data.data.perc_nao_contatados) || 0,
        tempoMedioMinutos: parseFloat(data.data.tempo_medio_minutos) || 0,
        tempoMedioHoras: parseFloat(data.data.tempo_medio_horas) || 0,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar estatísticas de atendimento:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      data: null
    }, { status: 500 });
  }
}