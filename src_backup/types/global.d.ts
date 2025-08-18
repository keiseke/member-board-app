import { DefaultSession } from 'next-auth';
import type mongoose from 'mongoose';

declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      role?: string;
      emailVerified: boolean;
    } & DefaultSession['user']
  }

  interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    emailVerified: boolean;
    role?: string;
  }
}