"use client"

/**
 * User Button Component
 * Shows sign in button when logged out, user avatar when logged in
 */
import { useSession, signIn, signOut } from "next-auth/react"
import { useState } from "react"
import { User, LogOut, Settings } from "lucide-react"

export function UserButton() {
  const { data: session, status } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)

  if (status === "loading") {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
    )
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn()}
        className="flex items-center gap-2 bg-white text-[#00549F] px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
      >
        <User className="w-4 h-4" />
        Sign In
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2"
      >
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="w-8 h-8 rounded-full border-2 border-white"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-white text-[#00549F] flex items-center justify-center font-bold">
            {session.user.name?.[0] || session.user.email?.[0] || "U"}
          </div>
        )}
        <span className="text-white font-medium hidden sm:block">
          {(session.user as any).username || session.user.name?.split(" ")[0] || "User"}
        </span>
      </button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
            <div className="px-4 py-2 border-b">
              <p className="font-medium text-gray-900">
                {session.user.name}
              </p>
              <p className="text-sm text-gray-500">
                @{(session.user as any).username || "no-username"}
              </p>
              {(session.user as any).reputation !== undefined && (
                <p className="text-xs text-[#00549F] mt-1">
                  {(session.user as any).reputation} reputation
                </p>
              )}
            </div>

            <a
              href="/profile"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              <User className="w-4 h-4" />
              Profile
            </a>

            <a
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              <Settings className="w-4 h-4" />
              Settings
            </a>

            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
