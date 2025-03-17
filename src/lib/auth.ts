import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import prisma from './prisma';
import { sign } from 'jsonwebtoken';

// Create a function to generate a JWT token
const generateAccessToken = (user: any) => {
  const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-super-secret-jwt-key-for-restaurant-os';
  return sign(
    { 
      id: user.id,
      role: user.role,
      branchId: user.branchId
    },
    jwtSecret,
    { expiresIn: '1d' }
  );
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        // Generate access token here and include it in the user object
        const accessToken = generateAccessToken(user);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          branchId: user.branchId,
          accessToken, // Include the token directly in the user object
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.branchId = user.branchId;
        
        // Use the token from the user object if available
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.branchId = token.branchId as string | undefined;
        
        // Add the raw JWT token to the session for socket authentication
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

// Extend next-auth types
declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
    branchId?: string;
    accessToken?: string; // Add accessToken to User type
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      branchId?: string;
    };
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    branchId?: string;
    accessToken?: string;
  }
} 