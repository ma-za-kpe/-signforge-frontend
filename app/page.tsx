'use client';

/**
 * SignTube Homepage - Hybrid Dashboard
 * Combines search, feed, and community stats
 */
import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, TrendingUp, Award, Eye, Clock, Video, Users, BookOpen, ChevronRight } from 'lucide-react';
import { ContributionCard } from '@/components/feed/ContributionCard';
import { UserButton } from '@/components/auth/UserButton';

type FeedTab = 'new' | 'trending' | 'gold' | 'needs_review';

interface ContributionItem {
  id: number;
  contribution_id: string;
  word: string;
  user_id: string | null;
  quality_score: number;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  is_gold_standard: boolean;
  video_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
  user_region: string | null;
}

interface FeedResponse {
  items: ContributionItem[];
  next_cursor: string | null;
  has_more: boolean;
  total_count: number;
}

interface FeedStats {
  total_contributions: number;
  gold_standard_count: number;
  needs_review_count: number;
  unique_words: number;
}

interface MissingWord {
  word: string;
  priority: number;
  contributions?: number;
  needed?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

const tabs: { id: FeedTab; label: string; icon: React.ReactNode }[] = [
  { id: 'new', label: 'New', icon: <Clock className="w-4 h-4" /> },
  { id: 'trending', label: 'Trending', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'gold', label: 'Gold', icon: <Award className="w-4 h-4" /> },
  { id: 'needs_review', label: 'Review', icon: <Eye className="w-4 h-4" /> },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FeedTab>('new');
  const [items, setItems] = useState<ContributionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [stats, setStats] = useState<FeedStats | null>(null);
  const [missingWords, setMissingWords] = useState<MissingWord[]>([]);
  const [topWords, setTopWords] = useState<{word: string; count: number}[]>([]);

  // Fetch stats and sidebar data
  useEffect(() => {
    // Fetch feed stats
    fetch(`${API_URL}/api/feed/stats`)
      .then(res => res.json())
      .then(setStats)
      .catch(console.error);

    // Fetch missing words (words needing contributions)
    fetch(`${API_URL}/api/missing-words?limit=5`)
      .then(res => res.json())
      .then(data => setMissingWords(data.words || []))
      .catch(() => {
        // Fallback if endpoint doesn't exist
        setMissingWords([
          { word: 'COMPUTER', priority: 1 },
          { word: 'INTERNET', priority: 2 },
          { word: 'PHONE', priority: 3 },
        ]);
      });

    // Fetch top words by contribution count
    fetch(`${API_URL}/api/feed/top-words?limit=5`)
      .then(res => res.json())
      .then(data => setTopWords(data.words || []))
      .catch(console.error);
  }, []);

  // Fetch feed
  const fetchFeed = useCallback(async (tab: FeedTab, nextCursor?: string) => {
    try {
      const isLoadMore = !!nextCursor;
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setItems([]);
      }

      const params = new URLSearchParams({ tab, limit: '10' });
      if (nextCursor) params.append('cursor', nextCursor);

      const res = await fetch(`${API_URL}/api/feed?${params}`);
      if (!res.ok) throw new Error('Failed to fetch feed');

      const data: FeedResponse = await res.json();

      if (isLoadMore) {
        setItems(prev => [...prev, ...data.items]);
      } else {
        setItems(data.items);
      }
      setCursor(data.next_cursor);
      setHasMore(data.has_more);
    } catch (err) {
      console.error('Feed fetch error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(activeTab);
  }, [activeTab, fetchFeed]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const loadMore = () => {
    if (cursor && !loadingMore) {
      fetchFeed(activeTab, cursor);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#00549F] to-[#00A2E5] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 flex-shrink-0">
              <span className="text-2xl">🤟</span>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold leading-tight">SignTube</h1>
                <p className="text-[10px] text-blue-100 leading-tight">Ghana Sign Language</p>
              </div>
            </a>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a sign..."
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/60 focus:bg-white focus:text-gray-900 focus:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all text-sm"
                />
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <a
                href="/contribute"
                className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 px-3 py-2 rounded-full font-medium transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Record</span>
              </a>
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      {/* Mission CTA - Words Needing Signs */}
      {missingWords.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-lg">🎯</span>
                <span className="font-medium">Words Needing Signs:</span>
                <div className="flex gap-2">
                  {missingWords.slice(0, 3).map((w, i) => (
                    <span key={w.word} className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                      {w.word}
                    </span>
                  ))}
                  {missingWords.length > 3 && (
                    <span className="text-xs opacity-80">+{missingWords.length - 3} more</span>
                  )}
                </div>
              </div>
              <a
                href={`/contribute?word=${missingWords[0]?.word || ''}`}
                className="flex items-center gap-1 px-4 py-1.5 bg-white text-orange-600 rounded-full font-bold text-sm hover:bg-orange-50 transition-colors"
              >
                Record Now
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feed Column */}
          <div className="lg:col-span-2">
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg mb-4 p-1 flex gap-1 shadow-sm">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-md font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#00549F] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-lg p-4 animate-pulse shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-1/4" />
                      </div>
                    </div>
                    <div className="h-48 bg-gray-200 rounded mb-3" />
                  </div>
                ))}
              </div>
            )}

