import mongoose from 'mongoose';
import { DefaultSession } from 'next-auth';

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
      emailVerified: boolean;
    } & DefaultSession['user']
  }

  interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    emailVerified: boolean;
  }
}