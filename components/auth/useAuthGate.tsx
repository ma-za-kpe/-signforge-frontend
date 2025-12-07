"use client"

/**
 * useAuthGate Hook
 * Reusable hook for gating actions behind authentication
 *
 * Usage:
 * const { requireAuth, AuthModal } = useAuthGate()
 *
 * // In event handler:
 * const handleVote = () => {
 *   if (!requireAuth('vote on contributions')) return
 *   // ... voting logic
 * }
 *
 * // In JSX:
 * return (
 *   <>
 *     <button onClick={handleVote}>Vote</button>
 *     <AuthModal />
 *   </>
 * )
 */
import { useState, useCallback } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { X, LogIn } from 'lucide-react'

interface AuthGateResult {
  isAuthenticated: boolean
  user: any
  requireAuth: (action?: string) => boolean
  AuthModal: React.FC
}

export function useAuthGate(): AuthGateResult {
  const { data: session, status } = useSession()
  const [showModal, setShowModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<string>('')

  const isAuthenticated = !!session
  const user = session?.user

  /**
   * Check if user is authenticated, show modal if not
   * @param action - Description of what action requires auth (e.g., "vote on contributions")
   * @returns true if authenticated, false if not (and shows modal)
   */
  const requireAuth = useCallback((action?: string): boolean => {
    if (status === 'loading') return false

    if (!session) {
      setPendingAction(action || 'perform this action')
      setShowModal(true)
      return false
    }
    return true
  }, [session, status])

  /**
   * Auth Modal Component - renders the sign-in prompt
   */
  const AuthModal: React.FC = () => {
    if (!showModal) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
          {/* Close button */}
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="p-6 text-center">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#00549F] to-[#00A2E5] rounded-full flex items-center justify-center">
              <LogIn className="w-8 h-8 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Sign in required
            </h2>

            {/* Description */}
            <p className="text-gray-600 mb-6">
              You need to sign in to <span className="font-medium text-[#00549F]">{pendingAction}</span>.
              Join our community to contribute to Ghana Sign Language!
            </p>

            {/* Sign in buttons */}
            <div className="space-y-3">
              <button
                onClick={() => signIn('google')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-medium text-gray-700">Continue with Google</span>
              </button>

              <button
                onClick={() => signIn()}
                className="w-full px-4 py-3 bg-[#00549F] text-white rounded-lg font-medium hover:bg-[#004080] transition-colors"
              >
                Sign in with Email
              </button>
            </div>

            {/* Footer */}
            <p className="mt-4 text-xs text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    )
  }

  return {
    isAuthenticated,
    user,
    requireAuth,
    AuthModal
  }
}
