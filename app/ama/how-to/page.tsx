'use client'

import React from 'react'
import { Book, CheckCircle, Search, Eye, Lock, Unlock, BarChart3, Users, TrendingUp, Download } from 'lucide-react'
import Link from 'next/link'

export default function AdminHowToGuide() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Book className="w-12 h-12 text-blue-600" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard Guide</h1>
              <p className="text-gray-600 mt-1">Complete guide to managing SignForge contributions</p>
            </div>
          </div>
          <Link
            href="/ama"
            className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Table of Contents */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Navigation</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <a href="#overview" className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">System Overview</span>
            </a>
            <a href="#words" className="flex items-center gap-2 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition">
              <Lock className="w-5 h-5 text-green-600" />
              <span className="font-semibold">Word Management</span>
            </a>
            <a href="#contributions" className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="font-semibold">Contributions</span>
            </a>
            <a href="#analytics" className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <span className="font-semibold">Analytics</span>
            </a>
          </div>
        </div>

        {/* System Overview Section */}
        <div id="overview" className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            System Overview Tab
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">What You'll See</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Total Words:</strong> Number of words in the dictionary (1,527 words)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Total Contributions:</strong> All sign language videos submitted</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Unique Contributors:</strong> Number of different users who submitted</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Average Quality:</strong> Overall quality score (70%+ is good)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Words Ready for Training:</strong> Words with 50 contributions</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <p className="text-sm text-blue-900">
                <strong>💡 Tip:</strong> Use this tab to get a quick health check of the system. If average quality drops below 70%, you may need to provide better instructions to contributors.
              </p>
            </div>
          </div>
        </div>

        {/* Word Management Section */}
        <div id="words" className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Lock className="w-8 h-8 text-green-600" />
            Word Management Tab
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Opening Words for Contributions</h3>
              <ol className="space-y-3 text-gray-700 list-decimal list-inside">
                <li>Navigate to the <strong>Words</strong> tab</li>
                <li>Use the search bar to find specific words</li>
                <li>Find a word with "Closed" status (red badge)</li>
                <li>Click the <strong>Open</strong> button (green button)</li>
                <li>The word will now accept contributions from users</li>
              </ol>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Closing Words</h3>
              <ol className="space-y-3 text-gray-700 list-decimal list-inside">
                <li>Find an open word (green "Open" badge)</li>
                <li>Click the <strong>Close</strong> button (red button)</li>
                <li>Contributors will no longer see this word as an option</li>
              </ol>
            </div>

            <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded">
              <p className="text-sm text-green-900">
                <strong>⚡ Auto-Close Feature:</strong> Words automatically close when they reach 50 contributions. You don't need to manually close them!
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Using Search</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <Search className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
                  <span>Type any word in the search box at the top</span>
                </li>
                <li className="flex items-start gap-2">
                  <Search className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
                  <span>Results filter instantly as you type</span>
                </li>
                <li className="flex items-start gap-2">
                  <Search className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
                  <span>Click the X button to clear search</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Viewing Word Details</h3>
              <ol className="space-y-3 text-gray-700 list-decimal list-inside">
                <li>Click on any word row in the table</li>
                <li>A detailed modal will appear showing:
                  <ul className="ml-8 mt-2 space-y-1">
                    <li>• Total contributions received</li>
                    <li>• Quality score range (min to max)</li>
                    <li>• Number of unique contributors</li>
                    <li>• Training readiness status</li>
                    <li>• Last contribution timestamp</li>
                  </ul>
                </li>
                <li>You can also open/close the word directly from the modal</li>
              </ol>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Understanding Status Indicators</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">Open</span>
                  <span className="text-gray-700">Word is accepting contributions</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">Closed</span>
                  <span className="text-gray-700">Word is not accepting contributions</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">Complete</span>
                  <span className="text-gray-700">Word has 50 contributions and is ready for training</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Pagination</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• 10 words displayed per page</li>
                <li>• Use "Previous" and "Next" buttons to navigate</li>
                <li>• Click page numbers to jump to a specific page</li>
                <li>• Page info shows "Showing X to Y of Z words"</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contributions Section */}
        <div id="contributions" className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-600" />
            Contributions Tab
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">What You Can Do</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <Eye className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <span>View all submitted contributions in chronological order</span>
                </li>
                <li className="flex items-start gap-2">
                  <Eye className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <span>See contributor IDs, quality scores, and timestamps</span>
                </li>
                <li className="flex items-start gap-2">
                  <Eye className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <span>Check frame counts and duration of each video</span>
                </li>
                <li className="flex items-start gap-2">
                  <Eye className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <span>Monitor hand detection (left, right, or both hands)</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Quality Scores Explained</h3>
              <div className="space-y-3">
                <div className="p-3 bg-red-50 rounded border-l-4 border-red-500">
                  <strong className="text-red-900">Below 60%:</strong>
                  <p className="text-red-800 text-sm mt-1">Rejected - Did not meet minimum quality threshold</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-500">
                  <strong className="text-yellow-900">60-70%:</strong>
                  <p className="text-yellow-800 text-sm mt-1">Acceptable - Meets minimum requirements</p>
                </div>
                <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
                  <strong className="text-green-900">70-85%:</strong>
                  <p className="text-green-800 text-sm mt-1">Good - Target quality range</p>
                </div>
                <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                  <strong className="text-blue-900">85%+:</strong>
                  <p className="text-blue-800 text-sm mt-1">Excellent - High-quality training data</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded">
              <p className="text-sm text-purple-900">
                <strong>🛡️ Quality Threshold:</strong> The system automatically rejects contributions below 60% quality with helpful feedback to users on how to improve.
              </p>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div id="analytics" className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-orange-600" />
            Analytics & Quality Tabs
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Analytics Features</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <BarChart3 className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <span><strong>Daily Trends:</strong> See contribution patterns over time</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <span><strong>Leaderboard:</strong> Top contributors ranked by submissions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Download className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <span><strong>Export Data:</strong> Download analytics as CSV for further analysis</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Quality Reports</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Quality distribution across all contributions</li>
                <li>• FPS (frames per second) analysis</li>
                <li>• Hand detection success rates</li>
                <li>• Data completeness scores</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">📋 Best Practices</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Word Management Strategy</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>Start with common, essential words (HELLO, THANK YOU, PLEASE)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>Open 10-20 words at a time to avoid overwhelming contributors</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>Monitor quality scores - if average drops below 70%, pause and investigate</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>Prioritize words that deaf community members request</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Quality Monitoring</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>Check contributions daily to ensure quality standards</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>If you see consistently low quality for a word, close it and provide better examples</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>Celebrate high-quality contributors on your social media</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Training Preparation</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>Once a word reaches 50 contributions (auto-closes), it's ready for AI training</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>Aim for at least 100 words completed before first training run</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>Ensure completed words have average quality above 70%</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">❓ Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Q: How many words should I open at once?</h3>
              <p className="text-gray-700 mt-2">A: Start with 10-20 common words. Monitor engagement before opening more.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800">Q: What if a word gets stuck at 40 contributions?</h3>
              <p className="text-gray-700 mt-2">A: Promote it on social media, share with deaf community groups, or run a contribution drive event.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800">Q: Can I reopen a completed word?</h3>
              <p className="text-gray-700 mt-2">A: Yes! Click "Open" on any word to accept more contributions. Useful if you want more diversity in training data.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800">Q: What does the quality score measure?</h3>
              <p className="text-gray-700 mt-2">A: Hand detection confidence, landmark consistency, movement smoothness, and frame completeness.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800">Q: How do I know if the system is healthy?</h3>
              <p className="text-gray-700 mt-2">A: Check the Overview tab. "EXCELLENT" or "GOOD" status means everything is working well.</p>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-blue-100 mb-6">Head to the dashboard and start managing contributions!</p>
          <Link
            href="/ama"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition text-lg"
          >
            Go to Admin Dashboard →
          </Link>
        </div>
      </div>
    </div>
  )
}
