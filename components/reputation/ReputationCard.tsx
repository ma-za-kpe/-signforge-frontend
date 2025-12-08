'use client';

/**
 * ReputationCard Component
 * Shows user reputation score and level progress
 */

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

interface ReputationCardProps {
  reputation: ReputationData;
}

const LEVEL_THRESHOLDS = [
  { name: 'newcomer', min: 0, max: 49 },
  { name: 'learner', min: 50, max: 199 },
  { name: 'contributor', min: 200, max: 499 },
  { name: 'skilled', min: 500, max: 999 },
  { name: 'expert', min: 1000, max: 2499 },
  { name: 'master', min: 2500, max: 4999 },
  { name: 'legend', min: 5000, max: Infinity },
];

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  newcomer: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  learner: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  contributor: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  skilled: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  expert: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  master: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  legend: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-400' },
};

export function ReputationCard({ reputation }: ReputationCardProps) {
  const currentLevel = LEVEL_THRESHOLDS.find(l => l.name === reputation.reputation_level) || LEVEL_THRESHOLDS[0];
  const nextLevel = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.indexOf(currentLevel) + 1];

  const levelColors = LEVEL_COLORS[reputation.reputation_level] || LEVEL_COLORS.newcomer;

  // Calculate progress to next level
  let progressPercent = 100;
  let pointsToNext = 0;

  if (nextLevel) {
    const levelRange = nextLevel.min - currentLevel.min;
    const pointsInLevel = reputation.reputation_score - currentLevel.min;
    progressPercent = Math.min(100, Math.round((pointsInLevel / levelRange) * 100));
    pointsToNext = nextLevel.min - reputation.reputation_score;
  }

  return (
    <div className={`rounded-lg border-2 p-6 ${levelColors.bg} ${levelColors.border}`}>
      {/* Score & Level */}
      <div className="text-center mb-4">
        <div className="text-4xl font-bold text-gray-900 mb-1">
          {reputation.reputation_score.toLocaleString()}
        </div>
        <div className="text-sm text-gray-600">reputation points</div>
        <div className={`inline-block mt-2 px-4 py-1 rounded-full text-sm font-semibold capitalize ${levelColors.bg} ${levelColors.text} border ${levelColors.border}`}>
          {reputation.reputation_level}
        </div>
      </div>

      {/* Progress Bar */}
      {nextLevel && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{currentLevel.name}</span>
            <span>{nextLevel.name}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00549F] to-[#00A2E5] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-center text-xs text-gray-500 mt-2">
            {pointsToNext.toLocaleString()} points to {nextLevel.name}
          </div>
        </div>
      )}

      {/* Max Level Badge */}
      {!nextLevel && (
        <div className="mt-4 text-center">
          <span className="text-2xl">👑</span>
          <div className="text-sm text-gray-600 mt-1">Maximum level reached!</div>
        </div>
      )}

      {/* Badge Count */}
      <div className="mt-4 pt-4 border-t border-gray-200/50 text-center">
        <span className="text-lg mr-1">🏅</span>
        <span className="text-gray-700">
          {reputation.badges.length} badge{reputation.badges.length !== 1 ? 's' : ''} earned
        </span>
      </div>
    </div>
  );
}
