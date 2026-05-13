import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas públicas que não precisam de autenticação
const publicRoutes = ['/login', '/unauthorized']

// Rotas de admin
const adminRoutes = ['/admin']

const INACTIVITY_LIMIT_MS = 10 * 60 * 60 * 1000 // 10 horas

function clearSessionCookies(response: NextResponse) {
  response.cookies.delete('crm_session')
  response.cookies.delete('auth_token')
  response.cookies.delete('last_activity')
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignora arquivos estáticos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Busca a sessão do cookie
  const sessionCookie = request.cookies.get('crm_session')
  let session = null

  if (sessionCookie?.value) {
    try {
      session = JSON.parse(sessionCookie.value)

      // Verifica se expirou
      if (new Date(session.expires) < new Date()) {
        session = null
      }
    } catch {
      session = null
    }
  }

  const isAuthenticated = !!session
  const userRole = session?.user?.role

  // Rota pública - permite acesso
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    // Se já está logado e tenta acessar login, redireciona
    if (isAuthenticated && pathname === '/login') {
      const redirectPath = userRole === 'administrator' ? '/admin' : '/crm'
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }
    return NextResponse.next()
  }

  // Não autenticado - redireciona para login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verifica inatividade (apenas para usuários autenticados)
  const lastActivityCookie = request.cookies.get('last_activity')
  const lastActivity = lastActivityCookie ? Number(lastActivityCookie.value) : null

  if (lastActivity && Date.now() - lastActivity > INACTIVITY_LIMIT_MS) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('reason', 'inatividade')
    const response = NextResponse.redirect(loginUrl)
    clearSessionCookies(response)
    return response
  }

  // Rota de admin - apenas administradores
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (userRole !== 'administrator') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // Rota do CRM - lojas e admins podem acessar (sem restrição adicional)

  // Página raiz - redireciona baseado no role
  if (pathname === '/') {
    const redirectPath = userRole === 'administrator' ? '/admin' : '/crm'
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // Atualiza o timestamp de atividade em cada navegação autenticada
  const response = NextResponse.next()
  response.cookies.set('last_activity', String(Date.now()), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
