'use client';

import { useState, useEffect, useRef } from 'react';
import { searchSign, getSignImageUrl, getBrainStats, SignSearchResult, BrainStats } from '@/lib/api';
import SignCard from '@/components/SignCard';

export default function Home() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SignSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<BrainStats | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load brain stats on mount
  useEffect(() => {
    getBrainStats()
      .then(setStats)
      .catch(console.error);
  }, []);

  // Autocomplete as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:9000/api/autocomplete?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(data.suggestions?.length > 0);
        setSelectedIndex(-1);
      } catch (err) {
        console.error('Autocomplete failed:', err);
        setSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e?: React.FormEvent, selectedWord?: string) => {
    if (e) e.preventDefault();

    const searchQuery = selectedWord || query;
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setShowSuggestions(false);

    try {
      const searchResult = await searchSign(searchQuery);
      setResult(searchResult);
      if (selectedWord) setQuery(selectedWord);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault();
          handleSearch(undefined, suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const quickSearchWords = ['hello', 'cow', 'school', 'mother', 'father', 'thank you'];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#00549F] to-[#00A2E5] bg-clip-text text-transparent leading-tight">
                Ghana Sign Language Dictionary
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                AI-Powered Sign Search • {stats?.total_signs.toLocaleString() || '...'} Signs
              </p>
            </div>
            {stats && (
              <div className="hidden md:flex items-center space-x-4 text-sm flex-shrink-0">
                <div className="text-center">
                  <div className="text-xl font-bold text-[#00A2E5]">{stats.total_signs}</div>
                  <div className="text-xs text-gray-600">Signs</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-[#00549F]">{stats.brain_size_mb}MB</div>
                  <div className="text-xs text-gray-600">Brain</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 w-full">
        {/* Community Contribution Banner */}
        <div className="mb-4 p-4 sm:p-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold">🎥 Help Build Ghana's Sign Language Database</h3>
              <p className="text-sm sm:text-base text-green-100 mt-1">Teach the AI by recording yourself signing. Your contribution helps create authentic GSL videos!</p>
            </div>
            <a
              href="/contribute"
              className="w-full sm:w-auto text-center px-6 py-3 bg-white text-green-600 font-bold rounded-lg hover:bg-green-50 transition-all shadow-lg whitespace-nowrap min-h-[44px] flex items-center justify-center"
            >
              Start Contributing 🚀
            </a>
          </div>
        </div>

        {/* Teacher Dashboard Link */}
        <div className="mb-6 p-4 sm:p-6 bg-gradient-to-r from-[#00549F] to-[#00A2E5] rounded-xl text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold">👩‍🏫 Are you a teacher?</h3>
              <p className="text-sm sm:text-base text-blue-100 mt-1">Create inclusive lessons automatically with our Teacher Dashboard</p>
            </div>
            <a
              href="/teacher"
              className="w-full sm:w-auto text-center px-6 py-3 bg-white text-[#00549F] font-bold rounded-lg hover:bg-blue-50 transition-all shadow-lg whitespace-nowrap min-h-[44px] flex items-center justify-center"
            >
              Go to Teacher Dashboard →
            </a>
          </div>
        </div>

        {/* Search Form */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 relative">
              <div className="flex-1 relative" ref={suggestionsRef}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Start typing to see suggestions..."
                  className="w-full px-4 py-3 sm:py-3 text-base sm:text-lg text-gray-900 placeholder-gray-400 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00A2E5] focus:border-[#00A2E5] outline-none transition-all min-h-[48px]"
                  disabled={loading}
                  autoComplete="off"
                />

                {/* Autocomplete Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-[#00A2E5] rounded-lg shadow-xl z-50 max-h-60 sm:max-h-80 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion}
                        onClick={() => handleSearch(undefined, suggestion)}
                        className={`px-4 py-3 sm:py-3 cursor-pointer transition-colors min-h-[44px] flex items-center ${
                          index === selectedIndex
                            ? 'bg-[#00A2E5] text-white'
                            : 'hover:bg-[#E6F7FF] text-gray-800'
                        }`}
                      >
                        <span className="font-medium text-base">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[#00A2E5] to-[#00ADEF] text-white font-semibold rounded-lg hover:from-[#0089C2] hover:to-[#00A2E5] disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg min-h-[48px]"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Quick Search */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-600 font-medium w-full sm:w-auto">Quick search:</span>
              {quickSearchWords.map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => setQuery(word)}
                  className="px-4 py-2 text-sm sm:text-sm text-[#00549F] bg-[#E6F7FF] hover:bg-[#00A2E5] hover:text-white rounded-full transition-all font-medium min-h-[40px]"
                >
                  {word}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Word Not Found / Error Message */}
        {error && (
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">🔍</div>
                <h3 className="text-xl sm:text-2xl font-bold text-orange-900 mb-2">
                  Word Not Found in Dictionary
                </h3>
                <p className="text-orange-800 font-medium text-base sm:text-lg">
                  "{query}"
                </p>
                <p className="text-orange-700 text-sm mt-2">
                  This word isn't in our database yet, but you can help add it!
                </p>
              </div>

              {/* Be the First CTA */}
              <div className="bg-white rounded-lg p-5 border-2 border-orange-300 mb-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl">🌟</span>
                  <div>
                    <h4 className="font-bold text-orange-900 text-base sm:text-lg">Be the first contributor!</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      Record yourself signing "{query}" and help build Ghana's Sign Language database
                    </p>
                  </div>
                </div>
                <a
                  href={`/contribute?word=${encodeURIComponent(query)}`}
                  className="block w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-xl text-center group"
                >
                  <span className="flex items-center justify-center gap-2 text-base sm:text-lg">
                    <span className="text-2xl">🎥</span>
                    <span>Contribute "{query}" Now</span>
                    <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                  <span className="block text-xs text-green-100 mt-2">Your contribution will help 500,000+ deaf students</span>
                </a>
              </div>

              {/* Alternative Actions */}
              <div className="flex flex-col sm:flex-row gap-3 text-sm">
                <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-900 font-medium mb-1">💡 Try another word</p>
                  <p className="text-blue-700 text-xs">Search for similar words or synonyms</p>
                </div>
                <div className="flex-1 bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-purple-900 font-medium mb-1">📚 Browse dictionary</p>
                  <p className="text-purple-700 text-xs">Explore our {stats?.total_signs.toLocaleString() || '1,582'} signs</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A2E5]"></div>
          </div>
        )}

        {/* Search Result */}
        {result && !loading && (
          <div className="max-w-2xl mx-auto">
            <SignCard
              result={result}
              imageUrl={getSignImageUrl(result.sign_image)}
              query={query}
            />
          </div>
        )}

        {/* Empty State */}
        {!result && !loading && !error && (
          <div className="text-center py-8 sm:py-12 px-4">
            <div className="text-5xl sm:text-6xl mb-4">👋</div>
            <h2 className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-[#00549F] to-[#00A2E5] bg-clip-text text-transparent mb-2 px-4">
              Welcome to Ghana Sign Language Dictionary
            </h2>
            <p className="text-gray-600 mb-6 text-base sm:text-lg px-4">
              Search for any English word to find its Ghana Sign Language equivalent
            </p>

            {/* Mission Statement */}
            <div className="bg-gradient-to-br from-[#FFF9E6] to-white border-2 border-orange-200 rounded-xl p-4 sm:p-6 max-w-3xl mx-auto text-left shadow-lg mb-6">
              <h3 className="font-bold text-orange-800 mb-3 text-base sm:text-lg flex items-center gap-2">
                <span className="text-2xl">🎯</span> The Challenge That Matters
              </h3>
              <div className="space-y-3 text-sm sm:text-base text-gray-700">
                <p className="leading-relaxed">
                  Over the past three decades, Ghana has made significant progress in expanding access to education.
                  But some groups of learners are still being left behind—particularly <strong>children with hearing
                  impairments and speech difficulties</strong>.
                </p>
                <p className="leading-relaxed">
                  For these children, sign language is not optional—it is their <strong>primary way of communicating
                  and learning</strong>. The Ghana National Association of the Deaf (GNAD) along with UNICEF developed
                  the Harmonized Ghanaian Sign Language Dictionary to bring uniformity and recognition to Ghanaian Sign Language.
                </p>
                <div className="bg-orange-50 border-l-4 border-orange-400 p-3 sm:p-4 rounded">
                  <p className="font-semibold text-orange-900 mb-2 text-sm sm:text-base">The Problem:</p>
                  <p className="text-orange-800 text-sm sm:text-base">
                    This dictionary exists mainly in print. It is static, difficult to use widely, and not yet
                    integrated into classrooms, digital platforms, or assistive technologies.
                  </p>
                </div>
                <div className="bg-blue-50 border-l-4 border-[#00A2E5] p-3 sm:p-4 rounded">
                  <p className="font-semibold text-[#00549F] mb-2 text-sm sm:text-base">Our Mission:</p>
                  <p className="text-[#00549F] text-sm sm:text-base">
                    Harness the power of AI and assistive technologies to bridge this communication gap and
                    create truly inclusive learning environments.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#E6F7FF] to-white border-2 border-[#00A2E5]/20 rounded-xl p-4 sm:p-6 max-w-2xl mx-auto text-left shadow-lg">
              <h3 className="font-semibold text-[#00549F] mb-3 text-base sm:text-lg">How it works:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm sm:text-base text-gray-700">
                <li className="font-medium">Type an English word in the search box</li>
                <li className="font-medium">Our AI finds the matching sign using FAISS vector search</li>
                <li className="font-medium">View the sign illustration with metadata and confidence score</li>
              </ol>
              <p className="text-xs sm:text-sm text-[#00549F] mt-4 font-medium">
                Powered by 1,582 signs from the Ghana Sign Language Dictionary (3rd Edition)
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-gray-200">
        {/* Sponsors Section */}
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Proudly Supported By</h3>
            <p className="text-xs sm:text-sm text-gray-500">UNICEF StartUp Lab Hackathon 2025</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-center justify-items-center">
            {/* UNICEF Ghana */}
            <a
              href="https://www.unicef.org/ghana/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center group transition-transform hover:scale-105"
            >
              <div className="h-16 sm:h-20 flex items-center justify-center mb-2 w-full px-4">
                <img
                  src="/unicef-ghana-logo.png"
                  alt="UNICEF Ghana - For Every Child"
                  className="h-full w-auto object-contain max-w-full"
                />
              </div>
              <p className="text-xs text-gray-600 text-center px-2">For Every Child</p>
            </a>

            {/* MEST Africa */}
            <a
              href="https://meltwater.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center group transition-transform hover:scale-105"
            >
              <div className="h-16 sm:h-20 flex items-center justify-center mb-2 w-full px-4">
                <img
                  src="/mest-africa-logo.png"
                  alt="MEST Africa - Building Africa's Next Generation of Tech Entrepreneurs"
                  className="h-full w-auto object-contain max-w-full"
                />
              </div>
              <p className="text-xs text-gray-600 text-center px-2">Building Africa's Next Generation of Tech Entrepreneurs</p>
            </a>

            {/* DevCongress */}
            <a
              href="https://devcongress.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center group transition-transform hover:scale-105"
            >
              <div className="h-16 sm:h-20 flex items-center justify-center mb-2 w-full px-4">
                <img
                  src="/devcongress-logo.png"
                  alt="DevCongress - Ghana's largest developer community"
                  className="h-full w-auto object-contain max-w-full"
                />
              </div>
              <p className="text-xs text-gray-600 text-center px-2">Ghana's Largest Developer Community</p>
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="bg-gradient-to-r from-[#00549F] to-[#00A2E5]">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center">
              <p className="text-xs sm:text-sm text-white font-medium text-center">
                SignForge Hackathon 2025 • Built with FastAPI, FAISS, and Next.js 15
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
