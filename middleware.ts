/**
 * NextAuth.js Middleware
 * Protects routes that require authentication
 *
 * Admin access is determined by:
 * 1. User must be logged in
 * 2. User's email must be in backend Admin table
 * 3. Admin status is checked on login and stored in session
 */
import { auth } from "@/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAdmin = req.auth?.user?.isAdmin === true

  // Protected routes that require authentication
  const protectedRoutes = [
    "/contribute",
    "/profile",
    "/settings",
  ]

  // Admin-only routes (requires isAdmin = true)
  const adminRoutes = [
    "/ama",
    "/admin",
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
    if (!isLoggedIn) {
      const signInUrl = new URL("/auth/signin", req.url)
      signInUrl.searchParams.set("callbackUrl", pathname)
      return Response.redirect(signInUrl)
    }
    if (!isAdmin) {
      // Redirect non-admins to home with a message
      return Response.redirect(new URL("/?error=admin_required", req.url))
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
    "/admin/:path*",
  ],
}
