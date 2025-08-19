// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from '@/auth'

export const runtime = 'nodejs'

const handler = NextAuth

export { handler as GET, handler as POST }