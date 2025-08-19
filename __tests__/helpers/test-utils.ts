// __tests__/helpers/test-utils.ts
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'

let mongod: MongoMemoryServer | undefined

export const connectToDatabase = async () => {
  if (mongoose.connection.readyState >= 1) return

  mongod = await MongoMemoryServer.create()
  const uri = mongod.getUri()
  await mongoose.connect(uri)
}

export const closeDatabaseConnection = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
  }
  if (mongod) {
    await mongod.stop()
  }
}

export const clearDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections
    for (const key in collections) {
      await collections[key].deleteMany({})
    }
  }
}

export const createTestUser = async (overrides: any = {}) => {
  const userData = {
    name: 'Test User',
    email: 'test@example.com',
    password: await bcrypt.hash('password123', 12),
    emailVerified: true,
    ...overrides
  }

  return await User.create(userData)
}

export const createUnverifiedTestUser = async (overrides: any = {}) => {
  return await createTestUser({
    emailVerified: false,
    emailVerificationToken: 'test-token-123',
    emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    ...overrides
  })
}