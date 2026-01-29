import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas públicas que não precisam de autenticação
const publicRoutes = ['/login', '/unauthorized']

// Rotas de admin
const adminRoutes = ['/admin']

// Rotas do CRM (loja e admin podem acessar)
const crmRoutes = ['/crm']

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

  // Rota de admin - apenas administradores
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (userRole !== 'administrator') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    return NextResponse.next()
  }

  // Rota do CRM - lojas e admins podem acessar
  if (crmRoutes.some(route => pathname.startsWith(route))) {
    // Ambos os roles podem acessar
    return NextResponse.next()
  }

  // Página raiz - redireciona baseado no role
  if (pathname === '/') {
    const redirectPath = userRole === 'administrator' ? '/admin' : '/crm'
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
