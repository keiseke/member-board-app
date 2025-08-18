// src/lib/email/config.ts
export const emailConfig = {
  // SMTP設定 (Gmail OAuth2対応)
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.GMAIL_OAUTH_CLIENT_ID ? {
      // Gmail OAuth2認証
      type: 'OAuth2',
      user: process.env.GMAIL_USER || process.env.SMTP_USER,
      clientId: process.env.GMAIL_OAUTH_CLIENT_ID,
      clientSecret: process.env.GMAIL_OAUTH_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_OAUTH_REFRESH_TOKEN,
      accessToken: process.env.GMAIL_OAUTH_ACCESS_TOKEN,
    } : {
      // 従来のユーザー名/パスワード認証
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || ''
    },
    tls: {
      rejectUnauthorized: false
    }
  },

  // メールアドレス設定
  addresses: {
    // 自動送信専用（返信不要）
    noreply: process.env.EMAIL_FROM || 'noreply@mkpapa.com',
    
    // 管理者用
    admin: process.env.EMAIL_ADMIN || 'admin@mkpapa.com',
    
    // サポート用（ユーザーサポート対応）
    support: process.env.EMAIL_SUPPORT || 'support@mkpapa.com'
  },

  // 送信者名設定
  fromName: process.env.EMAIL_FROM_NAME || '掲示板システム',

  // セキュリティ設定
  security: {
    jwtSecret: process.env.JWT_SECRET || '',
    passwordResetExpires: parseInt(process.env.PASSWORD_RESET_EXPIRES || '3600000'), // 1時間
    emailVerificationExpires: parseInt(process.env.EMAIL_VERIFICATION_EXPIRES || '86400000') // 24時間
  },

  // アプリケーション設定
  app: {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    name: '会員制掲示板',
    supportUrl: process.env.NEXT_PUBLIC_BASE_URL + '/support'
  }
}

// メール種別定義
export const EMAIL_TYPES = {
  VERIFICATION: 'verification',
  PASSWORD_RESET: 'password_reset',
  SYSTEM_NOTICE: 'system_notice',
  WELCOME: 'welcome',
  SUPPORT_REQUEST: 'support_request'
} as const

export type EmailType = typeof EMAIL_TYPES[keyof typeof EMAIL_TYPES]

// メール送信者選択関数
export function getEmailSender(type: EmailType) {
  switch (type) {
    case EMAIL_TYPES.VERIFICATION:
    case EMAIL_TYPES.PASSWORD_RESET:
    case EMAIL_TYPES.WELCOME:
    case EMAIL_TYPES.SYSTEM_NOTICE:
      return {
        address: emailConfig.addresses.noreply,
        name: emailConfig.fromName
      }
    
    case EMAIL_TYPES.SUPPORT_REQUEST:
      return {
        address: emailConfig.addresses.support,
        name: `${emailConfig.fromName} サポート`
      }
    
    default:
      return {
        address: emailConfig.addresses.noreply,
        name: emailConfig.fromName
      }
  }
}