import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/auth'
import { User } from '@/models/User'
import { connectDB } from '@/lib/mongodb.js'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '現在のパスワードを入力してください'),
  newPassword: z.string().min(6, '新しいパスワードは6文字以上で入力してください'),
  confirmPassword: z.string().min(1, 'パスワード確認を入力してください')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword']
})

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    const validatedData = changePasswordSchema.parse(body)

    await connectDB()

    const user = await User.findById(session.user.id).select('+password')
    
    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      validatedData.currentPassword, 
      user.password
    )

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: '現在のパスワードが正しくありません' },
        { status: 400 }
      )
    }

    if (validatedData.currentPassword === validatedData.newPassword) {
      return NextResponse.json(
        { error: '新しいパスワードは現在のパスワードと異なる必要があります' },
        { status: 400 }
      )
    }

    const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, 12)
    
    user.password = hashedNewPassword
    await user.save()

    return NextResponse.json({
      message: 'パスワードを変更しました'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('パスワード変更エラー:', error)
    return NextResponse.json(
      { error: 'パスワードの変更に失敗しました' },
      { status: 500 }
    )
  }
}