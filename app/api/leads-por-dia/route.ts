import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getLeads } from '@/lib/leads-service'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const lojaId = searchParams.get('loja_id')

    if (!date) {
      return NextResponse.json({ success: false, message: 'Parâmetro date é obrigatório' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    const lojaIdNum = lojaId ? parseInt(lojaId) : undefined

    const data = await getLeads(1, 100, lojaIdNum, undefined, date, date, token)

    return NextResponse.json({
      success: true,
      data: data.leads || [],
    })
  } catch (error: any) {
    console.error('❌ Erro na route /api/leads-por-dia:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}