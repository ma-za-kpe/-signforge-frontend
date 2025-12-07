'use client';

/**
 * SignTube Feed Page
 * Reddit-style timeline of sign language contributions
 */
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ContributionCard } from '@/components/feed/ContributionCard';
import { FeedTabs } from '@/components/feed/FeedTabs';
import { FeedStats } from '@/components/feed/FeedStats';
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

interface FeedStatsData {
  total_contributions: number;
  gold_standard_count: number;
  needs_review_count: number;
  unique_words: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

export default function FeedPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<FeedTab>('new');
  const [items, setItems] = useState<ContributionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [stats, setStats] = useState<FeedStatsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch feed stats
  useEffect(() => {
    fetch(`${API_URL}/api/feed/stats`)
      .then(res => res.json())
      .then(setStats)
      .catch(err => console.error('Failed to load stats:', err));
  }, []);

  // Fetch feed items
  const fetchFeed = useCallback(async (tab: FeedTab, nextCursor?: string) => {
    try {
      const isLoadMore = !!nextCursor;
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setItems([]);
      }
      setError(null);

      const params = new URLSearchParams({ tab, limit: '20' });
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
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Load feed when tab changes
  useEffect(() => {
    fetchFeed(activeTab);
  }, [activeTab, fetchFeed]);

  const handleTabChange = (tab: FeedTab) => {
    setActiveTab(tab);
    setCursor(null);
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" className="flex items-center gap-2">
                <span className="text-2xl">🤟</span>
                <div>
                  <h1 className="text-xl font-bold">SignTube</h1>
                  <p className="text-xs text-blue-100">Ghana Sign Language</p>
                </div>
              </a>
            </div>

            <div className="flex items-center gap-4">
              <a
                href="/contribute"
                className="hidden sm:flex items-center gap-2 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <span>+</span>
                <span>Contribute</span>
              </a>
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2">
            {/* Tab Navigation */}
            <FeedTabs activeTab={activeTab} onTabChange={handleTabChange} />

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-700">{error}</p>
                <button
                  onClick={() => fetchFeed(activeTab)}
                  className="text-red-600 underline mt-2"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-1/4" />
                      </div>
                    </div>
                    <div className="h-48 bg-gray-200 rounded mb-3" />
                    <div className="flex gap-4">
                      <div className="h-8 bg-gray-200 rounded w-20" />
                      <div className="h-8 bg-gray-200 rounded w-20" />
                    </div>
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

                {/* Load More */}
                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="w-full py-3 bg-white hover:bg-gray-50 text-[#00549F] font-medium rounded-lg border border-gray-200 transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </button>
                )}
              </div>
            )}

            {/* Empty State */}
            {!loading && items.length === 0 && !error && (
              <div className="bg-white rounded-lg p-8 text-center">
                <div className="text-5xl mb-4">
                  {activeTab === 'gold' ? '🏆' : activeTab === 'needs_review' ? '👀' : '📭'}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {activeTab === 'gold'
                    ? 'No gold standard contributions yet'
                    : activeTab === 'needs_review'
                    ? 'No contributions need review'
                    : 'No contributions yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  Be the first to contribute a sign!
                </p>
                <a
                  href="/contribute"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                >
                  Start Contributing
                </a>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Stats Card */}
            {stats && <FeedStats stats={stats} />}

            {/* CTA Card */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-6 text-white">
              <h3 className="font-bold text-lg mb-2">Help Build GSL</h3>
              <p className="text-sm text-green-100 mb-4">
                Your contributions help teach AI to recognize Ghana Sign Language
              </p>
              <a
                href="/contribute"
                className="block w-full py-2 bg-white text-green-600 font-medium rounded-lg text-center hover:bg-green-50 transition-colors"
              >
                Record a Sign
              </a>
            </div>

            {/* Info Card */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-3">How Voting Works</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">▲</span>
                  <span>Upvote accurate, clear signs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">▼</span>
                  <span>Downvote incorrect or unclear signs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">🏆</span>
                  <span>Top voted become Gold Standard</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
