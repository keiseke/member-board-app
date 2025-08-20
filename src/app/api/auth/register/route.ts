// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { z } from 'zod'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { sendVerificationEmail } from '@/lib/email/client'

const passwordSchema = z.string()
  .min(8, 'パスワードは8文字以上で入力してください')
  .regex(/^(?=.*[a-z])/, '小文字を含む必要があります')
  .regex(/^(?=.*[A-Z])/, '大文字を含む必要があります')
  .regex(/^(?=.*\d)/, '数字を含む必要があります')
  .regex(/^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, '特殊文字を含む必要があります')

const registerSchema = z.object({
  name: z.string().min(1, '名前を入力してください').max(50, '名前は50文字以内で入力してください'),
  email: z.string().email('正しいメールアドレスを入力してください'),
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "パスワードが一致しません",
  path: ["confirmPassword"]
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // バリデーション
    const validatedFields = registerSchema.safeParse(body)
    
    if (!validatedFields.success) {
      return NextResponse.json(
        { 
          error: 'バリデーションエラー',
          details: validatedFields.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const { name, email, password } = validatedFields.data

    // データベース接続
    await connectDB()

    // 既存ユーザーチェック
    const existingUser = await (User as any).findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 409 }
      )
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12)

    // 認証トークン生成
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24時間後

    // ユーザー作成
    const user = await (User as any).create({
      name,
      email,
      password: hashedPassword,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    })

    // 認証メール送信
    console.log('📧 認証メール送信開始:', { email, name, token: verificationToken.substring(0, 8) + '...' })
    const emailResult = await sendVerificationEmail(email, name, verificationToken)
    console.log('📧 認証メール送信結果:', emailResult)
    
    if (!emailResult.success) {
      // ユーザーは作成されたが、メール送信に失敗
      console.error('❌ 認証メール送信エラー:', {
        error: emailResult.error,
        email,
        logId: emailResult.logId
      })
      return NextResponse.json(
        { 
          error: 'アカウントは作成されましたが、認証メールの送信に失敗しました。サポートにお問い合わせください。',
          details: `エラー: ${emailResult.error}`
        },
        { status: 201 } // 部分的成功
      )
    }

    return NextResponse.json(
      { 
        message: '登録完了しました。認証メールを送信しましたので、メールをご確認ください。',
        userId: user._id
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('登録エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}