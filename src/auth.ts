// src/auth.ts
import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'

const loginSchema = z.object({
  email: z.string().email('正しいメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください')
})

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }),
    Credentials({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'メールアドレス', type: 'email' },
        password: { label: 'パスワード', type: 'password' }
      },
      async authorize(credentials) {
        try {
          const validatedFields = loginSchema.safeParse(credentials)

          if (!validatedFields.success) {
            console.log('バリデーションエラー:', validatedFields.error)
            return null
          }

          const { email, password } = validatedFields.data

          await connectDB()
          const user = await User.findOne({ email }).select('+password')

          if (!user) {
            console.log('ユーザーが見つかりません:', email)
            return null
          }

          if (!user.emailVerified) {
            console.log('メール認証が完了していません:', email)
            throw new Error('メール認証が完了していません')
          }

          const passwordsMatch = await bcrypt.compare(password, user.password)

          if (!passwordsMatch) {
            console.log('パスワードが一致しません:', email)
            return null
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            role: user.role
          }
        } catch (error) {
          console.error('認証エラー:', error)
          return null
        }
      }
    })
    
  ],
  pages: {
    signIn: '/auth/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session: sessionData }) {
      if (user) {
        token.id = user.id
        token.emailVerified = !!user.emailVerified
        token.role = (user as any).role
      }
      
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.emailVerified = token.emailVerified as boolean
        session.user.name = token.name as string
        session.user.email = token.email as string
      }
      if (token.sub) {
        session.user.id = token.sub
      }
      if (token.role) {
        session.user.role = token.role as string
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET
}

export default NextAuth(authOptions)