import crypto from 'crypto'
import { getToken } from 'next-auth/jwt'
import { NextRequest } from 'next/server'

export interface CSRFTokenData {
  token: string
  timestamp: number
  sessionId?: string
}

export class CSRFProtection {
  private static readonly TOKEN_EXPIRY = 60 * 60 * 1000 // 1時間
  private static readonly SECRET_KEY = process.env.NEXTAUTH_SECRET || 'fallback-secret'

  /**
   * CSRFトークンを生成
   */
  static generateToken(sessionId?: string): CSRFTokenData {
    const token = crypto.randomBytes(32).toString('hex')
    const timestamp = Date.now()
    
    return {
      token,
      timestamp,
      sessionId
    }
  }

  /**
   * CSRFトークンを検証
   */
  static verifyToken(
    sessionToken: string, 
    requestToken: string, 
    sessionId?: string
  ): boolean {
    try {
      if (!sessionToken || !requestToken) {
        return false
      }

      // 基本的なトークン比較
      const isValidToken = crypto.timingSafeEqual(
        Buffer.from(sessionToken, 'hex'),
        Buffer.from(requestToken, 'hex')
      )

      return isValidToken
    } catch (error) {
      console.error('CSRF token verification error:', error)
      return false
    }
  }

  /**
   * CSRFトークンデータを検証（タイムスタンプ含む）
   */
  static verifyTokenData(
    sessionTokenData: CSRFTokenData,
    requestToken: string
  ): boolean {
    try {
      // トークンの有効期限チェック
      const now = Date.now()
      if (now - sessionTokenData.timestamp > this.TOKEN_EXPIRY) {
        return false
      }

      // トークン検証
      return this.verifyToken(sessionTokenData.token, requestToken, sessionTokenData.sessionId)
    } catch (error) {
      console.error('CSRF token data verification error:', error)
      return false
    }
  }

  /**
   * リクエストからCSRFトークンを抽出
   */
  static extractTokenFromRequest(req: NextRequest): string | null {
    // ヘッダーから取得
    const headerToken = req.headers.get('x-csrf-token')
    if (headerToken) {
      return headerToken
    }

    // クエリパラメータから取得
    const urlToken = req.nextUrl.searchParams.get('csrf_token')
    if (urlToken) {
      return urlToken
    }

    return null
  }

  /**
   * リクエストのCSRF保護を検証
   */
  static async verifyRequest(req: NextRequest): Promise<boolean> {
    try {
      // トークンを取得
      const token = await getToken({ 
        req, 
        secret: process.env.NEXTAUTH_SECRET 
      })

      if (!token) {
        return false
      }

      // リクエストからCSRFトークンを抽出
      const requestToken = this.extractTokenFromRequest(req)
      if (!requestToken) {
        return false
      }

      // セッションからCSRFトークンを取得（実際の実装では適切なストレージから取得）
      const sessionCSRFToken = token.csrfToken as string
      if (!sessionCSRFToken) {
        return false
      }

      return this.verifyToken(sessionCSRFToken, requestToken, token.sub)
    } catch (error) {
      console.error('CSRF request verification error:', error)
      return false
    }
  }

  /**
   * セキュアなランダム文字列生成
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * Double Submit Cookie用のトークン生成
   */
  static generateDoubleSubmitToken(): { cookieToken: string; formToken: string } {
    const baseToken = this.generateSecureToken()
    const secret = crypto.createHash('sha256').update(this.SECRET_KEY).digest()
    
    const cookieToken = baseToken
    const formToken = crypto
      .createHmac('sha256', secret)
      .update(baseToken)
      .digest('hex')

    return { cookieToken, formToken }
  }

  /**
   * Double Submit Cookie検証
   */
  static verifyDoubleSubmitToken(cookieToken: string, formToken: string): boolean {
    try {
      const secret = crypto.createHash('sha256').update(this.SECRET_KEY).digest()
      const expectedFormToken = crypto
        .createHmac('sha256', secret)
        .update(cookieToken)
        .digest('hex')

      return crypto.timingSafeEqual(
        Buffer.from(expectedFormToken, 'hex'),
        Buffer.from(formToken, 'hex')
      )
    } catch (error) {
      console.error('Double submit token verification error:', error)
      return false
    }
  }
}

// HTTPメソッドごとのCSRF保護要否判定
export function requiresCSRFProtection(method: string): boolean {
  return ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())
}

// 特定のパスをCSRF保護から除外
export function isCSRFExempt(pathname: string): boolean {
  const exemptPaths = [
    '/api/auth/', // NextAuth endpoints
    '/api/health', // ヘルスチェック
    '/api/public/' // 公開API
  ]

  return exemptPaths.some(path => pathname.startsWith(path))
}