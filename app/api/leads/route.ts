import { LeadsResponse } from "@/lib/types";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://manager.simonetto.com.br/wp-json/api/v1";

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

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, mensagem: "Não autorizado." }, { status: 401 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    const body = await req.json();

    // Garante loja_id: usa o do body ou o primeiro do usuário
    if (!body.loja_id && session.user.loja_ids?.[0]) {
      body.loja_id = session.user.loja_ids[0];
    }

    const res = await fetch(`${API_BASE_URL}/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Erro ao criar lead:", err);
    return NextResponse.json({ success: false, mensagem: "Erro interno." }, { status: 500 });
  }
}