'use client';

/**
 * SignTube Homepage - Responsive Hybrid Dashboard
 * Combines search, feed, dictionary, and community stats
 * Mobile-first design with improved UX
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, TrendingUp, Award, Eye, Clock, Video, Users, BookOpen,
  ChevronRight, Menu, X, BookOpenCheck, ChevronLeft, Home as HomeIcon, Library
} from 'lucide-react';
import { ContributionCard } from '@/components/feed/ContributionCard';
import { UserButton } from '@/components/auth/UserButton';

type FeedTab = 'new' | 'trending' | 'gold' | 'needs_review';
type ViewMode = 'feed' | 'dictionary';

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
  frames_data?: any[] | null;
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

const DICTIONARY_PAGE_SIZE = 24;

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FeedTab>('new');
  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [items, setItems] = useState<ContributionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [stats, setStats] = useState<FeedStats | null>(null);
  const [missingWords, setMissingWords] = useState<MissingWord[]>([]);
  const [topWords, setTopWords] = useState<{word: string; count: number}[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dictionary state
  const [dictionaryWords, setDictionaryWords] = useState<string[]>([]);
  const [dictionaryPage, setDictionaryPage] = useState(1);
  const [dictionaryLoading, setDictionaryLoading] = useState(false);
  const [dictionaryTotal, setDictionaryTotal] = useState(0);
  const [dictionaryTotalPages, setDictionaryTotalPages] = useState(0);

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

  // Fetch dictionary words with server-side pagination
  const fetchDictionary = useCallback(async (page: number) => {
    setDictionaryLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/all-words?page=${page}&per_page=${DICTIONARY_PAGE_SIZE}`);
      if (res.ok) {
        const data = await res.json();
        setDictionaryWords(data.words || []);
        setDictionaryTotal(data.total || 0);
        setDictionaryTotalPages(data.total_pages || 0);
      }
    } catch (err) {
      console.error('Dictionary fetch error:', err);
    } finally {
      setDictionaryLoading(false);
    }
  }, []);

  // Fetch dictionary when switching to dictionary view or changing page
  useEffect(() => {
    if (viewMode === 'dictionary') {
      fetchDictionary(dictionaryPage);
    }
  }, [viewMode, dictionaryPage, fetchDictionary]);

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
    if (viewMode === 'feed') {
      fetchFeed(activeTab);
    }
  }, [activeTab, fetchFeed, viewMode]);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header - Improved Responsive */}
      <header className="bg-gradient-to-r from-[#00549F] to-[#0077B6] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          {/* Main Header Row */}
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 flex-shrink-0">
              <span className="text-2xl sm:text-3xl">🤟</span>
              <div className="hidden xs:block">
                <h1 className="text-base sm:text-lg font-bold leading-tight tracking-tight">SignTube</h1>
                <p className="text-[9px] sm:text-[10px] text-blue-200 leading-tight">Ghana Sign Language</p>
              </div>
            </a>

            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-4 lg:mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search signs..."
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/60 focus:bg-white focus:text-gray-900 focus:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all text-sm"
                />
              </div>
            </form>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              <button
                onClick={() => setViewMode('feed')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'feed' ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <HomeIcon className="w-4 h-4" />
                <span>Feed</span>
              </button>
              <button
                onClick={() => setViewMode('dictionary')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'dictionary' ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <Library className="w-4 h-4" />
                <span>Dictionary</span>
              </button>
              <a
                href="/contribute"
                className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 px-3 lg:px-4 py-2 rounded-full font-medium transition-colors text-sm ml-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden lg:inline">Record</span>
              </a>
              <div className="ml-2">
                <UserButton />
              </div>
            </nav>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
              <a
                href="/contribute"
                className="flex items-center justify-center w-9 h-9 bg-green-500 rounded-full"
              >
                <Plus className="w-5 h-5" />
              </a>
              <UserButton />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/10 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Row */}
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search signs..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/60 focus:bg-white focus:text-gray-900 focus:placeholder-gray-400 focus:outline-none transition-all text-sm"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#004080] border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-2">
              <button
                onClick={() => { setViewMode('feed'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                  viewMode === 'feed' ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <HomeIcon className="w-5 h-5" />
                Community Feed
              </button>
              <button
                onClick={() => { setViewMode('dictionary'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                  viewMode === 'dictionary' ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <Library className="w-5 h-5" />
                View Dictionary
              </button>
              <a
                href="/contribute"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-green-500 font-medium"
              >
                <Video className="w-5 h-5" />
                Record a Sign
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Mission CTA - Words Needing Signs */}
      {missingWords.length > 0 && viewMode === 'feed' && (
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-lg">🎯</span>
                <span className="font-medium hidden sm:inline">Words Needing Signs:</span>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {missingWords.slice(0, 3).map((w) => (
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
                className="flex items-center gap-1 px-4 py-1.5 bg-white text-orange-600 rounded-full font-bold text-sm hover:bg-orange-50 transition-colors whitespace-nowrap"
              >
                Record Now
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">

        {/* === FEED VIEW === */}
        {viewMode === 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Feed Column */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              {/* Tab Navigation */}
              <div className="bg-white rounded-xl mb-4 p-1 flex shadow-sm overflow-x-auto">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-[70px] flex items-center justify-center gap-1.5 py-2.5 px-2 sm:px-3 rounded-lg font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#00549F] text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.icon}
                    <span className="hidden xs:inline sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Loading State */}
              {loading && (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-xl p-4 animate-pulse shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full" />
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                          <div className="h-3 bg-gray-200 rounded w-1/4" />
                        </div>
                      </div>
                      <div className="h-48 bg-gray-200 rounded-lg" />
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
                      className="w-full py-3 bg-white hover:bg-gray-50 text-[#00549F] font-medium rounded-xl shadow-sm transition-colors disabled:opacity-50"
                    >
                      {loadingMore ? 'Loading...' : 'Load More'}
                    </button>
                  )}
                </div>
              )}

              {/* Empty State */}
              {!loading && items.length === 0 && (
                <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                  <div className="text-5xl mb-4">📭</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    No contributions yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Be the first to contribute a sign to the community!
                  </p>
                  <a
                    href="/contribute"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors"
                  >
                    <Video className="w-5 h-5" />
                    Start Recording
                  </a>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4 order-1 lg:order-2">
              {/* Community Stats - Mobile Horizontal, Desktop Vertical */}
              {stats && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#00549F]" />
                    Community Stats
                  </h3>
                  <div className="grid grid-cols-4 lg:grid-cols-2 gap-2 sm:gap-3">
                    <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-xl">
                      <Video className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-[#00549F]" />
                      <div className="text-lg sm:text-xl font-bold text-[#00549F]">
                        {stats.total_contributions.toLocaleString()}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-600">Videos</div>
                    </div>
                    <div className="text-center p-2 sm:p-3 bg-yellow-50 rounded-xl">
                      <Award className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-yellow-600" />
                      <div className="text-lg sm:text-xl font-bold text-yellow-600">
                        {stats.gold_standard_count.toLocaleString()}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-600">Gold</div>
                    </div>
                    <div className="text-center p-2 sm:p-3 bg-green-50 rounded-xl">
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-green-600" />
                      <div className="text-lg sm:text-xl font-bold text-green-600">
                        {stats.unique_words.toLocaleString()}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-600">Words</div>
                    </div>
                    <div className="text-center p-2 sm:p-3 bg-orange-50 rounded-xl">
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-orange-600" />
                      <div className="text-lg sm:text-xl font-bold text-orange-600">
                        {stats.needs_review_count.toLocaleString()}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-600">Review</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Words - Hidden on mobile */}
              {topWords.length > 0 && (
                <div className="hidden lg:block bg-white rounded-xl p-4 shadow-sm">
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
                        <span className="text-sm text-gray-500">{w.count}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions Card - Desktop only */}
              <div className="hidden lg:block bg-gradient-to-br from-[#00549F] to-[#0077B6] rounded-xl p-5 text-white shadow-sm">
                <div className="text-3xl mb-2">🎥</div>
                <h3 className="font-bold text-lg mb-2">Contribute a Sign</h3>
                <p className="text-sm text-blue-100 mb-4">
                  Help build Ghana's sign language database. Your video could become the gold standard!
                </p>
                <a
                  href="/contribute"
                  className="block w-full py-2.5 bg-white text-[#00549F] font-bold rounded-lg text-center hover:bg-blue-50 transition-colors"
                >
                  Start Recording
                </a>
              </div>
            </div>
          </div>
        )}

        {/* === DICTIONARY VIEW === */}
        {viewMode === 'dictionary' && (
          <div>
            {/* Dictionary Header */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <BookOpenCheck className="w-6 h-6 sm:w-7 sm:h-7 text-[#00549F]" />
                    Sign Dictionary
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base mt-1">
                    {dictionaryTotal > 0
                      ? `${dictionaryTotal} words with sign videos available`
                      : 'Browse all available sign language words'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Library className="w-4 h-4" />
                  <span>Ghana Sign Language</span>
                </div>
              </div>
            </div>

            {/* Dictionary Loading */}
            {dictionaryLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 animate-pulse shadow-sm">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {/* Dictionary Grid */}
            {!dictionaryLoading && dictionaryWords.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {dictionaryWords.map((word) => (
                    <a
                      key={word}
                      href={`/search?q=${encodeURIComponent(word)}`}
                      className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all group"
                    >
                      <div className="font-bold text-gray-900 group-hover:text-[#00549F] transition-colors truncate">
                        {word}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Video className="w-3 h-3" />
                        <span>View sign</span>
                      </div>
                    </a>
                  ))}
                </div>

                {/* Pagination */}
                {dictionaryTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => setDictionaryPage(p => Math.max(1, p - 1))}
                      disabled={dictionaryPage === 1}
                      className="flex items-center gap-1 px-3 py-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Prev</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(5, dictionaryTotalPages))].map((_, i) => {
                        let pageNum;
                        if (dictionaryTotalPages <= 5) {
                          pageNum = i + 1;
                        } else if (dictionaryPage <= 3) {
                          pageNum = i + 1;
                        } else if (dictionaryPage >= dictionaryTotalPages - 2) {
                          pageNum = dictionaryTotalPages - 4 + i;
                        } else {
                          pageNum = dictionaryPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setDictionaryPage(pageNum)}
                            className={`w-9 h-9 rounded-lg font-medium transition-colors ${
                              dictionaryPage === pageNum
                                ? 'bg-[#00549F] text-white'
                                : 'bg-white shadow-sm hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setDictionaryPage(p => Math.min(dictionaryTotalPages, p + 1))}
                      disabled={dictionaryPage === dictionaryTotalPages}
                      className="flex items-center gap-1 px-3 py-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Page info */}
                <p className="text-center text-sm text-gray-500 mt-3">
                  Showing {((dictionaryPage - 1) * DICTIONARY_PAGE_SIZE) + 1} - {Math.min(dictionaryPage * DICTIONARY_PAGE_SIZE, dictionaryTotal)} of {dictionaryTotal} words
                </p>
              </>
            )}

            {/* Empty Dictionary State */}
            {!dictionaryLoading && dictionaryWords.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                <div className="text-5xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Dictionary Coming Soon
                </h3>
                <p className="text-gray-600 mb-4">
                  We're building the Ghana Sign Language dictionary. Be a contributor!
                </p>
                <a
                  href="/contribute"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#00549F] hover:bg-[#004080] text-white font-medium rounded-xl transition-colors"
                >
                  <Video className="w-5 h-5" />
                  Record a Sign
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
