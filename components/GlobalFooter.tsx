'use client'

import Link from 'next/link'
import { Presentation, Github, Twitter, Mail } from 'lucide-react'

export default function GlobalFooter() {
  return (
    <footer className="mt-auto bg-white border-t border-gray-200">
      {/* Sponsors Section */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Proudly Supported By</h3>
          <p className="text-xs sm:text-sm text-gray-500">UNICEF StartUp Lab Hackathon 2025</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-center justify-items-center">
          {/* UNICEF Ghana */}
          <a
            href="https://www.unicef.org/ghana/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center group transition-transform hover:scale-105"
          >
            <div className="h-16 sm:h-20 flex items-center justify-center mb-2 w-full px-4">
              <img
                src="/unicef-ghana-logo.png"
                alt="UNICEF Ghana - For Every Child"
                className="h-full w-auto object-contain max-w-full"
              />
            </div>
            <p className="text-xs text-gray-600 text-center px-2">For Every Child</p>
          </a>

          {/* MEST Africa */}
          <a
            href="https://meltwater.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center group transition-transform hover:scale-105"
          >
            <div className="h-16 sm:h-20 flex items-center justify-center mb-2 w-full px-4">
              <img
                src="/mest-africa-logo.png"
                alt="MEST Africa - Building Africa's Next Generation of Tech Entrepreneurs"
                className="h-full w-auto object-contain max-w-full"
              />
            </div>
            <p className="text-xs text-gray-600 text-center px-2">Building Africa's Next Generation of Tech Entrepreneurs</p>
          </a>

          {/* DevCongress */}
          <a
            href="https://devcongress.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center group transition-transform hover:scale-105"
          >
            <div className="h-16 sm:h-20 flex items-center justify-center mb-2 w-full px-4">
              <img
                src="/devcongress-logo.png"
                alt="DevCongress - Ghana's largest developer community"
                className="h-full w-auto object-contain max-w-full"
              />
            </div>
            <p className="text-xs text-gray-600 text-center px-2">Ghana's Largest Developer Community</p>
          </a>
        </div>
      </div>

      {/* Bottom Bar with Pitch Deck Button and Social Links */}
      <div className="bg-gradient-to-r from-[#00549F] to-[#00A2E5]">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Left: Copyright */}
            <p className="text-xs sm:text-sm text-white font-medium text-center sm:text-left">
              SignForge Hackathon 2025 • Built with FastAPI, FAISS, and Next.js 15
            </p>

            {/* Center: Pitch Deck Button */}
            <Link
              href="/pitch"
              className="group relative inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-white text-[#00549F] rounded-full font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Presentation className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
              <span className="whitespace-nowrap">View Pitch Deck</span>
              <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse" />
            </Link>

            {/* Right: Social Icons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href="https://github.com/ma-za-kpe/signforge-backend"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </a>
              <a
                href="https://twitter.com/signforge"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </a>
              <a
                href="mailto:emmanuel@signforge.org"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
                aria-label="Email"
              >
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
