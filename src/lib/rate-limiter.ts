import { LRUCache } from 'lru-cache'
import { NextRequest } from 'next/server'

interface RateLimitOptions {
  windowMs: number     // 時間窓（ミリ秒）
  maxRequests: number  // 最大リクエスト数
  keyGenerator?: (req: NextRequest) => string
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export class RateLimiter {
  private cache: LRUCache<string, number[]>
  
  constructor(private options: RateLimitOptions) {
    this.cache = new LRUCache({
      max: 1000,
      ttl: options.windowMs
    })
  }
  
  async checkLimit(key: string): Promise<RateLimitResult> {
    const now = Date.now()
    const requests = this.cache.get(key) || []
    
    // 古いリクエストを削除
    const validRequests = requests.filter(
      time => now - time < this.options.windowMs
    )
    
    const isLimited = validRequests.length >= this.options.maxRequests
    
    if (!isLimited) {
      validRequests.push(now)
      this.cache.set(key, validRequests)
    }
    
    const reset = Math.ceil((validRequests[0] || now + this.options.windowMs) / 1000)
    
    return {
      success: !isLimited,
      limit: this.options.maxRequests,
      remaining: Math.max(0, this.options.maxRequests - validRequests.length),
      reset
    }
  }
  
  async isRateLimited(key: string): Promise<boolean> {
    const result = await this.checkLimit(key)
    return !result.success
  }
  
  generateKey(req: NextRequest): string {
    if (this.options.keyGenerator) {
      return this.options.keyGenerator(req)
    }
    return getClientIP(req)
  }
}

export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const real = req.headers.get('x-real-ip')
  const clientIP = req.headers.get('x-client-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (real) {
    return real.trim()
  }
  
  if (clientIP) {
    return clientIP.trim()
  }
  
  // フォールバック
  return req.ip || 'unknown'
}

// 異なる用途のレート制限インスタンス
export const postRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1分
  maxRequests: 5,
})

export const loginRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15分
  maxRequests: 3,
})

export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1分
  maxRequests: 100,
})

export const passwordResetRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1時間
  maxRequests: 3,
})