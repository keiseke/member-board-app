// src/app/api/auth/verify-email/route.test.ts
import { POST } from './route'
import { User } from '@/models/User'
import { connectToDatabase, closeDatabaseConnection, clearDatabase, createUnverifiedTestUser } from '../../../../../__tests__/helpers/test-utils'

describe('/api/auth/verify-email', () => {
  beforeAll(async () => {
    await connectToDatabase()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })

  beforeEach(async () => {
    await clearDatabase()
  })

  describe('POST /api/auth/verify-email', () => {
    it('有効なトークンでメール認証が成功する', async () => {
      const testToken = 'valid-token-123'
      const testUser = await createUnverifiedTestUser({
        email: 'test@example.com',
        emailVerificationToken: testToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
      })

      const request = {
        json: jest.fn().mockResolvedValue({ token: testToken })
      } as any

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.message).toBe('メール認証が完了しました。ログインしてください。')

      // データベースでユーザーの認証状態が更新されたことを確認
      const updatedUser = await User.findById(testUser._id)
      expect(updatedUser?.emailVerified).toBe(true)
      expect(updatedUser?.emailVerificationToken).toBeUndefined()
      expect(updatedUser?.emailVerificationExpires).toBeUndefined()
    })

    it('トークンが提供されていない場合は400エラー', async () => {
      const request = {
        json: jest.fn().mockResolvedValue({})
      } as any

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('認証トークンが必要です')
    })

    it('無効なトークンの場合は400エラー', async () => {
      const request = {
        json: jest.fn().mockResolvedValue({ token: 'invalid-token' })
      } as any

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('無効または期限切れの認証トークンです')
    })

    it('期限切れのトークンの場合は400エラー', async () => {
      const expiredToken = 'expired-token-123'
      await createUnverifiedTestUser({
        email: 'test@example.com',
        emailVerificationToken: expiredToken,
        emailVerificationExpires: new Date(Date.now() - 1000) // 1秒前に期限切れ
      })

      const request = {
        json: jest.fn().mockResolvedValue({ token: expiredToken })
      } as any

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('無効または期限切れの認証トークンです')
    })

    it('既に認証済みのユーザーのトークンでも認証処理が実行される', async () => {
      const testToken = 'already-verified-token'
      const testUser = await createUnverifiedTestUser({
        email: 'verified@example.com',
        emailVerified: false,
        emailVerificationToken: testToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
      })

      const request = {
        json: jest.fn().mockResolvedValue({ token: testToken })
      } as any

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.message).toBe('メール認証が完了しました。ログインしてください。')

      // データベースで認証状態が更新されたことを確認
      const updatedUser = await User.findById(testUser._id)
      expect(updatedUser?.emailVerified).toBe(true)
    })

    it('存在しないトークンの場合は400エラー', async () => {
      // データベースに該当するトークンを持つユーザーを作成しない
      const request = {
        json: jest.fn().mockResolvedValue({ token: 'non-existent-token' })
      } as any

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('無効または期限切れの認証トークンです')
    })
  })
})