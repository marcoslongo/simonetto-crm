import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { cookies } from 'next/headers'

const WP = process.env.NEXT_PUBLIC_WP_URL

export async function GET() {
  const user = await requireAdmin()
  void user

  const cookieStore = await cookies()
  const token = cookieStore.get('crm_token')?.value

  const res = await fetch(`${WP}/wp-json/api/v1/perfis-acesso`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
