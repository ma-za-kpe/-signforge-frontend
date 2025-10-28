# 🎨 SignForge Frontend

Interactive Next.js frontend with AI-powered Ghana Sign Language search and comprehensive pitch deck.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

**Built for UNICEF StartUp Lab Hack 2025**

---

## 🌟 Features

- 🔍 **Real-time sign search** with autocomplete suggestions
- 🎯 **Semantic matching** - understands synonyms and typos
- 📱 **Mobile-first responsive design** - works on all devices
- 🎓 **Teacher Dashboard** - Create accessible lessons in 30 seconds
- 🎤 **Interactive Pitch Deck** - 6 comprehensive slides with navigation
- ♿ **WCAG AA accessible** - High contrast, keyboard navigation
- ⚡ **Edge-optimized** - Deployed on Vercel global CDN

---

## 🚀 Live Production

- **Main App**: https://frontend-theta-three-66.vercel.app
- **Pitch Deck**: https://frontend-theta-three-66.vercel.app/pitch-deck
- **Teacher Dashboard**: https://frontend-theta-three-66.vercel.app/teacher
- **About Page**: https://frontend-theta-three-66.vercel.app/about

---

## 📋 Prerequisites

- Node.js 18+ or 20+
- npm or yarn
- Backend API running (see [signforge-backend](https://github.com/ma-za-kpe/signforge-backend))

---

## 🛠️ Installation

### Local Development

```bash
# Clone the repository
git clone https://github.com/ma-za-kpe/-signforge-frontend.git
cd -signforge-frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your backend API URL

# Run development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 🌐 Environment Variables

Create `.env.local`:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:9000

# Or production
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

---

## 📖 Pages

### 🏠 Home (`/`)
- Sign language search with autocomplete
- Quick search suggestions
- Real-time results with confidence scores
- Sign illustrations from official GSL Dictionary

### 👩‍🏫 Teacher Dashboard (`/teacher`)
- Paste lesson text
- AI extracts key words automatically
- Generate 7 accessible formats

### 🎤 Pitch Deck (`/pitch-deck`)
Interactive presentation with 6 slides:
1. **The Problem** - 500K deaf children, 68% dropout rate
2. **The Solution** - SignForge transformation (3-5h → 30s)
3. **System Architecture** - Complete tech stack visualization
4. **AI Pipeline** - How search works in 8.3ms
5. **Impact Metrics** - Measurable outcomes
6. **Why We Win** - Competitive advantages

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Open a Pull Request

---

## 📄 License

MIT License

---

## 🙏 Acknowledgments

- **Ghana National Association of the Deaf (GNAD)**
- **UNICEF Ghana**
- **MEST Africa & DevCongress**

---

**Built with ❤️ for Ghana's 500,000 deaf children**
