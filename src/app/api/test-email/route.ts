// src/app/api/test-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { testEmailConnection, sendEmail } from '@/lib/email/client'
import { emailConfig } from '@/lib/email/config'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 メール設定診断開始')
    
    // 環境変数チェック
    const envCheck = {
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_PORT: !!process.env.SMTP_PORT,
      SMTP_USER: !!process.env.SMTP_USER,
      SMTP_PASSWORD: !!process.env.SMTP_PASSWORD,
      EMAIL_FROM: !!process.env.EMAIL_FROM,
      NEXT_PUBLIC_BASE_URL: !!process.env.NEXT_PUBLIC_BASE_URL,
      // OAuth設定
      GMAIL_OAUTH_CLIENT_ID: !!process.env.GMAIL_OAUTH_CLIENT_ID,
      GMAIL_OAUTH_CLIENT_SECRET: !!process.env.GMAIL_OAUTH_CLIENT_SECRET,
      GMAIL_OAUTH_REFRESH_TOKEN: !!process.env.GMAIL_OAUTH_REFRESH_TOKEN,
    }

    console.log('📋 環境変数チェック:', envCheck)

    // SMTP接続テスト
    console.log('🔌 SMTP接続テスト開始')
    const connectionTest = await testEmailConnection()
    console.log('🔌 SMTP接続テスト結果:', connectionTest)

    // メール設定情報（パスワードなしで安全に表示）
    const configInfo = {
      smtp: {
        host: emailConfig.smtp.host,
        port: emailConfig.smtp.port,
        secure: emailConfig.smtp.secure,
        authType: process.env.GMAIL_OAUTH_CLIENT_ID ? 'OAuth2' : 'Password'
      },
      addresses: emailConfig.addresses,
      baseUrl: emailConfig.app.baseUrl
    }

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      envCheck,
      configInfo,
      connectionTest
    })

  } catch (error) {
    console.error('❌ メール診断エラー:', error)
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { testEmail } = await request.json()
    
    if (!testEmail) {
      return NextResponse.json(
        { error: 'testEmail parameter is required' },
        { status: 400 }
      )
    }

    console.log('📧 テストメール送信開始:', testEmail)

    const result = await sendEmail({
      to: testEmail,
      subject: '🧪 メール送信テスト - 会員制掲示板',
      html: `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #ec4899;">📧 メール送信テスト成功！</h2>
          <p>この メールが届いているということは、メール送信機能が正常に動作しています。</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            送信時刻: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
          </p>
          <p style="color: #666; font-size: 12px;">
            環境: ${process.env.NODE_ENV || 'unknown'}
          </p>
        </div>
      `,
      type: 'system_notice'
    })

    console.log('📧 テストメール送信結果:', result)

    return NextResponse.json({
      status: result.success ? 'success' : 'error',
      timestamp: new Date().toISOString(),
      result
    })

  } catch (error) {
    console.error('❌ テストメール送信エラー:', error)
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}