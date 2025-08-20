// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { sendPasswordResetEmail } from '@/lib/email/client'

const forgotPasswordSchema = z.object({
  email: z.string().email('正しいメールアドレスを入力してください')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // バリデーション
    const validatedFields = forgotPasswordSchema.safeParse(body)
    
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

    await connectDB()

    // ユーザー検索  
    const user = await (User as any).findOne({ email }).select('+resetPasswordToken +resetPasswordExpires')
    
    if (!user) {
      // セキュリティのため、ユーザーが存在しなくても成功レスポンス
      return NextResponse.json({
        message: 'パスワードリセット用のメールを送信しました（該当するメールアドレスが登録されている場合）'
      })
    }

    // リセットトークン生成
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1時間後

    // ユーザー更新
    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = resetExpires
    await user.save()

    // パスワードリセットメール送信
    const emailResult = await sendPasswordResetEmail(email, user.name, resetToken)
    
    if (!emailResult.success) {
      console.error('パスワードリセットメール送信エラー:', emailResult.error)
      return NextResponse.json(
        { error: 'メール送信に失敗しました。しばらくしてから再度お試しください。' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'パスワードリセット用のメールを送信しました'
    })

  } catch (error) {
    console.error('パスワードリセット要求エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}