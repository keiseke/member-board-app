const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

async function createTestUser() {
  const client = new MongoClient(process.env.MONGODB_URI)
  
  try {
    await client.connect()
    console.log('MongoDB接続成功')
    
    const db = client.db()
    const users = db.collection('users')
    
    // 既存のテストユーザーを削除
    await users.deleteOne({ email: 'test@example.com' })
    
    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash('password123', 12)
    
    // テストユーザーを作成
    const testUser = {
      name: 'テストユーザー',
      email: 'test@example.com',
      password: hashedPassword,
      bio: 'これはテストユーザーの自己紹介です。',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await users.insertOne(testUser)
    console.log('テストユーザー作成成功:', result.insertedId)
    
    console.log('作成されたユーザー情報:')
    console.log('- 名前:', testUser.name)
    console.log('- メール:', testUser.email)
    console.log('- パスワード: password123')
    console.log('- 自己紹介:', testUser.bio)
    
  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await client.close()
  }
}

createTestUser()