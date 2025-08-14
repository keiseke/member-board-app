// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// 認証が必要なパス
const protectedRoutes = [
  '/dashboard',
  '/posts',
  '/profile',
  '/api/posts'
]

// 認証済みユーザーがアクセスできないパス
const authRoutes = [
  '/auth/login',
  '/auth/register'
]

export default async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = request.nextUrl

  // API ルートのレート制限チェック（簡易版）
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    
    // セキュリティヘッダー追加
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    return response
  }

  // 認証が必要なルートの保護
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // メール認証チェック
    if (!token.emailVerified && pathname !== '/auth/verify-email') {
      return NextResponse.redirect(new URL('/auth/verify-email', request.url))
    }
  }

  // 認証済みユーザーの認証ページアクセス制限
  if (token && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// ミドルウェアを適用するパスを指定
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ]
}