# 会員制掲示板 - 本番環境デプロイメントガイド

## 🚀 デプロイメント概要

### アーキテクチャ構成

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Custom Domain │    │      Vercel      │    │  MongoDB Atlas  │
│   (CloudFlare)  │────│   (Next.js 15)   │────│   (Production)  │
│                 │    │  Edge Functions  │    │   Cluster       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Monitoring     │
                    │  (Vercel + 外部)  │
                    └──────────────────┘
```

## 📋 デプロイメント要件チェックリスト

### 必須要件
- [x] Next.js 15対応
- [x] セキュリティ機能実装済み（レート制限、XSS、CSRF対策）
- [x] MongoDB統合
- [x] 認証システム（NextAuth.js）
- [x] 監査ログシステム

### デプロイ要件  
- [ ] MongoDB Atlas本番クラスタ
- [ ] Vercelプロジェクト作成
- [ ] 環境変数設定
- [ ] カスタムドメイン
- [ ] SSL証明書
- [ ] 監視・アラート

## 🗄️ MongoDB Atlas 本番環境セットアップ

### 1. 本番クラスタ作成

```bash
# クラスタ仕様（推奨）
- Tier: M10 以上 (本番環境最小)
- Region: 最寄りのリージョン (東京: ap-northeast-1)
- Version: MongoDB 7.0+
- Backup: Continuous Backup 有効
```

### 2. ネットワーク設定

```javascript
// IP Whitelist設定
{
  "allowedIPs": [
    "0.0.0.0/0" // Vercel用（後で制限）
  ],
  "networkAccess": {
    "vercel": true,
    "privateEndpoint": false // M10以上で利用可能
  }
}
```

### 3. データベース・コレクション構成

```javascript
// データベース: member_board_prod
{
  "collections": {
    "users": {
      "indexes": [
        { "email": 1 },
        { "createdAt": -1 },
        { "emailVerified": 1 }
      ]
    },
    "threads": {
      "indexes": [
        { "category": 1, "createdAt": -1 },
        { "authorId": 1 },
        { "isArchived": 1 }
      ]
    },
    "posts": {
      "indexes": [
        { "threadId": 1, "createdAt": -1 },
        { "authorId": 1 }
      ]
    },
    "audit_logs": {
      "indexes": [
        { "timestamp": -1 },
        { "action": 1, "timestamp": -1 },
        { "userId": 1, "timestamp": -1 },
        { "severity": 1, "timestamp": -1 }
      ],
      "ttl": { "timestamp": "90 days" } // 90日後自動削除
    }
  }
}
```

## 🔧 環境変数設定

### .env.production (Vercel環境変数)

```env
# === データベース ===
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/member_board_prod"

# === 認証 ===
NEXTAUTH_SECRET="[64文字以上のランダム文字列]"
NEXTAUTH_URL="https://your-domain.com"

# === セキュリティ ===
CSRF_SECRET="[32文字以上のランダム文字列]"
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=5

# === 監視 ===
MONITORING_ENABLED=true
LOG_LEVEL="info"

# === 外部サービス ===
CLOUDFLARE_API_TOKEN="[CloudFlare API Token]"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="noreply@your-domain.com"
SMTP_PASS="[App Password]"

# === アプリケーション ===
APP_NAME="Member Board"
APP_URL="https://your-domain.com"
SUPPORT_EMAIL="support@your-domain.com"
```

### セキュリティキー生成

```bash
# NextAuth Secret生成
openssl rand -base64 64

# CSRF Secret生成  
openssl rand -base64 32

# JWT Secret生成
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## ⚙️ Vercel設定

### 1. プロジェクト作成

```bash
# Vercel CLI使用
npm install -g vercel
vercel login
vercel --prod
```

### 2. vercel.json設定

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options", 
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/",
      "destination": "/dashboard",
      "permanent": false,
      "has": [
        {
          "type": "cookie",
          "key": "next-auth.session-token"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/health",
      "destination": "/api/health"
    }
  ]
}
```

### 3. 環境変数設定（Vercel Dashboard）

```bash
# Vercel CLI使用
vercel env add MONGODB_URI production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
# ... 他の環境変数
```

## 🛡️ セキュリティ強化設定

### 1. Content Security Policy強化

```typescript
// src/middleware.ts - 本番用CSP
const productionCSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://vercel.live",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https: blob:",
  "connect-src 'self' https://vitals.vercel-insights.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests"
].join('; ')
```

### 2. レート制限強化

```typescript
// 本番環境用レート制限設定
const productionRateLimit = {
  // API endpoints
  '/api/auth/': { windowMs: 15 * 60 * 1000, max: 5 }, // 15分に5回
  '/api/posts': { windowMs: 60 * 1000, max: 10 },     // 1分に10回  
  '/api/threads': { windowMs: 60 * 1000, max: 5 },    // 1分に5回
  '/api/user/': { windowMs: 60 * 1000, max: 20 },     // 1分に20回
  
  // Default
  'default': { windowMs: 60 * 1000, max: 100 }        // 1分に100回
}
```

### 3. セッション設定

```typescript
// src/auth.ts - 本番用設定
export const authOptions: NextAuthConfig = {
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24時間
    updateAge: 60 * 60,   // 1時間ごと更新
  },
  jwt: {
    maxAge: 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true, // HTTPS必須
        domain: process.env.COOKIE_DOMAIN // カスタムドメイン
      }
    }
  }
}
```

## 🌐 カスタムドメイン設定

### 1. ドメイン取得・DNS設定

```bash
# CloudFlare DNS設定例
Type: CNAME
Name: @
Content: cname.vercel-dns.com
Proxy: Proxied (オレンジクラウド)

