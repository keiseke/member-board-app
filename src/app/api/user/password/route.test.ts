import { NextRequest } from 'next/server'
import { PUT } from './route'
import { User } from '@/models/User'
import { connectDB } from '@/lib/mongodb'
import bcrypt from 'bcryptjs'

// Auth のモック
jest.mock('@/auth', () => ({
  auth: jest.fn()
}))

jest.mock('@/models/User')
jest.mock('@/lib/mongodb')
jest.mock('bcryptjs')

import { auth } from '@/auth'

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockUser = User as jest.Mocked<typeof User>
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

describe('/api/user/password', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('PUT /api/user/password', () => {
    it('認証なしの場合401を返す', async () => {
      mockAuth.mockResolvedValue(null)
      const request = new NextRequest('http://localhost/api/user/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: 'current123',
          newPassword: 'new123456',
          confirmPassword: 'new123456'
        })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('認証が必要です')
    })

    it('新しいパスワードが6文字未満の場合400エラーを返す', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user123' } })
      const request = new NextRequest('http://localhost/api/user/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: 'current123',
          newPassword: '12345',
          confirmPassword: '12345'
        })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('新しいパスワードは6文字以上で入力してください')
    })

    it('パスワード確認が一致しない場合400エラーを返す', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user123' } })
      const request = new NextRequest('http://localhost/api/user/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: 'current123',
          newPassword: 'new123456',
          confirmPassword: 'different123'
        })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('パスワードが一致しません')
    })

    it('現在のパスワードが間違っている場合400エラーを返す', async () => {
      const mockUserDoc = {
        password: 'hashedPassword'
      }

      mockAuth.mockResolvedValue({ user: { id: 'user123' } })
      mockConnectDB.mockResolvedValue(undefined)
      mockUser.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserDoc)
      } as any)
      mockBcrypt.compare.mockResolvedValue(false)

      const request = new NextRequest('http://localhost/api/user/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: 'wrongPassword',
          newPassword: 'new123456',
          confirmPassword: 'new123456'
        })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('現在のパスワードが正しくありません')
    })

    it('新しいパスワードが現在と同じ場合400エラーを返す', async () => {
      const mockUserDoc = {
        password: 'hashedPassword'
      }

      mockAuth.mockResolvedValue({ user: { id: 'user123' } })
      mockConnectDB.mockResolvedValue(undefined)
      mockUser.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserDoc)
      } as any)
      mockBcrypt.compare.mockResolvedValue(true)

      const request = new NextRequest('http://localhost/api/user/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: 'same123456',
          newPassword: 'same123456',
          confirmPassword: 'same123456'
        })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('新しいパスワードは現在のパスワードと異なる必要があります')
    })

    it('パスワードを正常に変更する', async () => {
      const mockUserDoc = {
        password: 'oldHashedPassword',
        save: jest.fn().mockResolvedValue(undefined)
      }

      mockAuth.mockResolvedValue({ user: { id: 'user123' } })
      mockConnectDB.mockResolvedValue(undefined)
      mockUser.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserDoc)
      } as any)
      mockBcrypt.compare.mockResolvedValue(true)
      mockBcrypt.hash.mockResolvedValue('newHashedPassword')

      const request = new NextRequest('http://localhost/api/user/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: 'current123',
          newPassword: 'new123456',
          confirmPassword: 'new123456'
        })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('パスワードを変更しました')
      expect(mockUserDoc.password).toBe('newHashedPassword')
      expect(mockUserDoc.save).toHaveBeenCalled()
      expect(mockBcrypt.hash).toHaveBeenCalledWith('new123456', 12)
    })

    it('ユーザーが見つからない場合404を返す', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user123' } })
      mockConnectDB.mockResolvedValue(undefined)
      mockUser.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      } as any)

      const request = new NextRequest('http://localhost/api/user/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: 'current123',
          newPassword: 'new123456',
          confirmPassword: 'new123456'
        })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('ユーザーが見つかりません')
    })
  })
})