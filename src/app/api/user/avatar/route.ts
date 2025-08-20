import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { User } from '@/models/User'
import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/user/avatar - 開始')
    
    const session = await getServerSession(authOptions)
    console.log('取得したセッション:', session)
    
    if (!session?.user?.id) {
      console.log('認証エラー: セッションまたはユーザーIDがありません')
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }
    
    console.log('認証成功: ユーザーID =', session.user.id)

    const formData = await request.formData()
    console.log('FormData取得完了')
    
    const file = formData.get('avatar') as File
    console.log('ファイル情報:', file ? { name: file.name, size: file.size, type: file.type } : 'ファイルなし')
    
    if (!file) {
      console.log('ファイルが選択されていません')
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      )
    }

    // ファイルタイプをチェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'JPG、PNG、WebP形式の画像ファイルのみアップロード可能です' },
        { status: 400 }
      )
    }

    // ファイルサイズをチェック (1MB制限 - MongoDBドキュメントサイズ制限のため)
    const maxSize = 1 * 1024 * 1024 // 1MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'ファイルサイズは1MB以下にしてください' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Base64でエンコードしてデータベースに保存
    const base64Data = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64Data}`
    console.log('Base64エンコード完了、データサイズ:', base64Data.length)
    console.log('dataURL全体のサイズ:', dataUrl.length)
    
    // MongoDBの16MBドキュメント制限チェック
    if (dataUrl.length > 10 * 1024 * 1024) { // 10MB制限
      return NextResponse.json(
        { error: 'エンコード後のファイルサイズが大きすぎます。より小さな画像を選択してください' },
        { status: 400 }
      )
    }

    // データベースを更新
    await connectDB()
    console.log('データベース接続成功')

    const user = await (User as any).findById(session.user.id)
    console.log('ユーザー検索結果:', user ? '見つかりました' : '見つかりません')
    console.log('ユーザーID:', session.user.id)
    
    if (!user) {
      console.log('ユーザーが見つかりません:', session.user.id)
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    console.log('保存前のavatarUrl:', user.avatarUrl)
    console.log('設定するdataUrlの長さ:', dataUrl.length)
    
    // 複数の方法で保存を試行
    try {
      console.log('保存前のユーザー情報:')
      console.log('- ユーザーID:', user._id.toString())
      console.log('- コレクション:', user.collection.name)
      console.log('- isModified before:', user.isModified())
      
      // 方法1: 直接保存
      user.avatarUrl = dataUrl
      user.markModified('avatarUrl')
      console.log('- isModified after:', user.isModified())
      console.log('- isModified avatarUrl:', user.isModified('avatarUrl'))
      
      const saveResult = await user.save()
      console.log('user.save完了')
      console.log('保存結果のavatarUrl存在:', !!saveResult.avatarUrl)
      console.log('保存結果のavatarUrl長さ:', saveResult.avatarUrl?.length)
      
      // 少し待機してからチェック
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 方法2: 新しい接続で確認
      const verifyUser = await (User as any).findById(session.user.id).select('+avatarUrl')
      console.log('確認用取得 - avatarUrl存在:', !!verifyUser?.avatarUrl)
      console.log('確認用取得 - avatarUrl長さ:', verifyUser?.avatarUrl?.length)
      
      // 方法3: updateOneを使って強制更新（ObjectId変換）
      if (!verifyUser?.avatarUrl) {
        console.log('updateOneで強制更新を試行')
        const objectId = new mongoose.Types.ObjectId(session.user.id)
        console.log('ObjectId変換:', objectId.toString())
        
        const updateResult = await (User as any).updateOne(
          { _id: objectId },
          { $set: { avatarUrl: dataUrl } }
        )
        console.log('updateOne結果:', updateResult)
        
        // 再確認
        const finalVerify = await (User as any).findById(objectId).select('+avatarUrl')
        console.log('最終確認 - avatarUrl存在:', !!finalVerify?.avatarUrl)
        console.log('最終確認 - avatarUrl長さ:', finalVerify?.avatarUrl?.length)
        
        // ネイティブMongoDBドライバーでも試行
        const db = mongoose.connection.db
        if (!db) {
          throw new Error('データベース接続が確立されていません')
        }
        const usersCollection = db.collection('users')
        const nativeResult = await usersCollection.updateOne(
          { _id: objectId },
          { $set: { avatarUrl: dataUrl } }
        )
        console.log('ネイティブMongoDB更新結果:', nativeResult)
        
        // ネイティブで確認
        const nativeUser = await usersCollection.findOne({ _id: objectId })
        console.log('ネイティブ確認 - avatarUrl存在:', !!nativeUser?.avatarUrl)
        console.log('ネイティブ確認 - avatarUrl長さ:', nativeUser?.avatarUrl?.length)
      }
      
    } catch (saveError) {
      console.error('データベース保存エラー:', saveError)
      return NextResponse.json(
        { error: 'データベース保存に失敗しました: ' + (saveError instanceof Error ? saveError.message : String(saveError)) },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'アバターを更新しました',
      avatarUrl: dataUrl
    })
  } catch (error) {
    console.error('アバターアップロードエラー:', error)
    return NextResponse.json(
      { error: 'アバターのアップロードに失敗しました' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    await connectDB()

    const user = await (User as any).findById(session.user.id)
    
    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // アバターURLを削除
    user.avatarUrl = undefined
    await user.save()

    return NextResponse.json({
      message: 'アバターを削除しました'
    })
  } catch (error) {
    console.error('アバター削除エラー:', error)
    return NextResponse.json(
      { error: 'アバターの削除に失敗しました' },
      { status: 500 }
    )
  }
}