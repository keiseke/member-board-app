// src/app/api/auth/register/route.test.ts
import { POST } from './route'
import { User } from '@/models/User'
import { connectToDatabase, closeDatabaseConnection, clearDatabase } from '../../../../../__tests__/helpers/test-utils'
import bcrypt from 'bcryptjs'

// メール送信をモック
jest.mock('@/lib/email/client', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({ success: true })
}))

describe('/api/auth/register', () => {
  beforeAll(async () => {
    await connectToDatabase()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })

  beforeEach(async () => {
    await clearDatabase()
  })

  describe('POST /api/auth/register', () => {
    it('正常なデータで新規ユーザー登録が成功する', async () => {
      const requestData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      }

      const request = {
        json: jest.fn().mockResolvedValue(requestData)
      } as any

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.message).toContain('登録完了しました')
      expect(responseData.userId).toBeDefined()

      // データベースにユーザーが作成されたことを確認
      const createdUser = await User.findOne({ email: requestData.email })
      expect(createdUser).toBeTruthy()
      expect(createdUser?.name).toBe(requestData.name)
      expect(createdUser?.email).toBe(requestData.email)
      expect(createdUser?.emailVerified).toBe(false)
      expect(createdUser?.emailVerificationToken).toBeTruthy()
      expect(createdUser?.emailVerificationExpires).toBeTruthy()

      // パスワードがハッシュ化されていることを確認
      const isPasswordHashed = await bcrypt.compare(
        requestData.password,
        createdUser?.password || ''
      )
      expect(isPasswordHashed).toBe(true)
    })

    it('既存のメールアドレスで登録しようとすると409エラー', async () => {
      // 既存ユーザーを作成
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        password: await bcrypt.hash('password123', 12),
        emailVerified: true
      })

      const requestData = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'password456'
      }

      const request = {
        json: jest.fn().mockResolvedValue(requestData)
      } as any

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(409)
      expect(responseData.error).toBe('このメールアドレスは既に登録されています')
    })

    it('無効なメールアドレス形式でバリデーションエラー', async () => {
      const requestData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      }

      const request = {
        json: jest.fn().mockResolvedValue(requestData)
      } as any

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('バリデーションエラー')
      expect(responseData.details.email).toContain('正しいメールアドレスを入力してください')
    })

    it('短いパスワードでバリデーションエラー', async () => {
      const requestData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123'
      }

      const request = {
        json: jest.fn().mockResolvedValue(requestData)
      } as any

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('バリデーションエラー')
      expect(responseData.details.password).toContain('パスワードは6文字以上で入力してください')
    })

    it('名前が空でバリデーションエラー', async () => {
      const requestData = {
        name: '',
        email: 'john@example.com',
        password: 'password123'
      }

      const request = {
        json: jest.fn().mockResolvedValue(requestData)
      } as any

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('バリデーションエラー')
      expect(responseData.details.name).toContain('名前を入力してください')
    })

    it('名前が長すぎるとバリデーションエラー', async () => {
      const requestData = {
        name: 'a'.repeat(51), // 51文字
        email: 'john@example.com',
        password: 'password123'
      }

      const request = {
        json: jest.fn().mockResolvedValue(requestData)
      } as any

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('バリデーションエラー')
      expect(responseData.details.name).toContain('名前は50文字以内で入力してください')
    })

    it('必須フィールドが不足しているとバリデーションエラー', async () => {
      const requestData = {
        email: 'john@example.com'
        // nameとpasswordが不足
      }

      const request = {
        json: jest.fn().mockResolvedValue(requestData)
      } as any

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('バリデーションエラー')
      expect(responseData.details.name).toBeDefined()
      expect(responseData.details.password).toBeDefined()
    })
  })
})