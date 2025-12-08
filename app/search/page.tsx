'use client';

/**
 * Search Page
 * Search for signs in the dictionary
 */
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, ArrowLeft, Video } from 'lucide-react';
import { searchSign, getSignImageUrl, SignSearchResult } from '@/lib/api';
import SignCard from '@/components/SignCard';
import { ContributionCard } from '@/components/feed/ContributionCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [searchedQuery, setSearchedQuery] = useState(initialQuery);
  const [dictionaryResult, setDictionaryResult] = useState<SignSearchResult | null>(null);
  const [communityResults, setCommunityResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = async (q: string) => {
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    setDictionaryResult(null);
    setCommunityResults([]);
    setSearchedQuery(q);

    try {
      // Search dictionary
      const dictResult = await searchSign(q);
      setDictionaryResult(dictResult);
    } catch (err) {
      // Dictionary search failed - word not in dictionary
    }

    try {
      // Search community contributions
      const res = await fetch(`${API_URL}/api/feed?word=${encodeURIComponent(q.toUpperCase())}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setCommunityResults(data.items || []);
      }
    } catch (err) {
      console.error('Community search failed:', err);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.history.pushState({}, '', `/search?q=${encodeURIComponent(query)}`);
      performSearch(query);
    }
  };

  const noResults = !loading && !dictionaryResult && communityResults.length === 0 && searchedQuery;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#00549F] to-[#00A2E5] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <a href="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </a>

            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for a sign..."
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
                  autoFocus
                />
              </div>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A2E5]"></div>
          </div>
        )}

        {/* Dictionary Result */}
        {!loading && dictionaryResult && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">📖</span>
              Dictionary Result
            </h2>
            <SignCard
              result={dictionaryResult}
              imageUrl={getSignImageUrl(dictionaryResult.sign_image)}
              query={searchedQuery}
            />
          </div>
        )}

        {/* Community Contributions */}
        {!loading && communityResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🎥</span>
              Community Videos ({communityResults.length})
            </h2>
            <div className="space-y-4">
              {communityResults.map(item => (
                <ContributionCard key={item.contribution_id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {noResults && (
          <div className="bg-white rounded-lg p-8 text-center shadow-sm">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No results for "{searchedQuery}"
            </h3>
            <p className="text-gray-600 mb-6">
              This word isn't in our dictionary or community yet. Be the first to add it!
            </p>
            <a
              href={`/contribute?word=${encodeURIComponent(searchedQuery)}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
            >
              <Video className="w-5 h-5" />
              Contribute "{searchedQuery}"
            </a>
          </div>
        )}

        {/* Empty State */}
        {!loading && !searchedQuery && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🔎</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Search for a sign
            </h3>
            <p className="text-gray-600">
              Enter a word to find it in our dictionary and community videos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A2E5]"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
