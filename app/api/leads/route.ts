import { LeadsResponse } from "@/lib/types";
import { NextResponse } from "next/server";

const API_BASE_URL = "https://manager.simonetto.com.br/wp-json/api/v1";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") ?? "1";
    const perPage = searchParams.get("per_page") ?? "10";
    const lojaId = searchParams.get("loja_id");

    let url = `${API_BASE_URL}/leads?page=${page}&per_page=${perPage}`;
    
    if (lojaId) {
      url += `&loja_id=${lojaId}`;
    }

    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error(`API error: ${res.status} ${res.statusText}`);
      return NextResponse.json(
        { error: "Erro ao buscar leads", success: false },
        { status: res.status }
      );
    }

    const data: LeadsResponse = await res.json();
    
    return NextResponse.json(data);
  } catch (err) {
    console.error("Erro na API:", err);
    return NextResponse.json(
      { error: "Erro interno ao buscar leads", success: false },
      { status: 500 }
    );
  }
}