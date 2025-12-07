/**
 * NextAuth.js Middleware
 * Protects routes that require authentication
 */
import { auth } from "@/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth

  // Protected routes that require authentication
  const protectedRoutes = [
    "/contribute",
    "/profile",
    "/settings",
  ]

  // Admin-only routes
  const adminRoutes = [
    "/ama",
  ]

  const pathname = req.nextUrl.pathname

  // Check if trying to access protected route without auth
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isLoggedIn) {
      const signInUrl = new URL("/auth/signin", req.url)
      signInUrl.searchParams.set("callbackUrl", pathname)
      return Response.redirect(signInUrl)
    }
  }

  // Check if trying to access admin route without admin role
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (!isLoggedIn || !req.auth?.user?.isAdmin) {
      return Response.redirect(new URL("/", req.url))
    }
  }
})

// Routes where middleware should run
export const config = {
  matcher: [
    "/contribute/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/ama/:path*",
  ],
}
