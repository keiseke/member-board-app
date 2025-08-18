import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { sendVerificationEmail } from '@/lib/email/client'

const resendSchema = z.object({
  email: z.string().email('正しいメールアドレスを入力してください')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // バリデーション
    const validatedFields = resendSchema.safeParse(body)
    
    if (!validatedFields.success) {
      return NextResponse.json(
        { 
          error: 'バリデーションエラー',
          details: validatedFields.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const { email } = validatedFields.data

    // データベース接続
    await connectDB()

    // ユーザー検索
    const user = await User.findOne({ email }).select('+emailVerificationToken +emailVerificationExpires')
    
    if (!user) {
      return NextResponse.json(
        { error: 'このメールアドレスは登録されていません' },
        { status: 404 }
      )
    }

    // すでに認証済みの場合
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'このアカウントはすでに認証済みです' },
        { status: 400 }
      )
    }

    // 前回の送信から60秒経過チェック（spam防止）
    const now = new Date()
    const lastTokenTime = user.emailVerificationExpires ? 
      new Date(user.emailVerificationExpires.getTime() - 24 * 60 * 60 * 1000) : // 有効期限から24時間引く = 作成時刻
      new Date(0)
    
    if (now.getTime() - lastTokenTime.getTime() < 60 * 1000) {
      return NextResponse.json(
        { error: '認証メールの再送信は60秒間隔で行ってください' },
        { status: 429 }
      )
    }

    // 新しい認証トークン生成
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24時間後

    // ユーザー更新
    await User.findByIdAndUpdate(user._id, {
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    })

    // 認証メール送信
    const emailResult = await sendVerificationEmail(email, user.name, verificationToken)
    
    if (!emailResult.success) {
      console.error('認証メール再送信エラー:', emailResult.error)
      return NextResponse.json(
        { error: '認証メールの送信に失敗しました。しばらく待ってから再度お試しください。' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: '認証メールを再送信しました。メールをご確認ください。',
        emailSent: true
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('認証メール再送信エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}