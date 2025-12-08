'use client';

/**
 * User Profile Page
 * Shows user's reputation, badges, and contributions
 */
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ReputationCard } from '@/components/reputation/ReputationCard';
import { BadgeDisplay } from '@/components/reputation/BadgeDisplay';
import { ContributionCard } from '@/components/feed/ContributionCard';
import { UserButton } from '@/components/auth/UserButton';

interface ReputationData {
  user_id: string;
  reputation_score: number;
  reputation_level: string;
  badges: Array<{
    badge_id: string;
    name: string;
    icon: string | null;
    category: string;
    earned_at: string | null;
  }>;
}

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { data: session } = useSession();

  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [contributions, setContributions] = useState<ContributionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'contributions' | 'badges'>('contributions');
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = session?.user?.email === username || session?.user?.name === username;

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch reputation data
        const repRes = await fetch(`${API_URL}/api/reputation/${encodeURIComponent(username)}`);
        if (repRes.ok) {
          const repData = await repRes.json();
          setReputation(repData);
        }

        // Fetch user's contributions
        const contribRes = await fetch(`${API_URL}/api/feed?user_id=${encodeURIComponent(username)}&limit=20`);
        if (contribRes.ok) {
          const contribData = await contribRes.json();
          setContributions(contribData.items || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUserData();
    }
  }, [username]);

  const displayName = username.length > 30 ? username.substring(0, 27) + '...' : username;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#00549F] to-[#00A2E5] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/feed" className="flex items-center gap-2">
                <span className="text-2xl">🤟</span>
                <div>
                  <h1 className="text-xl font-bold">SignTube</h1>
                  <p className="text-xs text-blue-100">Profile</p>
                </div>
              </a>
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-center">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="animate-pulse space-y-6">
            <div className="bg-white rounded-lg p-6">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4" />
              <div className="h-20 bg-gray-200 rounded w-1/2 mx-auto" />
            </div>
            <div className="bg-white rounded-lg p-6">
              <div className="h-48 bg-gray-200 rounded" />
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* Profile Header */}
            <div className="bg-white rounded-lg p-6 mb-6 text-center">
              {/* Avatar placeholder */}
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#00549F] to-[#00A2E5] rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-1">{displayName}</h1>

              {isOwnProfile && (
                <span className="inline-block bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">
                  This is you!
                </span>
              )}

              {/* Quick Stats */}
              <div className="flex justify-center gap-8 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {reputation?.reputation_score.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-500">Reputation</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {contributions.length}
                  </div>
                  <div className="text-sm text-gray-500">Contributions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {reputation?.badges.length || 0}
                  </div>
                  <div className="text-sm text-gray-500">Badges</div>
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sidebar - Reputation Card */}
              <div className="lg:col-span-1">
                {reputation && <ReputationCard reputation={reputation} />}

                {/* Leaderboard Link */}
                <a
                  href="/leaderboard"
                  className="block mt-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-[#00549F] transition-colors text-center"
                >
                  <span className="text-lg mr-2">🏆</span>
                  <span className="text-gray-700 font-medium">View Leaderboard</span>
                </a>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200 mb-4 bg-white rounded-t-lg">
                  <button
                    onClick={() => setActiveTab('contributions')}
                    className={`flex-1 py-3 text-center font-medium transition-colors ${
                      activeTab === 'contributions'
                        ? 'text-[#00549F] border-b-2 border-[#00549F]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Contributions ({contributions.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('badges')}
                    className={`flex-1 py-3 text-center font-medium transition-colors ${
                      activeTab === 'badges'
                        ? 'text-[#00549F] border-b-2 border-[#00549F]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Badges ({reputation?.badges.length || 0})
                  </button>
                </div>

                {/* Contributions Tab */}
                {activeTab === 'contributions' && (
                  <div className="space-y-4">
                    {contributions.length > 0 ? (
                      contributions.map(item => (
                        <ContributionCard key={item.contribution_id} item={item} />
                      ))
                    ) : (
                      <div className="bg-white rounded-lg p-8 text-center">
                        <div className="text-4xl mb-3">📹</div>
                        <p className="text-gray-600">No contributions yet</p>
                        {isOwnProfile && (
                          <a
                            href="/contribute"
                            className="inline-block mt-4 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                          >
                            Make Your First Contribution
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Badges Tab */}
                {activeTab === 'badges' && (
                  <div className="bg-white rounded-lg p-6">
                    <BadgeDisplay badges={reputation?.badges || []} />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
