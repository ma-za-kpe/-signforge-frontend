/**
 * SignTube Authentication Configuration
 * NextAuth.js v5 with JWT (no database required for MVP)
 *
 * Admin authentication flow:
 * 1. User logs in with Google OAuth
 * 2. JWT callback checks backend /api/admin/check for admin status
 * 3. isAdmin and adminRole stored in JWT token
 * 4. Session callback passes these to client-accessible session
 * 5. Middleware uses session.user.isAdmin for route protection
 */
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

// API URL for admin check - server-side only, so use non-NEXT_PUBLIC env or fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"

/**
 * Check if user is an admin by calling backend
 */
async function checkAdminStatus(email: string): Promise<{ isAdmin: boolean; role: string | null }> {
  try {
    const response = await fetch(`${API_URL}/api/admin/check?email=${encodeURIComponent(email)}`)
    if (response.ok) {
      const data = await response.json()
      return {
        isAdmin: data.is_admin === true,
        role: data.role || null
      }
    }
  } catch (error) {
    console.error("Failed to check admin status:", error)
  }
  return { isAdmin: false, role: null }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // Google OAuth (primary - most Ghanaians have Android/Gmail)
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      // On initial sign in, check admin status
      if (user && user.email) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image  // Google profile picture

        // Check if user is admin
        const adminStatus = await checkAdminStatus(user.email)
        token.isAdmin = adminStatus.isAdmin
        token.adminRole = adminStatus.role
      }

      // On session update, refresh admin status
      if (trigger === "update" && token.email) {
        const adminStatus = await checkAdminStatus(token.email as string)
        token.isAdmin = adminStatus.isAdmin
        token.adminRole = adminStatus.role
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.image = token.picture as string  // Google profile picture
        session.user.isAdmin = token.isAdmin as boolean || false
        session.user.adminRole = token.adminRole as string | null
      }
      return session
    },
  },

  pages: {
    signIn: "/auth/signin",
  },

  debug: process.env.NODE_ENV === "development",
})

// Type extensions are in next-auth.d.ts