            {/* Feed Items */}
            {!loading && items.length > 0 && (
              <div className="space-y-4">
                {items.map(item => (
                  <ContributionCard key={item.contribution_id} item={item} />
                ))}

                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="w-full py-3 bg-white hover:bg-gray-50 text-[#00549F] font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </button>
                )}
              </div>
            )}

            {/* Empty State */}
            {!loading && items.length === 0 && (
              <div className="bg-white rounded-lg p-8 text-center shadow-sm">
                <div className="text-5xl mb-4">📭</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No contributions yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Be the first to contribute a sign to the community!
                </p>
                <a
                  href="/contribute"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                >
                  <Video className="w-5 h-5" />
                  Start Recording
                </a>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Community Stats */}
            {stats && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#00549F]" />
                  Community Stats
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Video className="w-5 h-5 mx-auto mb-1 text-[#00549F]" />
                    <div className="text-xl font-bold text-[#00549F]">
                      {stats.total_contributions.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">Videos</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <Award className="w-5 h-5 mx-auto mb-1 text-yellow-600" />
                    <div className="text-xl font-bold text-yellow-600">
                      {stats.gold_standard_count.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">Gold</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <BookOpen className="w-5 h-5 mx-auto mb-1 text-green-600" />
                    <div className="text-xl font-bold text-green-600">
                      {stats.unique_words.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">Words</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <Eye className="w-5 h-5 mx-auto mb-1 text-orange-600" />
                    <div className="text-xl font-bold text-orange-600">
                      {stats.needs_review_count.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">Review</div>
                  </div>
                </div>
              </div>
            )}

            {/* Top Words */}
            {topWords.length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#00549F]" />
                  Top Words
                </h3>
                <div className="space-y-2">
                  {topWords.map((w, i) => (
                    <a
                      key={w.word}
                      href={`/search?q=${encodeURIComponent(w.word)}`}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          i === 0 ? 'bg-yellow-100 text-yellow-700' :
                          i === 1 ? 'bg-gray-100 text-gray-700' :
                          i === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {i + 1}
                        </span>
                        <span className="font-medium text-gray-800">{w.word}</span>
                      </div>
                      <span className="text-sm text-gray-500">▲{w.count}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Record CTA */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-5 text-white shadow-sm">
              <div className="text-3xl mb-2">🎥</div>
              <h3 className="font-bold text-lg mb-2">Contribute a Sign</h3>
              <p className="text-sm text-green-100 mb-4">
                Help build Ghana's sign language database. Your video could become the gold standard!
              </p>
              <a
                href="/contribute"
                className="block w-full py-2.5 bg-white text-green-600 font-bold rounded-lg text-center hover:bg-green-50 transition-colors"
              >
                Start Recording
              </a>
            </div>

            {/* How Voting Works */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-3">How Voting Works</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">▲</span>
                  <span>Upvote accurate, clear signs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">▼</span>
                  <span>Downvote incorrect signs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">🏆</span>
                  <span>Top voted = Gold Standard</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-[#00549F] to-[#00A2E5] mt-8">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-white text-sm">
            <p>SignTube 2025 • Ghana Sign Language Community</p>
            <div className="flex gap-4">
              <a href="/about" className="hover:underline">About</a>
              <a href="/pitch" className="hover:underline">Pitch Deck</a>
              <a href="https://github.com/ma-za-kpe/signforge-backend" className="hover:underline">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
