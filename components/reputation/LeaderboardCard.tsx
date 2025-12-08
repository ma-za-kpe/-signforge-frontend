'use client';

/**
 * LeaderboardCard Component
 * Displays a single user in the leaderboard
 */

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  score: number;
  level: string;
}

interface LeaderboardCardProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
}

const LEVEL_COLORS: Record<string, string> = {
  newcomer: 'bg-gray-100 text-gray-700',
  learner: 'bg-green-100 text-green-700',
  contributor: 'bg-blue-100 text-blue-700',
  skilled: 'bg-purple-100 text-purple-700',
  expert: 'bg-orange-100 text-orange-700',
  master: 'bg-red-100 text-red-700',
  legend: 'bg-yellow-100 text-yellow-700',
};

const RANK_BADGES: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export function LeaderboardCard({ entry, isCurrentUser }: LeaderboardCardProps) {
  const displayName = entry.user_id.length > 20
    ? entry.user_id.substring(0, 17) + '...'
    : entry.user_id;

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
        isCurrentUser
          ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-300'
          : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}
    >
      {/* Rank */}
      <div className="w-12 text-center">
        {RANK_BADGES[entry.rank] ? (
          <span className="text-2xl">{RANK_BADGES[entry.rank]}</span>
        ) : (
          <span className="text-xl font-bold text-gray-500">#{entry.rank}</span>
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <a
            href={`/u/${entry.user_id}`}
            className="font-semibold text-gray-900 hover:text-[#00549F] truncate"
          >
            {displayName}
          </a>
          {isCurrentUser && (
            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
              You
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-xs px-2 py-0.5 rounded-full capitalize ${
              LEVEL_COLORS[entry.level] || LEVEL_COLORS.newcomer
            }`}
          >
            {entry.level}
          </span>
        </div>
      </div>

      {/* Score */}
      <div className="text-right">
        <div className="text-lg font-bold text-[#00549F]">
          {entry.score.toLocaleString()}
        </div>
        <div className="text-xs text-gray-500">points</div>
      </div>
    </div>
  );
}
