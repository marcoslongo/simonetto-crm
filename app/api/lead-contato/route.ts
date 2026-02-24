import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const lojaId = user.loja_id;

    if (!lojaId) {
      return NextResponse.json(
        { success: false, mensagem: "Nenhuma loja vinculada ao usuário." },
        { status: 400 }
      );
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lojas/${lojaId}/lead-contato`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        usuario_id: user.id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("WP API error:", res.status, data);
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Erro registrar contato:", error);
    return NextResponse.json(
      { success: false, mensagem: "Erro interno" },
      { status: 500 }
    );
  }
}