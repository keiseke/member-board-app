import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { User } from '@/models/User'
import { connectDB } from '@/lib/mongodb'
import { z } from 'zod'
import mongoose from 'mongoose'

const updateProfileSchema = z.object({
  name: z.string().min(1, '名前を入力してください').max(50, '名前は50文字以内で入力してください'),
  bio: z.string().max(200, '自己紹介は200文字以内で入力してください').optional()
})

export async function GET() {
  try {
    console.log('プロフィール取得API開始')
    const session = await auth()
    console.log('セッション取得:', session?.user?.id)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    await connectDB()
    console.log('データベース接続完了')

    const user = await User.findById(session.user.id).select('name email bio +avatarUrl emailVerified')
    console.log('Mongooseユーザー取得結果:', {
      found: !!user,
      name: user?.name,
      avatarUrl: user?.avatarUrl ? 'あり' : 'なし',
      avatarUrlLength: user?.avatarUrl?.length
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // ネイティブMongoDBでも確認
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('データベース接続が確立されていません')
    }
    const usersCollection = db.collection('users')
    const nativeUser = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(session.user.id) })
    console.log('ネイティブユーザー取得結果:', {
      found: !!nativeUser,
      name: nativeUser?.name,
      avatarUrl: nativeUser?.avatarUrl ? 'あり' : 'なし',
      avatarUrlLength: nativeUser?.avatarUrl?.length
    })

    const result = {
      name: user.name,
      email: user.email,
      bio: user.bio || '',
      avatarUrl: nativeUser?.avatarUrl || user.avatarUrl || '', // ネイティブ結果を優先
      emailVerified: user.emailVerified
    }
    
    console.log('API応答データ:', {
      ...result,
      avatarUrl: result.avatarUrl ? 'データあり' : 'データなし',
      avatarUrlLength: result.avatarUrl?.length
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('プロフィール取得エラー:', error)
    return NextResponse.json(
      { error: 'プロフィールの取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/user/profile - 開始')
    
    const session = await auth()
    console.log('取得したセッション:', session)
    
    if (!session?.user?.id) {
      console.log('認証エラー: セッションまたはユーザーIDがありません')
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }
    
    console.log('認証成功: ユーザーID =', session.user.id)

    const body = await request.json()
    
    const validatedData = updateProfileSchema.parse(body)

    await connectDB()

    const user = await User.findById(session.user.id)
    
    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    user.name = validatedData.name
    if (validatedData.bio !== undefined) {
      user.bio = validatedData.bio
    }

    await user.save()

    return NextResponse.json({
      message: 'プロフィールを更新しました',
      user: {
        name: user.name,
        email: user.email,
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || '',
        emailVerified: user.emailVerified
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('プロフィール更新エラー:', error)
    return NextResponse.json(
      { error: 'プロフィールの更新に失敗しました' },
      { status: 500 }
    )
  }
}