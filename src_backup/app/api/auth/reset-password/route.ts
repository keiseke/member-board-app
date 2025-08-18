// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'リセットトークンが必要です'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // バリデーション
    const validatedFields = resetPasswordSchema.safeParse(body)
    
    if (!validatedFields.success) {
      return NextResponse.json(
        { 
          error: 'バリデーションエラー',
          details: validatedFields.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const { token, password } = validatedFields.data

    await connectDB()

    // トークンでユーザーを検索
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    }).select('+password')

    if (!user) {
      return NextResponse.json(
        { error: '無効または期限切れのリセットトークンです' },
        { status: 400 }
      )
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12)

    // パスワード更新
    user.password = hashedPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    return NextResponse.json({
      message: 'パスワードをリセットしました。新しいパスワードでログインしてください。'
    })

  } catch (error) {
    console.error('パスワードリセットエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}