Type: CNAME  
Name: www
Content: cname.vercel-dns.com
Proxy: Proxied
```

### 2. SSL/TLS設定

```javascript
// CloudFlare SSL設定
{
  "ssl": "Full (strict)",
  "minTlsVersion": "1.2",
  "alwaysUseHttps": true,
  "automaticHttpsRewrites": true,
  "hsts": {
    "enabled": true,
    "maxAge": 31536000,
    "includeSubdomains": true,
    "preload": true
  }
}
```

### 3. Vercelドメイン設定

```bash
# Vercel CLI
vercel domains add your-domain.com
vercel domains add www.your-domain.com
```

## 📊 監視・アラート設定

### 1. Vercel Analytics設定

```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout() {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### 2. カスタム監視設定

```typescript
// src/lib/monitoring.ts
export class ProductionMonitoring {
  static async logError(error: Error, context: any) {
    // 1. 内部ログ
    await auditLogger.log({
      action: 'APPLICATION_ERROR',
      resource: 'system',
      success: false,
      details: { error: error.message, stack: error.stack, context },
      severity: 'high',
      ip: context.ip || 'unknown',
      userAgent: context.userAgent || 'unknown'
    })
    
    // 2. 外部監視サービス（例：Sentry, LogRocket）
    if (process.env.SENTRY_DSN) {
      // Sentry.captureException(error, { extra: context })
    }
    
    // 3. 重要エラーはSlack通知
    if (error.message.includes('CRITICAL')) {
      await this.sendSlackAlert(error, context)
    }
  }
  
  static async sendSlackAlert(error: Error, context: any) {
    if (!process.env.SLACK_WEBHOOK_URL) return
    
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 本番エラー: ${error.message}`,
        attachments: [{
          color: 'danger',
          fields: [
            { title: 'Error', value: error.message, short: false },
            { title: 'URL', value: context.url, short: true },
            { title: 'User', value: context.userId || 'Anonymous', short: true }
          ]
        }]
      })
    })
  }
}
```

### 3. ヘルスチェックAPI

```typescript
// src/app/api/health/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      database: 'checking...',
      memory: 'checking...',
      redis: 'checking...'
    }
  }
  
  try {
    // Database check
    const { db } = await connectToDatabase()
    await db.admin().ping()
    checks.checks.database = 'healthy'
    
    // Memory check
    const memUsage = process.memoryUsage()
    checks.checks.memory = memUsage.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning'
    
    // Overall status
    const hasErrors = Object.values(checks.checks).some(check => check === 'error')
    checks.status = hasErrors ? 'unhealthy' : 'healthy'
    
    return NextResponse.json(checks, { 
      status: hasErrors ? 500 : 200,
      headers: { 'Cache-Control': 'no-cache' }
    })
    
  } catch (error) {
    checks.status = 'unhealthy'
    checks.checks.database = 'error'
    
    return NextResponse.json(checks, { status: 500 })
  }
}
```

## 🚦 デプロイメント手順

### Phase 1: 準備
1. **MongoDB Atlas本番クラスタ作成**
2. **環境変数準備**
3. **セキュリティ設定確認**

### Phase 2: Vercel設定
1. **Vercelプロジェクト作成**
2. **GitHub連携設定**
3. **環境変数設定**
4. **ビルド設定確認**

### Phase 3: デプロイ実行
1. **ステージング環境デプロイ**
2. **機能テスト実施**
3. **本番環境デプロイ**
4. **DNS切り替え**

### Phase 4: 本番環境確認
1. **ヘルスチェック**
2. **セキュリティテスト**
3. **パフォーマンステスト**
4. **監視設定確認**

## 📈 成功指標・KPI

### パフォーマンス
- **応答時間**: < 500ms (P95)
- **可用性**: > 99.9%
- **Core Web Vitals**: Good評価

### セキュリティ
- **セキュリティヘッダー**: A+評価
- **SSL評価**: A+評価
- **脆弱性**: 0件

### 監視
- **エラー率**: < 0.1%
- **監査ログ**: 100%記録
- **アラート応答**: < 5分

---

## 🎯 次のステップ

このガイドに従って、段階的にデプロイメントを実行していきます。各フェーズで十分なテストを行い、安全で安定した本番環境を構築しましょう。

何か質問や不明な点があれば、各セクションについて詳しく説明いたします。