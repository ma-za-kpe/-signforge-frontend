'use client';

/**
 * SignTube Leaderboard Page
 * Shows top contributors ranked by reputation score
 */
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { LeaderboardCard } from '@/components/reputation/LeaderboardCard';
import { UserButton } from '@/components/auth/UserButton';

type LeaderboardPeriod = 'all' | 'weekly';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  score: number;
  level: string;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  period: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [period, setPeriod] = useState<LeaderboardPeriod>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_URL}/api/leaderboard?period=${period}&limit=50`);
        if (!res.ok) throw new Error('Failed to fetch leaderboard');

        const data: LeaderboardResponse = await res.json();
        setEntries(data.leaderboard);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [period]);

  const currentUserId = session?.user?.email || session?.user?.name;

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
                  <p className="text-xs text-blue-100">Leaderboard</p>
                </div>
              </a>
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Top Contributors</h1>
          <p className="text-gray-600">
            Recognizing those who help build Ghana Sign Language
          </p>
        </div>

        {/* Period Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            <button
              onClick={() => setPeriod('all')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                period === 'all'
                  ? 'bg-[#00549F] text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                period === 'weekly'
                  ? 'bg-[#00549F] text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              This Week
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-center">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-gray-200 rounded" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard */}
        {!loading && entries.length > 0 && (
          <div className="space-y-3">
            {entries.map(entry => (
              <LeaderboardCard
                key={entry.user_id}
                entry={entry}
                isCurrentUser={currentUserId === entry.user_id}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && entries.length === 0 && !error && (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="text-5xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {period === 'weekly'
                ? 'No activity this week yet'
                : 'No contributors yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              Be the first to earn reputation points!
            </p>
            <a
              href="/contribute"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
            >
              Start Contributing
            </a>
          </div>
        )}

        {/* Level Legend */}
        <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4">Reputation Levels</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: 'Newcomer', points: '0-49', color: 'bg-gray-100 text-gray-700' },
              { name: 'Learner', points: '50-199', color: 'bg-green-100 text-green-700' },
              { name: 'Contributor', points: '200-499', color: 'bg-blue-100 text-blue-700' },
              { name: 'Skilled', points: '500-999', color: 'bg-purple-100 text-purple-700' },
              { name: 'Expert', points: '1,000-2,499', color: 'bg-orange-100 text-orange-700' },
              { name: 'Master', points: '2,500-4,999', color: 'bg-red-100 text-red-700' },
              { name: 'Legend', points: '5,000+', color: 'bg-yellow-100 text-yellow-700' },
            ].map(level => (
              <div key={level.name} className="text-center p-2">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${level.color}`}>
                  {level.name}
                </span>
                <div className="text-xs text-gray-500 mt-1">{level.points} pts</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
