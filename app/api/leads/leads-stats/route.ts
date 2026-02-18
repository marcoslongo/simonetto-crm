
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const from = searchParams.get("from")
    const to = searchParams.get("to")

    if (!from || !to) {
      return NextResponse.json(
        { error: "Datas obrigatórias" },
        { status: 400 }
      )
    }

    const url = `${process.env.NEXT_PUBLIC_WP_URL}/wp-json/api/v1/leads-30dias?from=${from}&to=${to}`

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Erro ao buscar leads")
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    )
  }
}
