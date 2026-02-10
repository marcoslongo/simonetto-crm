import { NextResponse } from 'next/server';

const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  try {
    const response = await fetch(
      `${WORDPRESS_API_URL}/leads-tempo-por-loja`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error(`WordPress API retornou erro: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error('Falha ao buscar ranking de tempo por loja');
    }

    return NextResponse.json(
      {
        success: true,
        total_lojas: data.total_lojas || 0,
        data: (data.data || []).map((loja: any) => ({
          loja_id: String(loja.loja_id),
          loja_nome: loja.loja_nome,
          total_leads: String(loja.total_leads),
          tempo_medio_minutos: String(loja.tempo_medio_minutos),
          tempo_medio_horas: String(loja.tempo_medio_horas),
          ranking: Number(loja.ranking),
        })),
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro ao buscar ranking de tempo por loja:', error);

    return NextResponse.json(
      {
        success: false,
        total_lojas: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
