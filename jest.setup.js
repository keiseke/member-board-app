import '@testing-library/jest-dom'

// Next.js ルーターのモック
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// MongoDBとMongooseのモック
jest.mock('mongodb', () => ({
  MongoClient: {
    connect: jest.fn(() => ({
      db: jest.fn(() => ({
        collection: jest.fn(() => ({
          find: jest.fn(() => ({ toArray: jest.fn() })),
          findOne: jest.fn(),
          insertOne: jest.fn(),
          updateOne: jest.fn(),
          deleteOne: jest.fn(),
        })),
      })),
      close: jest.fn(),
    })),
  },
}))

// Mongoose完全モック
const MockSchema = function(definition) {
  this.definition = definition
  this.add = jest.fn()
  this.index = jest.fn()
  this.pre = jest.fn()
  this.post = jest.fn()
  this.virtual = jest.fn().mockReturnValue({ get: jest.fn(), set: jest.fn() })
  this.plugin = jest.fn()
  return this
}

// Schema.Types mock
MockSchema.Types = {
  ObjectId: 'ObjectId',
  String: String,
  Number: Number,
  Date: Date,
  Boolean: Boolean,
  Mixed: 'Mixed'
}

jest.mock('mongoose', () => ({
  default: {
    connect: jest.fn().mockResolvedValue({}),
    connection: {
      readyState: 1
    },
    Schema: MockSchema,
    models: {},
    model: jest.fn().mockImplementation((name, schema) => {
      const MockModel = function(data = {}) {
        Object.assign(this, data)
        this._id = data._id || 'mock-id'
        this.createdAt = data.createdAt || new Date()
        this.updatedAt = data.updatedAt || new Date()
        return this
      }
      
      MockModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
        lean: jest.fn().mockReturnThis()
      })
      MockModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      })
      MockModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      })
      MockModel.findByIdAndDelete = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      })
      MockModel.create = jest.fn().mockResolvedValue(new MockModel())
      MockModel.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 })
      MockModel.countDocuments = jest.fn().mockResolvedValue(0)
      
      MockModel.prototype.save = jest.fn().mockResolvedValue(this)
      MockModel.prototype.deleteOne = jest.fn().mockResolvedValue(this)
      MockModel.prototype.updateOne = jest.fn().mockResolvedValue(this)
      
      return MockModel
    }),
    Types: {
      ObjectId: {
        isValid: jest.fn().mockReturnValue(true)
      }
    }
  },
  connect: jest.fn().mockResolvedValue({}),
  connection: {
    readyState: 1
  },
  Schema: MockSchema,
  models: {},
  model: jest.fn(),
  Types: {
    ObjectId: {
      isValid: jest.fn().mockReturnValue(true)
    }
  }
}))

// BSON関連のモック
jest.mock('bson', () => ({
  ObjectId: function(id) {
    this._id = id || 'mock-object-id'
    this.toString = () => this._id
    return this
  }
}))

// データベース接続のモック
jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn().mockResolvedValue({})
}))

// Post モデルのモック - 修正版
const createMockPost = () => ({
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([])
  }),
  findById: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(null)
  }),
  findByIdAndUpdate: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(null)
  }),
  findByIdAndDelete: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(null)
  }),
  create: jest.fn().mockResolvedValue({}),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 })
})

jest.mock('@/models/Post', () => ({
  default: createMockPost()
}))

// Thread モデルのモック - 追加
const createMockThread = () => ({
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([])
  }),
  findById: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(null)
  }),
  findByIdAndUpdate: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(null)
  }),
  findByIdAndDelete: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(null)
  }),
  create: jest.fn().mockResolvedValue({}),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 })
})

jest.mock('@/models/Thread', () => ({
  default: createMockThread()
}))

// グローバルfetchのモック
global.fetch = jest.fn()

// Next.js Web API のモック
global.Request = class Request {
  constructor(url, options = {}) {
    this.url = url
    this.method = options.method || 'GET'
    this.headers = new Headers(options.headers || {})
    this.body = options.body || null
    this._json = null
    if (options.body && typeof options.body === 'string') {
      try {
        this._json = JSON.parse(options.body)
      } catch (e) {
        this._json = null
      }
    }
  }
  
  async json() {
    return this._json || {}
  }
  
  async text() {
    return this.body || ''
  }
}

global.Response = class Response {
  constructor(body, options = {}) {
    this.body = body
    this.status = options.status || 200
    this.statusText = options.statusText || 'OK'
    this.headers = new Headers(options.headers || {})
    this.ok = this.status >= 200 && this.status < 300
  }
  
  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
  }
  
  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
  }
  
  static json(data, init) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {})
      }
    })
  }
}

global.Headers = class Headers {
  constructor(init = {}) {
    this._headers = new Map()
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this._headers.set(key.toLowerCase(), value)
      })
    }
  }
  
  get(name) {
    return this._headers.get(name.toLowerCase())
  }
  
  set(name, value) {
    this._headers.set(name.toLowerCase(), value)
  }
  
  has(name) {
    return this._headers.has(name.toLowerCase())
  }
  
  delete(name) {
    this._headers.delete(name.toLowerCase())
  }
}

// NextResponse モック
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data, init) => global.Response.json(data, init),
    next: () => new global.Response(null, { status: 200 })
  },
  NextRequest: global.Request
}))

beforeEach(() => {
  fetch.mockClear()
  jest.clearAllMocks()
})

// MongoDB Memory Server のグローバル設定
process.env.MONGODB_MEMORY_SERVER_OPTS = JSON.stringify({
  binary: {
    version: '6.0.4',
    skipMD5: true
  },
  instance: {
    storageEngine: 'wiredTiger'
  },
  replSet: {
    count: 1,
    storageEngine: 'wiredTiger'
  }
})

// NextAuth の環境変数設定
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only'

// メール送信のテスト環境設定
process.env.SMTP_HOST = 'localhost'
process.env.SMTP_PORT = '587'
process.env.SMTP_USER = 'test@example.com'
process.env.SMTP_PASSWORD = 'test-password'

// Console warnings/errors を抑制（テスト環境でのみ）
if (process.env.NODE_ENV === 'test') {
  const originalConsoleError = console.error
  const originalConsoleWarn = console.warn

  console.error = (...args) => {
    if (
      typeof args[0] === 'string' && (
        args[0].includes('Warning: ReactDOM.render is no longer supported') ||
        args[0].includes('Warning: validateDOMNesting') ||
        args[0].includes('Warning: Function components cannot be given refs')
      )
    ) {
      return
    }
    originalConsoleError.apply(console, args)
  }

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' && (
        args[0].includes('componentWillReceiveProps') ||
        args[0].includes('componentWillUpdate') ||
        args[0].includes('componentWillMount')
      )
    ) {
      return
    }
    originalConsoleWarn.apply(console, args)
  }
}