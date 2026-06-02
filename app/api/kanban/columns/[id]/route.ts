import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, mensagem: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const loja_id = searchParams.get("loja_id");

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/kanban-columns/${id}?loja_id=${loja_id ?? ""}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.token}` },
    }
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, mensagem: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/kanban-columns/${id}/move`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
