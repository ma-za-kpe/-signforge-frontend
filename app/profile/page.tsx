'use client';

/**
 * User Profile Page
 * Shows and allows editing of the current user's profile
 * Creates user in backend on first login
 */
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserButton } from '@/components/auth/UserButton';
import { ReputationCard } from '@/components/reputation/ReputationCard';
import { BadgeDisplay } from '@/components/reputation/BadgeDisplay';
import { Save, User, MapPin, Heart, Languages } from 'lucide-react';

interface UserProfile {
  id: number;
  user_id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_deaf: boolean;
  preferred_sign_language: string | null;
  country: string | null;
  region: string | null;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
  reputation_score: number;
  reputation_level: string;
  contribution_count: number;
  badge_count: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

const SIGN_LANGUAGES = [
  { code: 'GHSL', name: 'Ghanaian Sign Language' },
  { code: 'ASL', name: 'American Sign Language' },
  { code: 'BSL', name: 'British Sign Language' },
  { code: 'ISL', name: 'International Sign' },
  { code: 'OTHER', name: 'Other' },
];

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central',
  'Northern', 'Volta', 'Upper East', 'Upper West', 'Brong-Ahafo',
  'Western North', 'Ahafo', 'Bono East', 'Oti', 'North East', 'Savannah'
];

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isDeaf, setIsDeaf] = useState(false);
  const [signLanguage, setSignLanguage] = useState('');
  const [region, setRegion] = useState('');

  // Create or get user profile on mount
  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.email) {
      router.push('/auth/signin?callbackUrl=/profile');
      return;
    }

    const createOrGetUser = async () => {
      setLoading(true);
      setError(null);

      try {
        // Create/update user in backend
        const createRes = await fetch(`${API_URL}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: session.user.email,
            email: session.user.email,
            display_name: session.user.name,
            avatar_url: session.user.image,
          }),
        });

        if (!createRes.ok) {
          throw new Error('Failed to create/get user profile');
        }

        const userData: UserProfile = await createRes.json();
        setProfile(userData);

        // Initialize form fields
        setUsername(userData.username || '');
        setDisplayName(userData.display_name || session.user.name || '');
        setBio(userData.bio || '');
        setIsDeaf(userData.is_deaf || false);
        setSignLanguage(userData.preferred_sign_language || '');
        setRegion(userData.region || '');

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    createOrGetUser();
  }, [session, status, router]);

  const handleSave = async () => {
    if (!session?.user?.email) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': session.user.email,
        },
        body: JSON.stringify({
          username: username || null,
          display_name: displayName || null,
          bio: bio || null,
          is_deaf: isDeaf,
          preferred_sign_language: signLanguage || null,
          region: region || null,
          country: 'Ghana',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to update profile');
      }

      const updatedProfile = await res.json();
      setProfile(updatedProfile);
      setSuccess('Profile updated successfully!');

      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00549F]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#00549F] to-[#00A2E5] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" className="flex items-center gap-2">
                <span className="text-2xl">&#129295;</span>
                <div>
                  <h1 className="text-xl font-bold">SignTube</h1>
                  <p className="text-xs text-blue-100">My Profile</p>
                </div>
              </a>
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center gap-4">
                {(profile?.avatar_url || session?.user?.image) ? (
                  <img
                    src={profile?.avatar_url || session?.user?.image || ''}
                    alt="Profile"
                    className="w-20 h-20 rounded-full border-4 border-[#00549F]"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00549F] to-[#00A2E5] flex items-center justify-center text-white text-3xl font-bold">
                    {(profile?.display_name || displayName)?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {profile?.display_name || displayName || session?.user?.name || 'Your Name'}
                  </h2>
                  <p className="text-gray-500">{profile?.email || session?.user?.email}</p>
                  {profile?.username ? (
                    <p className="text-[#00549F] font-medium">@{profile.username}</p>
                  ) : (
                    <p className="text-gray-400 text-sm italic">Set your username below</p>
                  )}
                </div>
              </div>
            </div>

            {/* Edit Profile Form */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Edit Profile
              </h3>

              <div className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="Choose a unique username"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00549F] focus:border-transparent"
                    maxLength={30}
                  />
                  <p className="text-xs text-gray-500 mt-1">3-30 characters, letters, numbers, underscores only</p>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00549F] focus:border-transparent"
                    maxLength={100}
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00549F] focus:border-transparent"
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">{bio.length}/500 characters</p>
                </div>
              </div>
            </div>

            {/* Accessibility & Preferences */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Accessibility & Preferences
              </h3>

              <div className="space-y-4">
                {/* Deaf Identifier */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isDeaf"
                    checked={isDeaf}
                    onChange={(e) => setIsDeaf(e.target.checked)}
                    className="w-5 h-5 text-[#00549F] rounded focus:ring-[#00549F]"
                  />
                  <label htmlFor="isDeaf" className="text-gray-700">
                    I am Deaf or hard of hearing
                  </label>
                </div>

                {/* Sign Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Languages className="w-4 h-4" />
                    Preferred Sign Language
                  </label>
                  <select
                    value={signLanguage}
                    onChange={(e) => setSignLanguage(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00549F] focus:border-transparent"
                  >
                    <option value="">Select...</option>
                    {SIGN_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Region */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Region (Ghana)
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00549F] focus:border-transparent"
                  >
                    <option value="">Select your region...</option>
                    {GHANA_REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-[#00549F] hover:bg-[#003d75] text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

          {/* Sidebar - Stats */}
          <div className="lg:col-span-1 space-y-4">
            {/* Reputation Card */}
            {profile && (
              <ReputationCard
                reputation={{
                  user_id: profile.user_id,
                  reputation_score: profile.reputation_score,
                  reputation_level: profile.reputation_level,
                  badges: [],
                }}
              />
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Your Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Contributions</span>
                  <span className="font-bold text-gray-900">{profile?.contribution_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Badges</span>
                  <span className="font-bold text-gray-900">{profile?.badge_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reputation</span>
                  <span className="font-bold text-[#00549F]">{profile?.reputation_score || 0}</span>
                </div>
              </div>
            </div>

            {/* Member Since */}
            {profile?.created_at && (
              <div className="bg-white rounded-lg p-6 text-center">
                <p className="text-gray-500 text-sm">Member since</p>
                <p className="font-semibold text-gray-900">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
