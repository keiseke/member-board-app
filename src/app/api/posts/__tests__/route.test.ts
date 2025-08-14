// Jest mocks must be at the top
jest.mock('@/lib/dbConnect', () => jest.fn())
jest.mock('@/models/Post', () => ({
  default: Object.assign(jest.fn(() => ({ save: jest.fn() })), {
    find: jest.fn()
  })
}))

import { GET, POST } from '../route'
import { NextRequest } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Post from '@/models/Post'

const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>
const mockPost = Post as jest.MockedFunction<typeof Post> & { find: jest.MockedFunction<() => { sort: jest.MockedFunction<() => Promise<unknown[]>> }> }

describe('/api/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDbConnect.mockResolvedValue(undefined)
  })

  describe('GET', () => {
    it('should fetch all posts in descending order', async () => {
      const mockPosts = [
        {
          _id: '1',
          title: 'テスト投稿1',
          content: 'テスト内容1',
          author: '匿名',
          threadId: 'thread1',
          createdAt: new Date('2025-01-02'),
          updatedAt: new Date('2025-01-02'),
        },
        {
          _id: '2',
          title: 'テスト投稿2',
          content: 'テスト内容2',
          author: 'ユーザー2',
          threadId: 'thread1',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        }
      ]

      mockPost.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockPosts)
      })

      const response = await GET()
      const data = await response.json()

      expect(mockDbConnect).toHaveBeenCalledTimes(1)
      expect(mockPost.find).toHaveBeenCalledWith({})
      expect(data).toEqual(mockPosts)
      expect(response.status).toBe(200)
    })

    it('should handle database errors', async () => {
      mockPost.find.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Database error'))
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch posts' })
    })
  })

  describe('POST', () => {
    it('should create a new post with valid data', async () => {
      const requestData = {
        title: '新しい投稿',
        content: '新しい投稿の内容'
      }

      const createdPost = {
        _id: '123',
        ...requestData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const request = {
        json: jest.fn().mockResolvedValue(requestData)
      } as Partial<NextRequest> as NextRequest

      const mockInstance = { save: jest.fn().mockResolvedValue(createdPost) }
      mockPost.mockImplementation(() => mockInstance)

      const response = await POST(request)
      const data = await response.json()

      expect(mockDbConnect).toHaveBeenCalledTimes(1)
      expect(mockPost).toHaveBeenCalledWith(requestData)
      expect(mockInstance.save).toHaveBeenCalled()
      expect(data).toEqual(expect.objectContaining({
        title: createdPost.title,
        content: createdPost.content
      }))
      expect(response.status).toBe(201)
    })

    it('should return 400 for missing required fields', async () => {
      const requestData = {
        title: '',
        content: '内容のみ'
      }

      const request = {
        json: jest.fn().mockResolvedValue(requestData)
      } as Partial<NextRequest> as NextRequest

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Title and content are required' })
      expect(mockPost).not.toHaveBeenCalled()
    })

    it('should handle database creation errors', async () => {
      const requestData = {
        title: '新しい投稿',
        content: '新しい投稿の内容'
      }

      const request = {
        json: jest.fn().mockResolvedValue(requestData)
      } as Partial<NextRequest> as NextRequest

      const mockInstance = { save: jest.fn().mockRejectedValue(new Error('Database creation error')) }
      mockPost.mockImplementation(() => mockInstance)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to create post' })
    })
  })
})