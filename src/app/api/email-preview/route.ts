// src/app/api/email-preview/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { render } from '@react-email/render'
import WelcomeEmail from '@/components/email/WelcomeEmail'
import VerificationEmail from '@/components/email/VerificationEmail'
import PasswordResetEmail from '@/components/email/PasswordResetEmail'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const template = searchParams.get('template')
  const userName = searchParams.get('userName') || 'テストユーザー'
  
  if (!template) {
    return NextResponse.json(
      { error: 'template parameter is required' },
      { status: 400 }
    )
  }

  try {
    let html: string
    let subject: string

    switch (template) {
      case 'welcome':
        html = await render(
          WelcomeEmail({
            userName,
            dashboardUrl: 'http://localhost:3000/dashboard',
            supportEmail: 'support@example.com',
            appName: '会員制掲示板'
          })
        )
        subject = '🎉 会員制掲示板へようこそ！'
        break

      case 'verification':
        html = await render(
          VerificationEmail({
            userName,
            verificationUrl: 'http://localhost:3000/auth/verify-email?token=sample-token',
            supportEmail: 'support@example.com',
            appName: '会員制掲示板'
          })
        )
        subject = '【重要】メールアドレスの確認をお願いします'
        break

      case 'password-reset':
        html = await render(
          PasswordResetEmail({
            userName,
            resetUrl: 'http://localhost:3000/auth/reset-password?token=sample-token',
            supportEmail: 'support@example.com',
            appName: '会員制掲示板'
          })
        )
        subject = '【重要】パスワードリセットのご案内'
        break

      default:
        return NextResponse.json(
          { error: 'Invalid template. Available: welcome, verification, password-reset' },
          { status: 400 }
        )
    }

    // HTMLを直接レスポンスとして返す
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Email-Subject': encodeURIComponent(subject),
        'X-Template-Name': template,
        'X-User-Name': encodeURIComponent(userName)
      }
    })

  } catch (error) {
    console.error('Email preview error:', error)
    return NextResponse.json(
      { error: 'Failed to generate email preview' },
      { status: 500 }
    )
  }
}