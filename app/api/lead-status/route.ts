import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function PATCH(req: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, mensagem: "Não autenticado." },
      { status: 401 }
    );
  }

  try {
    const { lead_id, status } = await req.json();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/leads/${lead_id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.token}`,
        },
        body: JSON.stringify({ status }),
      }
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, mensagem: "Erro interno." },
      { status: 500 }
    );
  }
}