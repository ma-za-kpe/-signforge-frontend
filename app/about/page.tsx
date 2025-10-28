'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface PDFContent {
  cover_image: string;
  cover_text: string;
  page_2_image: string;
  page_2_text: string;
  page_3_image: string;
  page_3_text: string;
  messages: Array<{
    page: number;
    text: string;
    image: string;
  }>;
}

export default function AboutPage() {
  const [content, setContent] = useState<PDFContent | null>(null);

  useEffect(() => {
    fetch('/pdf_content/pdf_content.json')
      .then(res => res.json())
      .then(data => setContent(data))
      .catch(err => console.error('Failed to load content:', err));
  }, []);

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              About GHSL Dictionary
            </h1>
            <a
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              ← Back to Dictionary
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Cover Section */}
        <section className="mb-16">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="relative h-96">
              <Image
                src={`/pdf_content/${content.cover_image}`}
                alt="Ghanaian Sign Language Dictionary Cover"
                fill
                className="object-contain"
              />
            </div>
            <div className="p-8 text-center bg-gradient-to-r from-blue-600 to-purple-600">
              <h2 className="text-4xl font-bold text-white mb-2">
                {content.cover_text}
              </h2>
              <p className="text-blue-100 text-lg">
                Empowering communication through Ghana Sign Language
              </p>
            </div>
          </div>
        </section>

        {/* Message of Support */}
        {content.messages.map((message, index) => (
          <section key={message.page} className="mb-16">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4">
                <h2 className="text-2xl font-bold text-white">
                  {message.text.includes('FOREWORD') ? '📜 Foreword' : '💬 Message of Support'}
                </h2>
              </div>

              {message.text.includes('MESSAGE OF SUPPORT') ? (
                <div className="p-8">
                  <div className="prose prose-lg max-w-none">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Ghana National Association of the Deaf (GNAD)
                    </h3>

                    <div className="space-y-4 text-gray-700 leading-relaxed">
                      {message.text
                        .split('\n')
                        .filter(line => line.trim() && !line.includes('MESSAGE OF SUPPORT') && line !== 'VI')
                        .map((paragraph, i) => (
                          paragraph.includes('Juventus Duorinaah') ? (
                            <div key={i} className="mt-8 pt-6 border-t border-gray-200">
                              <p className="font-semibold text-gray-900">{paragraph}</p>
                              <p className="text-gray-600 italic">Executive Director</p>
                            </div>
                          ) : (
                            <p key={i}>{paragraph}</p>
                          )
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative h-96">
                  <Image
                    src={`/pdf_content/${message.image}`}
                    alt={`Page ${message.page}`}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
            </div>
          </section>
        ))}

        {/* Credits/Sponsors */}
        <section className="mb-16">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-teal-600 px-8 py-4">
              <h2 className="text-2xl font-bold text-white">
                🤝 Partners & Sponsors
              </h2>
            </div>
            <div className="relative h-96">
              <Image
                src={`/pdf_content/${content.page_2_image}`}
                alt="Credits and Sponsors"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </section>

        {/* About This Platform */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl shadow-xl p-8 border-2 border-purple-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              🚀 About This Platform
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-purple-900 mb-3">
                  AI-Powered Sign Language Dictionary
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  This platform combines the comprehensive Ghanaian Sign Language Dictionary (Third Edition)
                  with cutting-edge AI technology to make sign language learning accessible and interactive.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h4 className="font-bold text-lg text-blue-900 mb-2">
                    🔍 Smart Search
                  </h4>
                  <p className="text-gray-600">
                    Search for signs using natural language. Our AI understands context and finds the most relevant signs.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h4 className="font-bold text-lg text-purple-900 mb-2">
                    📚 Complete Dictionary
                  </h4>
                  <p className="text-gray-600">
                    Access 1,500+ signs covering alphabet, numerals, daily life, and specialized vocabulary.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h4 className="font-bold text-lg text-teal-900 mb-2">
                    🧠 Continuous Learning
                  </h4>
                  <p className="text-gray-600">
                    User feedback helps improve search accuracy through human-in-the-loop machine learning.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h4 className="font-bold text-lg text-indigo-900 mb-2">
                    🌍 Accessible to All
                  </h4>
                  <p className="text-gray-600">
                    Free, fast, and easy to use for students, teachers, healthcare workers, and the public.
                  </p>
                </div>
              </div>

              <div className="mt-8 bg-white rounded-lg p-6 shadow-md border-l-4 border-purple-600">
                <h4 className="font-bold text-lg text-gray-900 mb-2">
                  💡 Our Mission
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  To promote inclusion and acceptance by making Ghana Sign Language accessible through
                  technology, supporting deaf education, and fostering communication between the deaf
                  community and society at large.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Credits */}
        <section>
          <div className="bg-gray-900 rounded-2xl shadow-xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">
              ⚙️ Technical Stack
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <h3 className="font-bold text-blue-400 mb-2">Frontend</h3>
                <ul className="space-y-1 text-gray-300">
                  <li>• Next.js 15 + React 19</li>
                  <li>• TypeScript</li>
                  <li>• Tailwind CSS</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-purple-400 mb-2">Backend</h3>
                <ul className="space-y-1 text-gray-300">
                  <li>• FastAPI (Python)</li>
                  <li>• FAISS Vector Search</li>
                  <li>• Tesseract OCR</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-teal-400 mb-2">AI/ML</h3>
                <ul className="space-y-1 text-gray-300">
                  <li>• Sentence Transformers</li>
                  <li>• OpenCV</li>
                  <li>• Human-in-the-Loop Learning</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
