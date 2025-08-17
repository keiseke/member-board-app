// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import { authConfig } from '@/auth'

export const runtime = 'nodejs'

const handler = NextAuth(authConfig)

export { handler as GET, handler as POST }