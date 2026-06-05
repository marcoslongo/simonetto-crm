import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; etiqueta_id: string }> }
) {
  const { id, etiqueta_id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, mensagem: "Não autenticado." }, { status: 401 });
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/leads/${id}/etiquetas/${etiqueta_id}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.token}` },
    }
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
