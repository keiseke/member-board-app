import { NextRequest } from 'next/server'
import { GET, PUT } from './route'
import { User } from '@/models/User'
import { connectDB } from '@/lib/mongodb'

// Auth のモック
jest.mock('@/auth', () => ({
  auth: jest.fn()
}))

jest.mock('@/models/User')
jest.mock('@/lib/mongodb')

import { auth } from '@/auth'

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockUser = User as jest.Mocked<typeof User>
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>

describe('/api/user/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/user/profile', () => {
    it('認証なしの場合401を返す', async () => {
      mockAuth.mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('認証が必要です')
    })

    it('ユーザーが見つからない場合404を返す', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user123' } })
      mockConnectDB.mockResolvedValue(undefined)
      mockUser.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      } as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('ユーザーが見つかりません')
    })

    it('プロフィール情報を正常に取得する', async () => {
      const mockUserData = {
        name: 'テストユーザー',
        email: 'test@example.com',
        bio: 'テスト自己紹介',
        emailVerified: true
      }

      mockAuth.mockResolvedValue({ user: { id: 'user123' } })
      mockConnectDB.mockResolvedValue(undefined)
      mockUser.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserData)
      } as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        name: 'テストユーザー',
        email: 'test@example.com',
        bio: 'テスト自己紹介',
        emailVerified: true
      })
    })

    it('bioがnullの場合空文字を返す', async () => {
      const mockUserData = {
        name: 'テストユーザー',
        email: 'test@example.com',
        bio: null,
        emailVerified: true
      }

      mockAuth.mockResolvedValue({ user: { id: 'user123' } })
      mockConnectDB.mockResolvedValue(undefined)
      mockUser.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserData)
      } as any)

      const response = await GET()
      const data = await response.json()

      expect(data.bio).toBe('')
    })
  })

  describe('PUT /api/user/profile', () => {
    it('認証なしの場合401を返す', async () => {
      mockAuth.mockResolvedValue(null)
      const request = new NextRequest('http://localhost/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: 'テスト' })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('認証が必要です')
    })

    it('名前が空の場合400エラーを返す', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user123' } })
      const request = new NextRequest('http://localhost/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: '' })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('名前を入力してください')
    })

    it('名前が50文字を超える場合400エラーを返す', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user123' } })
      const longName = 'あ'.repeat(51)
      const request = new NextRequest('http://localhost/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: longName })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('名前は50文字以内で入力してください')
    })

    it('自己紹介が200文字を超える場合400エラーを返す', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user123' } })
      const longBio = 'あ'.repeat(201)
      const request = new NextRequest('http://localhost/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: 'テスト', bio: longBio })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('自己紹介は200文字以内で入力してください')
    })

    it('プロフィールを正常に更新する', async () => {
      const mockUserDoc = {
        name: 'テストユーザー',
        email: 'test@example.com',
        bio: 'テスト自己紹介',
        emailVerified: true,
        save: jest.fn().mockResolvedValue(undefined)
      }

      mockAuth.mockResolvedValue({ user: { id: 'user123' } })
      mockConnectDB.mockResolvedValue(undefined)
      mockUser.findById.mockResolvedValue(mockUserDoc)

      const request = new NextRequest('http://localhost/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ 
          name: '更新されたユーザー', 
          bio: '更新された自己紹介' 
        })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('プロフィールを更新しました')
      expect(mockUserDoc.name).toBe('更新されたユーザー')
      expect(mockUserDoc.bio).toBe('更新された自己紹介')
      expect(mockUserDoc.save).toHaveBeenCalled()
    })

    it('ユーザーが見つからない場合404を返す', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user123' } })
      mockConnectDB.mockResolvedValue(undefined)
      mockUser.findById.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: 'テスト' })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('ユーザーが見つかりません')
    })
  })
})