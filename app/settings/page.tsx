'use client';

/**
 * Settings Page
 * App preferences and account settings - persisted to backend
 */
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserButton } from '@/components/auth/UserButton';
import {
  Bell,
  Moon,
  Globe,
  Shield,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Save,
  Loader2
} from 'lucide-react';

interface Settings {
  id: number;
  user_id: string;
  notify_new_contributions: boolean;
  notify_weekly_digest: boolean;
  notify_community_updates: boolean;
  dark_mode: boolean;
  language: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load settings from backend
  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.email) {
      router.push('/auth/signin?callbackUrl=/settings');
      return;
    }

    const fetchSettings = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_URL}/api/settings`, {
          headers: {
            'X-User-Id': session.user.email || '',
          },
        });

        if (!res.ok) {
          throw new Error('Failed to load settings');
        }

        const data = await res.json();
        setSettings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [session, status, router]);

  // Save settings to backend
  const saveSettings = async (updates: Partial<Settings>) => {
    if (!session?.user?.email) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': session.user.email,
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error('Failed to save settings');
      }

      const data = await res.json();
      setSettings(data);
      setSuccess('Settings saved!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Handle toggle changes
  const handleToggle = (field: keyof Settings, value: boolean) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
    saveSettings({ [field]: value });
  };

  // Handle language change
  const handleLanguageChange = (value: string) => {
    if (!settings) return;
    setSettings({ ...settings, language: value });
    saveSettings({ language: value });
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
                  <p className="text-xs text-blue-100">Settings</p>
                </div>
              </a>
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back Link */}
        <a
          href="/profile"
          className="inline-flex items-center gap-2 text-[#00549F] hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </a>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center gap-2">
            <Save className="w-4 h-4 text-green-600" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Saving Indicator */}
        {saving && (
          <div className="fixed top-20 right-4 bg-white shadow-lg rounded-lg px-4 py-2 flex items-center gap-2 z-50">
            <Loader2 className="w-4 h-4 animate-spin text-[#00549F]" />
            <span className="text-sm text-gray-600">Saving...</span>
          </div>
        )}

        {/* Notifications Section */}
        <div className="bg-white rounded-lg p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </h2>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-gray-900">New Contributions</p>
                <p className="text-sm text-gray-500">Get notified when someone contributes a sign you requested</p>
              </div>
              <input
                type="checkbox"
                checked={settings?.notify_new_contributions ?? true}
                onChange={(e) => handleToggle('notify_new_contributions', e.target.checked)}
                className="w-5 h-5 text-[#00549F] rounded focus:ring-[#00549F]"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-gray-900">Weekly Digest</p>
                <p className="text-sm text-gray-500">Receive a weekly summary of SignTube activity</p>
              </div>
              <input
                type="checkbox"
                checked={settings?.notify_weekly_digest ?? false}
                onChange={(e) => handleToggle('notify_weekly_digest', e.target.checked)}
                className="w-5 h-5 text-[#00549F] rounded focus:ring-[#00549F]"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-gray-900">Community Updates</p>
                <p className="text-sm text-gray-500">Important updates about the SignTube community</p>
              </div>
              <input
                type="checkbox"
                checked={settings?.notify_community_updates ?? true}
                onChange={(e) => handleToggle('notify_community_updates', e.target.checked)}
                className="w-5 h-5 text-[#00549F] rounded focus:ring-[#00549F]"
              />
            </label>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-white rounded-lg p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Moon className="w-5 h-5" />
            Appearance
          </h2>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">Dark Mode</p>
              <p className="text-sm text-gray-500">Use dark theme throughout the app</p>
            </div>
            <input
              type="checkbox"
              checked={settings?.dark_mode ?? false}
              onChange={(e) => handleToggle('dark_mode', e.target.checked)}
              className="w-5 h-5 text-[#00549F] rounded focus:ring-[#00549F]"
            />
          </label>
          <p className="text-xs text-gray-400 mt-2">Dark mode styling coming soon - setting saved</p>
        </div>

        {/* Language Section */}
        <div className="bg-white rounded-lg p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Language
          </h2>

          <select
            value={settings?.language ?? 'en'}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00549F] focus:border-transparent"
          >
            <option value="en">English</option>
            <option value="tw">Twi</option>
            <option value="ga">Ga</option>
            <option value="ee">Ewe</option>
          </select>
          <p className="text-xs text-gray-400 mt-2">Multi-language UI coming soon - preference saved</p>
        </div>

        {/* Privacy Section */}
        <div className="bg-white rounded-lg p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy
          </h2>

          <a
            href="/profile"
            className="flex items-center justify-between py-2 text-gray-700 hover:text-[#00549F]"
          >
            <span>Edit Profile Privacy</span>
            <ChevronRight className="w-5 h-5" />
          </a>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg p-6 border border-red-200">
          <h2 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Danger Zone
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Delete Account</p>
                <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
              </div>
              <button
                className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                onClick={() => alert('Account deletion is not yet implemented. Contact support for assistance.')}
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Auto-save Note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Settings are saved automatically when you make changes
        </p>
      </div>
    </div>
  );
}
