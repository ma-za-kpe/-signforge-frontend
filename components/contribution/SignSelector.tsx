'use client'

import { useState, useEffect } from 'react'

interface SignOption {
  word: string
  contributions: number
  needed: number
  ready: boolean
}

interface SignSelectorProps {
  onSelectSign: (word: string) => void
}

export default function SignSelector({ onSelectSign }: SignSelectorProps) {
  const [signs, setSigns] = useState<SignOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalWords, setTotalWords] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredSigns, setFilteredSigns] = useState<SignOption[]>([])
  const WORDS_PER_PAGE = 50

  // Fetch contribution statistics from backend
  useEffect(() => {
    fetchContributionStats()
  }, [currentPage])

  // Filter signs based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSigns(signs)
      return
    }

    const query = searchQuery.toLowerCase().trim()
    const filtered = signs.filter(sign =>
      sign.word.toLowerCase().replace(/_/g, ' ').includes(query)
    )
    setFilteredSigns(filtered)
    setCurrentPage(1) // Reset to first page when searching
  }, [searchQuery, signs])

  const fetchContributionStats = async () => {
    try {
      // Fetch paginated words from database
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dictionary-words?page=${currentPage}&per_page=${WORDS_PER_PAGE}`
      )

      if (!response.ok) throw new Error('Failed to fetch words')

      const data = await response.json()

      setTotalWords(data.total)

      // Map to SignOption format (backend already sorted)
      const signOptions: SignOption[] = data.words.map((word: any) => ({
        word: word.word,
        contributions: word.contributions,
        needed: word.needed,
        ready: word.ready
      }))

      setSigns(signOptions)
      setFilteredSigns(signOptions)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch contribution stats:', error)
      setLoading(false)
    }
  }

  const handleSelectSign = (word: string) => {
    setSelectedWord(word)
    onSelectSign(word)
  }

  const getProgressColor = (contributions: number, needed: number): string => {
    const percentage = (contributions / needed) * 100
    if (percentage >= 100) return 'bg-green-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-indigo-500'
  }

  const getStatusBadge = (sign: SignOption) => {
    if (sign.ready) {
      return <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">✓ Complete</span>
    }
    if (sign.contributions === 0) {
      return <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">🚨 Urgent</span>
    }
    return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">⏳ In Progress</span>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contribution dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-3 sm:mb-4">
            🎥 Teach the AI
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-2 px-2">
            Help build Ghana's first community-powered sign language video database
          </p>
          <p className="text-sm sm:text-base text-gray-500 px-2">
            Each sign needs 10 contributions to train the AI
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a sign (e.g., 'hello', 'thank you')..."
              className="w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg text-gray-900 placeholder-gray-500 rounded-xl border-2 border-gray-300 focus:border-indigo-600 focus:outline-none transition-colors shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl sm:text-2xl"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="text-center mt-3 text-sm sm:text-base text-gray-600">
              Found <strong>{filteredSigns.length}</strong> sign{filteredSigns.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </div>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-lg text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-indigo-600">
              {signs.filter(s => !s.ready).length}
            </div>
            <div className="text-gray-600 text-xs sm:text-sm">Signs Need Help</div>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-lg text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">
              {signs.filter(s => s.ready).length}
            </div>
            <div className="text-gray-600 text-xs sm:text-sm">Signs Complete</div>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-lg text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">
              {signs.reduce((sum, s) => sum + s.contributions, 0)}
            </div>
            <div className="text-gray-600 text-xs sm:text-sm">Total Contributions</div>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3 sm:gap-4">
          <div className="text-sm sm:text-base text-gray-700 font-medium">
            {(() => {
              const displayCount = searchQuery ? filteredSigns.length : totalWords
              return <>Showing {((currentPage - 1) * WORDS_PER_PAGE) + 1}-{Math.min(currentPage * WORDS_PER_PAGE, displayCount)} of {displayCount} signs</>
            })()}
            {searchQuery && <span className="text-indigo-600"> (filtered)</span>}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base bg-white text-gray-800 font-medium rounded-lg shadow hover:shadow-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
            >
              <span className="hidden sm:inline">← Previous</span>
              <span className="sm:hidden">←</span>
            </button>
            <div className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base bg-indigo-600 text-white rounded-lg font-semibold shadow text-center">
              {(() => {
                const displayCount = searchQuery ? filteredSigns.length : totalWords
                return <><span className="hidden sm:inline">Page {currentPage} of {Math.ceil(displayCount / WORDS_PER_PAGE)}</span>
              <span className="sm:hidden">{currentPage}/{Math.ceil(displayCount / WORDS_PER_PAGE)}</span></>
              })()}
            </div>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage >= Math.ceil((searchQuery ? filteredSigns.length : totalWords) / WORDS_PER_PAGE)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base bg-white text-gray-800 font-medium rounded-lg shadow hover:shadow-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
            >
              <span className="hidden sm:inline">Next →</span>
              <span className="sm:hidden">→</span>
            </button>
          </div>
        </div>

        {/* Sign Selection Cards */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4">
            Choose a sign to contribute:
          </h2>

          {filteredSigns.map((sign) => {
            const progressPercentage = Math.min(100, (sign.contributions / sign.needed) * 100)

            return (
              <div
                key={sign.word}
                className={`bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer border-2 ${
                  selectedWord === sign.word ? 'border-indigo-600' : 'border-transparent'
                } ${sign.ready ? 'opacity-60' : ''}`}
                onClick={() => !sign.ready && handleSelectSign(sign.word)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-3">
                  <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                    <h3 className="text-lg sm:text-2xl font-bold text-gray-800">
                      {sign.word.replace('_', ' ')}
                    </h3>
                    {getStatusBadge(sign)}
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-xl sm:text-2xl font-bold text-indigo-600">
                      {sign.contributions}/{sign.needed}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">contributions</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mb-2 sm:mb-3">
                  <div
                    className={`${getProgressColor(sign.contributions, sign.needed)} h-2 sm:h-3 rounded-full transition-all duration-500`}
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>

                {/* Action Text */}
                {!sign.ready && (
                  <div className="text-gray-600 text-xs sm:text-sm">
                    {sign.contributions === 0 ? (
                      <span className="font-semibold text-red-600">🚨 Be the first to contribute!</span>
                    ) : (
                      <span>
                        {sign.needed - sign.contributions} more contribution{sign.needed - sign.contributions !== 1 ? 's' : ''} needed
                      </span>
                    )}
                  </div>
                )}

                {sign.ready && (
                  <div className="text-green-600 text-xs sm:text-sm font-semibold">
                    ✓ This sign has enough contributions for AI training!
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>

      {/* Fixed Privacy Footer - Always Visible */}
      <div className="fixed bottom-0 left-0 right-0 bg-indigo-600 text-white shadow-2xl z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-base sm:text-xl">🔒</span>
              <span className="font-semibold">Privacy First:</span>
              <span className="text-center sm:text-left">Only motion data is captured, not your video.</span>
            </div>
            <div className="hidden md:block text-indigo-200">|</div>
            <div className="hidden md:block text-indigo-100">
              Your contributions are anonymous and help train AI for authentic Ghana Sign Language.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
