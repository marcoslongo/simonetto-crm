import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

const API_BASE_URL = "https://manager.simonetto.com.br/wp-json/api/v1";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const res = await fetch(`${API_BASE_URL}/lead-contato`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...body,
        usuario_id: user.id,
      }),
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Erro registrar contato:", error);

    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}
