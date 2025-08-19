// __tests__/auth/auth.test.ts
import { authConfig } from '@/auth'
import { User } from '@/models/User'
import { connectToDatabase, closeDatabaseConnection, clearDatabase, createTestUser, createUnverifiedTestUser } from '../helpers/test-utils'
import bcrypt from 'bcryptjs'

describe('Authentication Logic', () => {
  beforeAll(async () => {
    await connectToDatabase()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })

  beforeEach(async () => {
    await clearDatabase()
  })

  describe('Credentials Provider', () => {
    const credentialsProvider = authConfig.providers[0]

    it('正しい認証情報でログイン成功', async () => {
      const testUser = await createTestUser({
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 12)
      })

      const result = await credentialsProvider.authorize({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result).toBeTruthy()
      expect(result?.id).toBe(testUser._id.toString())
      expect(result?.email).toBe('test@example.com')
      expect(result?.emailVerified).toBe(true)
    })

    it('間違ったパスワードでログイン失敗', async () => {
      await createTestUser({
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 12)
      })

      const result = await credentialsProvider.authorize({
        email: 'test@example.com',
        password: 'wrongpassword'
      })

      expect(result).toBeNull()
    })

    it('存在しないメールアドレスでログイン失敗', async () => {
      const result = await credentialsProvider.authorize({
        email: 'nonexistent@example.com',
        password: 'password123'
      })

      expect(result).toBeNull()
    })

    it('メール認証が完了していないユーザーはログイン失敗', async () => {
      await createUnverifiedTestUser({
        email: 'unverified@example.com',
        password: await bcrypt.hash('password123', 12)
      })

      const result = await credentialsProvider.authorize({
        email: 'unverified@example.com',
        password: 'password123'
      })

      expect(result).toBeNull()
    })

    it('無効なメールアドレス形式でバリデーション失敗', async () => {
      const result = await credentialsProvider.authorize({
        email: 'invalid-email',
        password: 'password123'
      })

      expect(result).toBeNull()
    })

    it('短いパスワードでバリデーション失敗', async () => {
      const result = await credentialsProvider.authorize({
        email: 'test@example.com',
        password: '123'
      })

      expect(result).toBeNull()
    })

    it('空の認証情報でログイン失敗', async () => {
      const result = await credentialsProvider.authorize({
        email: '',
        password: ''
      })

      expect(result).toBeNull()
    })

    it('部分的な認証情報でログイン失敗', async () => {
      const result1 = await credentialsProvider.authorize({
        email: 'test@example.com'
        // passwordが不足
      })

      const result2 = await credentialsProvider.authorize({
        password: 'password123'
        // emailが不足
      })

      expect(result1).toBeNull()
      expect(result2).toBeNull()
    })
  })

  describe('Session Callbacks', () => {
    it('JWT コールバックが正しくユーザー情報を設定する', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        emailVerified: true
      }

      const token = {}
      const result = await authConfig.callbacks?.jwt?.({
        token,
        user: mockUser,
        account: null,
        profile: undefined,
        isNewUser: false,
        trigger: 'signIn'
      })

      expect(result?.id).toBe('user123')
      expect(result?.emailVerified).toBe(true)
    })

    it('Session コールバックが正しくセッション情報を設定する', async () => {
      const mockToken = {
        id: 'user123',
        emailVerified: true,
        email: 'test@example.com'
      }

      const session = {
        user: {
          email: 'test@example.com'
        }
      }

      const result = await authConfig.callbacks?.session?.({
        session,
        token: mockToken,
        user: undefined,
        newSession: undefined,
        trigger: 'update'
      })

      expect(result?.user?.id).toBe('user123')
      expect(result?.user?.emailVerified).toBe(true)
    })
  })

  describe('Configuration', () => {
    it('正しい設定が適用されている', () => {
      expect(authConfig.session.strategy).toBe('jwt')
      expect(authConfig.session.maxAge).toBe(30 * 24 * 60 * 60) // 30日
      expect(authConfig.pages?.signIn).toBe('/auth/login')
      expect(authConfig.providers).toHaveLength(1)
      expect(authConfig.providers[0].id).toBe('credentials')
    })
  })
})