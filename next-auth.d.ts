/**
 * NextAuth.js type augmentation
 * Extends the default Session and JWT types with SignTube-specific properties
 */
import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      isAdmin: boolean
      adminRole: string | null
      username?: string | null
      reputation?: number
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    isAdmin?: boolean
    adminRole?: string | null
    username?: string | null
    reputation?: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    email?: string
    name?: string
    picture?: string  // Google profile picture URL
    isAdmin?: boolean
    adminRole?: string | null
    username?: string | null
    reputation?: number
  }
}
