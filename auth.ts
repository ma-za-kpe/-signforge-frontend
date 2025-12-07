/**
 * SignTube Authentication Configuration
 * NextAuth.js v5 with Prisma adapter
 */
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    // Google OAuth (primary - most Ghanaians have Android/Gmail)
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // Email/Password fallback
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // TODO: Implement email/password verification
        // For MVP, return null (use Google OAuth)
        return null
      }
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // @ts-ignore - custom fields
        token.username = user.username
        // @ts-ignore
        token.reputation = user.reputationScore
        // @ts-ignore
        token.isVerified = user.isVerifiedSigner
        // @ts-ignore
        token.isAdmin = user.isAdmin
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        // @ts-ignore - custom fields
        session.user.username = token.username
        // @ts-ignore
        session.user.reputation = token.reputation
        // @ts-ignore
        session.user.isVerified = token.isVerified
        // @ts-ignore
        session.user.isAdmin = token.isAdmin
      }
      return session
    },

    async signIn({ user, account }) {
      // Allow sign in
      return true
    },
  },

  pages: {
    signIn: "/auth/signin",
    newUser: "/onboarding/username",  // First-time username setup
  },

  debug: process.env.NODE_ENV === "development",
})

// Type extensions for session
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      username?: string | null
      reputation?: number
      isVerified?: boolean
      isAdmin?: boolean
    }
  }

  interface User {
    username?: string | null
    reputationScore?: number
    isVerifiedSigner?: boolean
    isAdmin?: boolean
  }
}
