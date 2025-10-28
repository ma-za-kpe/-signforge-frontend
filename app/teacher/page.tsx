'use client';

/**
 * AGENT 1: TEACHER UI
 * Canva-like lesson editor for creating inclusive lessons
 *
 * Features:
 * - Type lesson content
 * - Real-time sign preview
 * - One-click format generation (QR, Audio, PDF, Haptic)
 * - Lesson bundle export
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PreviewModal from '@/components/PreviewModal';
import MissingWordsPanel from '@/components/MissingWordsPanel';

interface Word {
  text: string;
  hasSign: boolean;
  signImage?: string;
}

interface GeneratedFormat {
  qr_code?: any;
  audio?: any;
  haptic?: any;
  pdf?: any;
}

export default function TeacherPage() {
  const router = useRouter();
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingFormats, setGeneratingFormats] = useState(false);
  const [formats, setFormats] = useState<GeneratedFormat | null>(null);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [missingWords, setMissingWords] = useState<any>(null);

  // API URL from environment variable
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

  // Extract words from lesson content and check if they have signs
  // NOW USES: /api/extract-and-normalize for phrase normalization
  useEffect(() => {
    const extractWords = async () => {
      if (!lessonContent.trim()) {
        setWords([]);
        return;
      }

      try {
        // Call new backend endpoint that handles phrase normalization
        const response = await fetch(`${API_URL}/api/extract-and-normalize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: lessonContent })
        });

        if (response.ok) {
          const data = await response.json();

          // Convert to our Word format
          const wordResults = data.words
            .filter((w: any) => w.hasSign)  // Only show words with signs
            .map((w: any) => ({
              text: w.normalized || w.original,  // Use normalized word for generation
              hasSign: true,
              signImage: w.signImage,
              originalText: w.original,  // Keep original for display
              isPhrase: w.phrase,
              isAlternative: w.alternative,
              reason: w.reason
            }));

          setWords(wordResults);
        }
      } catch (error) {
        console.error('Failed to extract words:', error);
      }
    };

    // Reduced debounce from 500ms to 200ms for faster response
    const debounceTimer = setTimeout(extractWords, 200);
    return () => clearTimeout(debounceTimer);
  }, [lessonContent]);

  const handleGenerateFormats = async () => {
    if (selectedWords.length === 0) {
      alert('Please select at least one word to generate formats');
      return;
    }

    setGeneratingFormats(true);

    try {
      // Use new temp storage endpoint
      const response = await fetch(`${API_URL}/api/temp/create-lesson`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_title: lessonTitle || 'My Lesson',
          words: selectedWords,
          find_missing: true  // Auto-search for missing words
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session_id);
        setMissingWords(data.missing_words);
        setShowPreview(true);

        // Show missing words info if any
        if (data.missing_words && data.missing_words.summary.not_found > 0) {
          console.log(`ℹ️ ${data.missing_words.summary.not_found} words without signs were searched online`);
        }
      } else {
        alert('Failed to generate formats');
      }
    } catch (error) {
      alert('Error generating formats: ' + error);
    } finally {
      setGeneratingFormats(false);
    }
  };

  const toggleWordSelection = (word: string) => {
    setSelectedWords(prev =>
      prev.includes(word)
        ? prev.filter(w => w !== word)
        : [...prev, word]
    );
  };

  const selectAllWords = () => {
    const signWords = words.filter(w => w.hasSign).map(w => w.text);
    setSelectedWords(signWords);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#00549F] to-[#00A2E5] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                📚 Teacher Lesson Editor
              </h1>
              <p className="text-sm mt-1 text-blue-100">
                Create inclusive lessons automatically • Agent 1: Teacher UI
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-white text-[#00549F] rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              ← Back to Dictionary
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left Panel: Lesson Editor */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-[#00549F] mb-4">
                ✏️ Create Your Lesson
              </h2>

              {/* Lesson Title */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lesson Title
                </label>
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="e.g., Farm Animals, Colors, Numbers..."
                  className="w-full px-4 py-3 text-gray-900 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00A2E5] focus:border-[#00A2E5] outline-none"
                />
              </div>

              {/* Lesson Content */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lesson Content
                </label>
                <textarea
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  placeholder="Type your lesson here... e.g., 'Today we learn about farm animals. The cow eats grass. The goat lives in the barn...'"
                  rows={10}
                  className="w-full px-4 py-3 text-gray-900 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00A2E5] focus:border-[#00A2E5] outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{lessonContent.length} characters</span>
                <span>{words.filter(w => w.hasSign).length} signs available</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gradient-to-br from-[#E6F7FF] to-white border-2 border-[#00A2E5]/20 rounded-xl p-6">
              <h3 className="font-semibold text-[#00549F] mb-3">📖 How it works:</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
                <li>Type your lesson content above</li>
                <li>System automatically finds words with signs</li>
                <li>Select which words to include</li>
                <li>Click "Generate All Formats" to create:
                  <ul className="list-disc list-inside ml-6 mt-1 text-xs">
                    <li>QR codes (offline access)</li>
                    <li>Twi audio (local language)</li>
                    <li>PDF worksheet (printable)</li>
                    <li>Haptic patterns (deaf-blind)</li>
                  </ul>
                </li>
              </ol>
            </div>
          </div>

          {/* Right Panel: Sign Preview & Format Generation */}
          <div className="space-y-6">
            {/* Available Signs */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[#00549F]">
                  🤟 Available Signs
                </h2>
                {words.filter(w => w.hasSign).length > 0 && (
                  <button
                    onClick={selectAllWords}
                    className="px-3 py-1 text-sm bg-[#00A2E5] text-white rounded-lg hover:bg-[#0089C2] transition-colors"
                  >
                    Select All
                  </button>
                )}
              </div>

              {words.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-6xl mb-4">✍️</div>
                  <p>Start typing your lesson to see available signs</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {words.filter(w => w.hasSign).map((word, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleWordSelection(word.text)}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedWords.includes(word.text)
                          ? 'border-[#00A2E5] bg-[#E6F7FF]'
                          : 'border-gray-200 hover:border-[#00A2E5]/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedWords.includes(word.text)}
                          onChange={() => {}}
                          className="w-5 h-5 text-[#00A2E5] rounded focus:ring-[#00A2E5]"
                        />
                        <div>
                          <div className="font-semibold text-gray-900 capitalize">
                            {word.text}
                          </div>
                          <div className="text-xs text-gray-500">
                            ✅ Sign available
                          </div>
                        </div>
                      </div>
                      {word.signImage && (
                        <img
                          src={`${API_URL}${word.signImage}`}
                          alt={word.text}
                          className="w-16 h-16 object-contain rounded border border-gray-200"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {words.filter(w => !w.hasSign).length > 0 && (
                <details className="mt-4">
                  <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                    {words.filter(w => !w.hasSign).length} words without signs
                  </summary>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {words.filter(w => !w.hasSign).map((word, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                      >
                        {word.text}
                      </span>
                    ))}
                  </div>
                </details>
              )}
            </div>

            {/* Generate Formats Button */}
            {selectedWords.length > 0 && (
              <div className="bg-gradient-to-r from-[#00549F] to-[#00A2E5] rounded-xl shadow-lg p-6 text-white">
                <h3 className="text-xl font-bold mb-3">
                  🎨 Ready to Generate Formats
                </h3>
                <p className="text-sm text-blue-100 mb-4">
                  Selected {selectedWords.length} sign{selectedWords.length !== 1 ? 's' : ''} for format generation
                </p>
                <button
                  onClick={handleGenerateFormats}
                  disabled={generatingFormats}
                  className="w-full px-6 py-4 bg-white text-[#00549F] font-bold rounded-lg hover:bg-blue-50 disabled:bg-gray-300 disabled:text-gray-500 transition-all shadow-lg text-lg"
                >
                  {generatingFormats ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Formats...
                    </span>
                  ) : (
                    '✨ Generate All Formats (QR + Audio + PDF + Haptic)'
                  )}
                </button>
                <div className="mt-3 text-xs text-blue-100 text-center">
                  This will create {selectedWords.length} QR codes, {selectedWords.length} audio files,
                  {selectedWords.length} haptic patterns, and 1 PDF worksheet
                </div>
              </div>
            )}

            {/* Format Results */}
            {formats && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-[#00549F] mb-4">
                  ✅ Formats Generated!
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <span className="font-semibold text-green-800">QR Codes</span>
                    <span className="text-green-600">{selectedWords.length} files</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="font-semibold text-blue-800">Twi Audio</span>
                    <span className="text-blue-600">{selectedWords.length} files</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <span className="font-semibold text-purple-800">Haptic Patterns</span>
                    <span className="text-purple-600">{selectedWords.length} files</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <span className="font-semibold text-orange-800">PDF Worksheet</span>
                    <span className="text-orange-600">1 file</span>
                  </div>
                </div>
                <div className="mt-4 text-center text-sm text-gray-600">
                  Files saved to: /ghsl_brain/generated_formats/
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Missing Words Tracker - Full Width at Bottom */}
        <div className="mt-8">
          <MissingWordsPanel />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-gradient-to-r from-[#00549F] to-[#00A2E5]">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <p className="text-sm text-white font-medium">
              Agent 1: Teacher UI • Automatic Universal Design • SignForge 2025
            </p>
          </div>
        </div>
      </footer>

      {/* Preview Modal */}
      {showPreview && sessionId && (
        <PreviewModal
          sessionId={sessionId}
          onClose={() => setShowPreview(false)}
          onDownload={() => {
            // Refresh or show success message
            alert('✅ Lesson saved to permanent storage!');
          }}
        />
      )}
    </div>
  );
}
