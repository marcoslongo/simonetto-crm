import { NextResponse } from "next/server";

const API_BASE_URL = "https://manager.simonetto.com.br/wp-json/api/v1";

export async function GET() {
  try {
    const res = await fetch(`${API_BASE_URL}/lojas`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error(`API error: ${res.status} ${res.statusText}`);
      return NextResponse.json(
        { error: "Erro ao buscar lojas", success: false },
        { status: res.status }
      );
    }

    const data = await res.json();
    
    return NextResponse.json(data);
  } catch (err) {
    console.error("Erro na API de lojas:", err);
    return NextResponse.json(
      { error: "Erro interno ao buscar lojas", success: false },
      { status: 500 }
    );
  }
}