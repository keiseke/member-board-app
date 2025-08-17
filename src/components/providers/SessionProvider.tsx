// src/components/providers/SessionProvider.tsx
'use client'

import { SessionProvider } from 'next-auth/react'

interface Props {
  children: React.ReactNode
}

export default function AuthProvider({ children }: Props) {
  return (
    <SessionProvider
      basePath="/api/auth"
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  )
}