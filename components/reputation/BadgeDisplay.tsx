'use client';

/**
 * BadgeDisplay Component
 * Shows earned badges for a user
 */

interface Badge {
  badge_id: string;
  name: string;
  icon: string | null;
  category: string;
  earned_at: string | null;
}

interface BadgeDisplayProps {
  badges: Badge[];
  compact?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  contribution: 'bg-green-100 border-green-300',
  community: 'bg-blue-100 border-blue-300',
  quality: 'bg-purple-100 border-purple-300',
  special: 'bg-yellow-100 border-yellow-300',
  test: 'bg-gray-100 border-gray-300',
};

export function BadgeDisplay({ badges, compact = false }: BadgeDisplayProps) {
  if (badges.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <span className="text-2xl mb-2 block">🎖️</span>
        <p className="text-sm">No badges earned yet</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {badges.slice(0, 5).map(badge => (
          <span
            key={badge.badge_id}
            className="text-lg"
            title={badge.name}
          >
            {badge.icon || '🏅'}
          </span>
        ))}
        {badges.length > 5 && (
          <span className="text-sm text-gray-500 ml-1">
            +{badges.length - 5}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {badges.map(badge => (
        <div
          key={badge.badge_id}
          className={`p-3 rounded-lg border-2 text-center ${
            CATEGORY_COLORS[badge.category] || CATEGORY_COLORS.special
          }`}
        >
          <div className="text-3xl mb-2">{badge.icon || '🏅'}</div>
          <div className="font-medium text-gray-800 text-sm">{badge.name}</div>
          {badge.earned_at && (
            <div className="text-xs text-gray-500 mt-1">
              {new Date(badge.earned_at).toLocaleDateString()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
