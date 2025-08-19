// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// 認証が必要なパス
const protectedRoutes = [
  '/dashboard',
  '/thread',
  '/profile',
  '/posts',
  '/api/posts',
  '/api/user'
]

// POST/PUT/DELETEメソッドで認証が必要なAPIパス
const protectedApiMethods = [
  '/api/threads',
  '/api/user'
]

// 認証済みユーザーがアクセスできないパス
const authRoutes = [
  '/auth/login',
  '/auth/register'
]

// 公開パス（認証チェックを行わない）
const publicRoutes = [
  '/',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password'
]

export async function middleware(req: NextRequest) {
  const { nextUrl } = req
  const { pathname } = nextUrl
  
  // JWTトークンから認証状態を取得
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  })
  
  console.log('Middleware - Path:', pathname)
  console.log('Middleware - Method:', req.method)
  console.log('Middleware - Token:', token ? 'exists' : 'null')
  console.log('Middleware - User ID:', token?.id || token?.sub)
  
  const isLoggedIn = !!token
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isProtectedApiMethod = protectedApiMethods.some(route => pathname.startsWith(route)) && 
                               ['POST', 'PUT', 'DELETE'].includes(req.method)
  const isAuthRoute = authRoutes.includes(pathname)
  const isPublicRoute = publicRoutes.includes(pathname)

  // 基本的なセキュリティヘッダー設定
  const response = NextResponse.next()
  
  // 全てのルートにセキュリティヘッダーを追加
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  
  // Content Security Policy (CSP)設定
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'"
  ].join('; ')
  response.headers.set('Content-Security-Policy', csp)
  
  // Permissions Policy設定
  response.headers.set('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()'
  ].join(', '))
  
  // API ルートの追加セキュリティ設定
  if (pathname.startsWith('/api/')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  // 認証が必要なページの保護
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/auth/login', nextUrl)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // メール認証チェック
  if (isLoggedIn && isProtectedRoute && !token?.emailVerified) {
    if (pathname !== '/auth/verify-email') {
      return NextResponse.redirect(new URL('/auth/verify-email', nextUrl))
    }
  }

  // 認証済みユーザーの認証ページアクセス制限
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ]
}