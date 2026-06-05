import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, mensagem: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const loja_id = searchParams.get("loja_id");

  if (!loja_id) {
    return NextResponse.json({ success: false, mensagem: "loja_id é obrigatório." }, { status: 400 });
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/etiquetas?loja_id=${loja_id}`,
    {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: "no-store",
    }
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, mensagem: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/etiquetas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
