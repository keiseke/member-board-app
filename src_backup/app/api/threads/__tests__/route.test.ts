// Jest mocks must be at the top
jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn()
}))
jest.mock('@/models/Thread', () => ({
  default: Object.assign(jest.fn(() => ({ save: jest.fn() })), {
    find: jest.fn(),
    create: jest.fn()
  })
}))

import { GET, POST } from '../route'
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Thread from '@/models/Thread'

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>
const mockThread = Thread as jest.MockedFunction<typeof Thread> & { find: jest.MockedFunction<() => { sort: jest.MockedFunction<() => Promise<unknown[]>> }> }

describe('/api/threads', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockConnectDB.mockResolvedValue(undefined)
  })

  describe('GET', () => {
    it('should fetch all threads in descending order', async () => {
      const mockThreads = [
        {
          _id: '1',
          title: 'テストスレッド1',
          description: 'テスト説明1',
          category: 'テクノロジー',
          creator: '匿名',
          postCount: 5,
          createdAt: new Date('2025-01-02'),
          updatedAt: new Date('2025-01-02'),
        },
        {
          _id: '2',
          title: 'テストスレッド2',
          description: 'テスト説明2',
          category: '一般',
          creator: 'ユーザー2',
          postCount: 3,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        }
      ]

      mockThread.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockThreads)
      })

      const response = await GET()
      const data = await response.json()

      expect(mockDbConnect).toHaveBeenCalledTimes(1)
      expect(mockThread.find).toHaveBeenCalledWith({})
      expect(data).toEqual(mockThreads)
      expect(response.status).toBe(200)
    })
  })

  describe('POST', () => {
    it('should create a new thread with valid data', async () => {
      const requestData = {
        title: '新しいスレッド',
        description: '新しいスレッドの説明',
        category: 'テクノロジー',
        creator: 'テストユーザー'
      }

      const createdThread = {
        _id: '123',
        ...requestData,
        postCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const request = {
        json: jest.fn().mockResolvedValue(requestData)
      } as Partial<NextRequest> as NextRequest

      const mockInstance = { save: jest.fn().mockResolvedValue(createdThread) }
      mockThread.mockImplementation(() => mockInstance)

      const response = await POST(request)
      const data = await response.json()

      expect(mockDbConnect).toHaveBeenCalledTimes(1)
      expect(mockThread).toHaveBeenCalledWith({
        title: requestData.title,
        description: requestData.description,
        category: requestData.category,
        creator: requestData.creator
      })
      expect(mockInstance.save).toHaveBeenCalled()
      expect(data).toEqual(expect.objectContaining({
        title: createdThread.title,
        description: createdThread.description
      }))
      expect(response.status).toBe(201)
    })

    it('should return 400 for missing required fields', async () => {
      const requestData = {
        title: '',
        description: '説明のみ'
      }

      const request = {
        json: jest.fn().mockResolvedValue(requestData)
      } as Partial<NextRequest> as NextRequest

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'タイトル、説明、カテゴリーは必須です' })
      expect(mockThread).not.toHaveBeenCalled()
    })
  })
})