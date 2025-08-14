// テストデータヘルパー
export const createMockPost = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439011',
  title: 'テスト投稿タイトル',
  content: 'これはテスト投稿の内容です。',
  author: '匿名',
  threadId: '507f1f77bcf86cd799439022',
  createdAt: new Date('2025-01-01T10:00:00.000Z'),
  updatedAt: new Date('2025-01-01T10:00:00.000Z'),
  ...overrides
})

export const createMockThread = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439022',
  title: 'テストスレッドタイトル',
  description: 'これはテストスレッドの説明です。',
  category: 'テクノロジー',
  creator: '匿名',
  postCount: 0,
  createdAt: new Date('2025-01-01T10:00:00.000Z'),
  updatedAt: new Date('2025-01-01T10:00:00.000Z'),
  ...overrides
})

export const createMockPosts = (count: number) => {
  return Array.from({ length: count }, (_, index) => 
    createMockPost({
      _id: `507f1f77bcf86cd79943901${index}`,
      title: `テスト投稿${index + 1}`,
      content: `これはテスト投稿${index + 1}の内容です。`,
      createdAt: new Date(2025, 0, index + 1, 10, 0, 0),
      updatedAt: new Date(2025, 0, index + 1, 10, 0, 0),
    })
  )
}

export const createMockThreads = (count: number) => {
  const categories = ['一般', 'テクノロジー', '政治', '経済', 'スポーツ']
  return Array.from({ length: count }, (_, index) => 
    createMockThread({
      _id: `507f1f77bcf86cd79943902${index}`,
      title: `テストスレッド${index + 1}`,
      description: `これはテストスレッド${index + 1}の説明です。`,
      category: categories[index % categories.length],
      postCount: Math.floor(Math.random() * 10),
      createdAt: new Date(2025, 0, index + 1, 10, 0, 0),
      updatedAt: new Date(2025, 0, index + 1, 10, 0, 0),
    })
  )
}

// API レスポンスモック
export const mockApiResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
})

// エラーレスポンスモック
export const mockApiError = (message: string, status = 500) => 
  mockApiResponse({ error: message }, status)

// MongoDB ObjectId のようなIDを生成
export const generateMockId = () => {
  return Math.floor(Math.random() * 0xffffff).toString(16).padStart(24, '0')
}

// データベースコレクションのモック
export const createMockDbCollection = () => {
  let data: any[] = []
  
  return {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue(data),
        exec: jest.fn().mockResolvedValue(data),
      }),
      toArray: jest.fn().mockResolvedValue(data),
      exec: jest.fn().mockResolvedValue(data),
    }),
    findById: jest.fn().mockImplementation((id) => ({
      exec: jest.fn().mockResolvedValue(data.find(item => item._id === id))
    })),
    findByIdAndUpdate: jest.fn().mockImplementation((id, update) => {
      const index = data.findIndex(item => item._id === id)
      if (index >= 0) {
        data[index] = { ...data[index], ...update, updatedAt: new Date() }
        return { exec: jest.fn().mockResolvedValue(data[index]) }
      }
      return { exec: jest.fn().mockResolvedValue(null) }
    }),
    findByIdAndDelete: jest.fn().mockImplementation((id) => {
      const index = data.findIndex(item => item._id === id)
      if (index >= 0) {
        const deleted = data.splice(index, 1)[0]
        return { exec: jest.fn().mockResolvedValue(deleted) }
      }
      return { exec: jest.fn().mockResolvedValue(null) }
    }),
    create: jest.fn().mockImplementation((doc) => {
      const newDoc = { ...doc, _id: generateMockId(), createdAt: new Date(), updatedAt: new Date() }
      data.push(newDoc)
      return Promise.resolve(newDoc)
    }),
    save: jest.fn(),
    _setData: (newData: any[]) => { data = newData },
    _getData: () => data,
    _reset: () => { data = [] }
  }
}