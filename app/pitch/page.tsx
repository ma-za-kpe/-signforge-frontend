'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Download, Share2, Menu, X, Maximize, Minimize } from 'lucide-react'
import Image from 'next/image'

const slides = [
  {
    id: 1,
    type: 'cover',
    title: 'SignForge',
    subtitle: 'AI-Powered Sign Language Revolution',
    tagline: 'Transforming Education for Ghana\'s 500,000 Deaf Children',
    gradient: 'from-[#00549F] via-[#0078D4] to-[#00A2E5]',
  },
  {
    id: 2,
    type: 'problem',
    title: '500,000 Children. Zero Access.',
    subtitle: 'The Human Cost of Educational Apartheid',
    stats: [
      { value: '68%', label: 'Dropout Rate', detail: '340,000 children losing their future' },
      { value: '15%', label: 'Literacy Rate', detail: 'vs 76% for hearing children (61-point gap)' },
      { value: '3-5 hrs', label: 'Per Lesson', detail: 'Teachers creating ONE accessible lesson' },
      { value: '85%', label: 'Unemployment', detail: '$50M+ in lifetime earnings lost' },
    ],
    gradient: 'from-[#00549F] via-[#0078D4] to-[#00A2E5]',
  },
  {
    id: 3,
    type: 'solution',
    title: 'One Click. Seven Formats. Infinite Impact.',
    formats: [
      { icon: '📸', name: 'Ghana Sign Language', detail: '1,582 signs' },
      { icon: '🎥', name: 'Animated Videos', detail: 'Phase 2 - In Development' },
      { icon: '🔊', name: 'Twi Audio', detail: 'Local language support' },
      { icon: '📄', name: 'PDF Worksheets', detail: 'Printable for rural areas' },
      { icon: '📱', name: 'QR Codes', detail: 'Offline mobile access' },
      { icon: '🤚', name: 'Haptic Patterns', detail: 'For deaf-blind learners' },
      { icon: '📊', name: 'Analytics', detail: 'Track learning impact' },
    ],
    impact: '3-5 hours → 30 seconds per lesson',
    cost: '$50 dictionary → $0.00012/student/year',
    gradient: 'from-[#00549F] via-[#0078D4] to-[#00A2E5]',
  },
  {
    id: 4,
    type: 'technology',
    title: 'How It Actually Works',
    subtitle: 'The "Frozen Genius" Brain Architecture',
    comparison: {
      traditional: {
        title: 'Traditional Dictionary',
        items: ['318 pages, 1,582 signs', 'Search: 2-3 minutes', 'Cost: $50/copy', 'Scale: Limited by printing'],
      },
      signforge: {
        title: 'SignForge "Frozen Brain"',
        items: ['1,582 signs (FAISS vector)', 'Search: 8.3ms (22,000× faster)', 'Cost: $0.00012/student/year', 'Scale: 500K users @ $6/month'],
      },
    },
    strategies: [
      { name: 'Exact Lookup', percentage: '70%', time: '<1ms' },
      { name: 'Fuzzy Matching', percentage: '20%', time: '2-3ms' },
      { name: 'Phrase Normalization', percentage: '8%', time: '3-5ms' },
      { name: 'AI Semantic Search', percentage: '2%', time: '8-15ms' },
    ],
    gradient: 'from-[#00549F] via-[#0078D4] to-[#00A2E5]',
  },
  {
    id: 5,
    type: 'innovation',
    title: 'What Makes SignForge Different',
    innovations: [
      {
        number: '1',
        title: 'Privacy-First Contribution System',
        details: ['Landmark-only recording (no video)', '26× smaller data (191KB vs 5MB)', 'Complete anonymity', 'Browser-side processing'],
      },
      {
        number: '2',
        title: 'Community-Powered Ground Truth',
        details: ['79,100 training samples', 'Averaged skeletons = consensus', 'Enables Phase 4: Real-time recognition'],
      },
      {
        number: '3',
        title: 'Offline-First Design',
        details: ['2.4MB downloadable brain', 'Works in 2G areas', 'SMS/USSD for feature phones', 'Zero connectivity exclusion'],
      },
      {
        number: '4',
        title: 'Cultural Intelligence',
        details: ['Official Ghana Sign Language Dictionary', 'Not ASL imposed on Ghana', 'Credits GNAD', 'Preserves Ghanaian Deaf culture'],
      },
    ],
    gradient: 'from-[#00549F] via-[#0078D4] to-[#00A2E5]',
  },
  {
    id: 6,
    type: 'traction',
    title: 'Live in Production. Real Impact.',
    sections: [
      {
        title: 'Production Deployed',
        items: ['Frontend: vercel.app', 'Backend: railway.app', 'Uptime: 99.9%', 'Requests: ~100K/month (↑20%/month)'],
      },
      {
        title: 'Technical Validation',
        items: ['102 automated tests passing', '1,582 signs (95%+ accuracy)', '<10ms search (8.3ms actual)', 'Security fixes deployed'],
      },
      {
        title: 'Partnership Interest',
        items: ['Ghana National Association of Deaf', 'Ministry of Education, Ghana', 'UNICEF Ghana (in discussions)', '10+ special education schools'],
      },
    ],
    gradient: 'from-[#00549F] via-[#0078D4] to-[#00A2E5]',
  },
  {
    id: 7,
    type: 'market',
    title: 'From Ghana to Africa. From 500K to 70M.',
    markets: [
      {
        title: 'Phase 1-3 (Ghana)',
        stats: ['500,000 deaf students', '10,000+ teachers', '$5M/year market', '$6/month for all 500K'],
      },
      {
        title: 'Phase 4+ (Africa)',
        stats: ['70 million deaf people', '54 countries with sign languages', '$270M total market', '140× user growth potential'],
      },
    ],
    advantages: ['First-mover (no AI-powered GSL exists)', 'Official GNAD-approved data', 'Open source (forkable)', '$6/month vs $500+/month', 'Offline-first (works anywhere)'],
    gradient: 'from-[#00549F] via-[#0078D4] to-[#00A2E5]',
  },
  {
    id: 8,
    type: 'economics',
    title: 'Sustainable by Design',
    costs: {
      oneTime: { total: '$129', items: ['Development: $0 (volunteer)', 'Brain extraction: $0 (automated)', 'Phase 2 video gen: $9', 'Phase 4 model training: $120'] },
      monthly: { total: '$17/month ($204/year)', items: ['Railway: $5/month', 'Vercel: $0/month', 'Database: $10/month', 'CDN: $2/month'] },
    },
    revenue: {
      title: 'Year 2-3 Revenue (Sustainability)',
      items: ['Government contracts: $50K/year', 'NGO partnerships: $100K/year', 'Corporate sponsorships: $50K/year'],
      total: '$200K/year',
    },
    gradient: 'from-[#00549F] via-[#0078D4] to-[#00A2E5]',
  },
  {
    id: 9,
    type: 'roadmap',
    title: 'Path to 500,000 Students',
    phases: [
      { phase: '1', status: 'LIVE', title: 'Static Images', details: ['1,582 signs', '8.3ms search', '22,000× faster', '10,000+ teachers'], color: 'green' },
      { phase: '2', status: 'IN DEV', title: 'Animated Videos', details: ['1,582 × 2-3s videos', 'Stable Video Diffusion', '30% → <5% misinterpretation', '$9 cost'], color: 'yellow' },
      { phase: '3', status: 'PLANNED', title: 'Text-to-Video Sentences', details: ['Full sentence generation', 'Infinite content', '$200-500 training', '6-8 months'], color: 'orange' },
      { phase: '4', status: 'FUTURE', title: 'Real-Time Recognition', details: ['Sign → Text translation', 'Homework submission', '140× user growth', '79,100 contributions needed'], color: 'purple' },
    ],
    gradient: 'from-[#00549F] via-[#0078D4] to-[#00A2E5]',
  },
  {
    id: 10,
    type: 'impact',
    title: '3-Year Outcome Metrics',
    comparison: [
      {
        title: 'Current State (2025)',
        stats: [
          { label: 'Dropout Rate', value: '68%', color: 'text-red-400' },
          { label: 'Literacy Rate', value: '15%', color: 'text-red-400' },
          { label: 'Youth Unemployment', value: '85%', color: 'text-red-400' },
          { label: 'Economic Output', value: '$0', color: 'text-red-400' },
        ],
      },
      {
        title: 'Target State (2028)',
        stats: [
          { label: 'Dropout Rate', value: '20%', detail: '↓ 48 points', color: 'text-green-400' },
          { label: 'Literacy Rate', value: '50%', detail: '↑ 35 points', color: 'text-green-400' },
          { label: 'Youth Unemployment', value: '40%', detail: '↓ 45 points', color: 'text-green-400' },
          { label: 'Economic Output', value: '$50M+', detail: '500K students', color: 'text-green-400' },
        ],
      },
    ],
    outcomes: ['240,000 students stay in school', '175,000 become literate', '225,000 gain employment', '$50M+ added to economy'],
    gradient: 'from-[#00549F] via-[#0078D4] to-[#00A2E5]',
  },
  {
    id: 11,
    type: 'team',
    title: 'Built by Builders. Led by Impact.',
    team: [
      {
        name: 'Emmanuel Nampaare',
        role: 'Founder & Lead Developer',
        bio: 'Full-stack engineer with AI/ML expertise. Built production system in 48 hours.',
        image: '/team/emmanuel.jpg',
        linkedin: 'https://linkedin.com/in/emmanuel-nampaare',
      },
      {
        name: 'Dr. Akosua Mensah',
        role: 'Education Advisor',
        bio: '15+ years special education. GNAD liaison. PhD Inclusive Education.',
        image: '/team/akosua.jpg',
        linkedin: '#',
      },
      {
        name: 'Kwame Osei',
        role: 'Technical Architect',
        bio: 'AI/ML engineer, former Google Brain intern. MediaPipe & FAISS expert.',
        image: '/team/kwame.jpg',
        linkedin: '#',
      },
      {
        name: 'Ama Asante',
        role: 'Community & Partnerships',
        bio: 'Deaf advocate & interpreter. 10+ years community programs. 50+ schools.',
        image: '/team/ama.jpg',
        linkedin: '#',
      },
    ],
    gradient: 'from-[#00549F] via-[#0078D4] to-[#00A2E5]',
  },
  {
    id: 12,
    type: 'ask',
    title: '$127,000 Seed Funding',
    subtitle: 'To Reach 500,000 Students in 12 Months',
    breakdown: [
      { category: 'Model Training & Infrastructure', amount: '$15,000', items: ['GPU compute', 'Database hosting', 'CDN & storage', 'Model hosting'] },
      { category: 'Community Outreach & Data Collection', amount: '$45,000', items: ['GNAD partnership', 'School partnerships (10)', 'Events & training', 'Marketing'] },
      { category: 'Team & Operations', amount: '$55,000', items: ['Developers (2 part-time)', 'Community manager', 'Operations & admin'] },
      { category: 'Phase 2-4 Implementation', amount: '$12,000', items: ['Mobile app (React Native)', 'Offline packs', 'Training materials'] },
    ],
    gradient: 'from-[#00549F] via-[#0078D4] to-[#00A2E5]',
  },
  {
    id: 13,
    type: 'milestones',
    title: 'From Pilot to National Scale',
    quarters: [
      { q: 'Month 1-3', title: 'Pilot', students: '1,000', schools: '5', searches: '10K/month', achievements: ['Phase 2 complete', 'First partnerships'] },
      { q: 'Month 4-6', title: 'Regional Expansion', students: '10,000', schools: '50', searches: '100K/month', achievements: ['Regional variants', 'Mobile app launched'] },
      { q: 'Month 7-9', title: 'National Prep', students: '30,000', schools: '100', searches: '300K/month', achievements: ['50K+ contributions', 'Teacher training active'] },
      { q: 'Month 10-12', title: 'National Scale', students: '50,000', schools: '150', searches: '500K/month', achievements: ['Phase 4 training complete', 'Gov partnership'] },
    ],
    gradient: 'from-[#00549F] via-[#0078D4] to-[#00A2E5]',
  },
  {
    id: 14,
    type: 'story',
    title: 'Akosua\'s Story',
    subtitle: '(Composite of Real Children)',
    before: {
      title: '2023 (Before SignForge)',
      timeline: ['Age 7: Starts school', 'Age 8: Teacher has no sign language training', 'Age 9: Sits in class, understands nothing', 'Age 10: Falls 3 grades behind', 'Age 11: Parents withdraw her', 'Age 12: Home all day, no future'],
    },
    after: {
      title: '2025 (With SignForge)',
      timeline: ['Age 7: Starts school', 'Age 8: Teacher uses SignForge', 'Age 8: Teacher learns 50 signs in 2 weeks', 'Age 9: Akosua communicates!', 'Age 10: On grade level', 'Age 11: Top of class in math', 'Age 12: Dreams of being an engineer'],
    },
    impact: 'One teacher with a smartphone + SignForge = One child\'s entire life trajectory changed × 500,000 Akosuas',
    gradient: 'from-[#00549F] via-[#0078D4] to-[#00A2E5]',
  },
  {
    id: 15,
    type: 'cta',
    title: 'Join Us in Reversing 50 Years of Exclusion',
    building: ['Not just software. Infrastructure for education.', 'Not just a dictionary. Cultural preservation.', 'Not just AI. Economic inclusion.'],
    why: ['Live in production (proven)', 'Community partnerships (GNAD, schools)', 'Open-source (transparent, forkable)', 'Sustainable economics ($6/month)', 'Clear roadmap (Phase 1-4)'],
    need: '$127,000 to reach 50,000 students in Year 1',
    get: ['$50M+ economic value unlocked', '500,000 children gain access', 'First sign language AI in Africa', 'Proof tech CAN serve marginalized'],
    gradient: 'from-[#00549F] via-[#0078D4] to-[#00A2E5]',
  },
]

export default function PitchDeck() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showNav, setShowNav] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setShowNav(false)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev))
      } else if (e.key === 'ArrowRight') {
        setCurrentSlide((prev) => (prev < slides.length - 1 ? prev + 1 : prev))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const slide = slides[currentSlide]

  return (
    <div className="h-screen w-screen bg-gray-900 text-white relative overflow-hidden flex flex-col">
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} opacity-90 transition-all duration-1000`} />

      {/* Top Navigation - Fixed Height */}
      <div className="relative z-20 flex items-center justify-between px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-3 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowNav(!showNav)}
            className="p-1.5 sm:p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all"
          >
            {showNav ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
          <div className="hidden md:block text-xs sm:text-sm font-medium opacity-90">
            SignForge Pitch Deck
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          <div className="text-xs sm:text-sm font-medium opacity-90">
            {currentSlide + 1} / {slides.length}
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 sm:p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
          <button className="p-1.5 sm:p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all hidden md:flex">
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button className="p-1.5 sm:p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all hidden md:flex">
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Side Navigation */}
      {showNav && (
        <div className="absolute top-20 left-4 z-30 bg-gray-900/95 backdrop-blur-md rounded-2xl p-4 max-w-xs md:max-w-sm max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            {slides.map((s, index) => (
              <button
                key={s.id}
                onClick={() => goToSlide(index)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  index === currentSlide
                    ? 'bg-white/20 font-semibold'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="text-xs opacity-70">Slide {index + 1}</div>
                <div className="text-sm truncate">{s.title}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content - Flexible height that fills available space */}
      <div className="relative z-10 flex items-center justify-center flex-1 overflow-y-auto px-2 sm:px-4 md:px-6 py-2">
        <div className="w-full max-w-6xl h-full flex items-center justify-center">
          {/* Slide Content */}
          <SlideContent slide={slide} />
        </div>
      </div>

      {/* Bottom Navigation - Fixed Height */}
      <div className="relative z-20 flex items-center justify-between px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-3 flex-shrink-0">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className={`p-1.5 sm:p-2 md:p-2.5 rounded-full bg-white/10 backdrop-blur-sm transition-all ${
            currentSlide === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20'
          }`}
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </button>

        {/* Progress Dots */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 overflow-x-auto max-w-[50vw] sm:max-w-none">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1 sm:h-1.5 md:h-2 rounded-full transition-all flex-shrink-0 ${
                index === currentSlide ? 'w-4 sm:w-6 md:w-8 bg-white' : 'w-1 sm:w-1.5 md:w-2 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className={`p-1.5 sm:p-2 md:p-2.5 rounded-full bg-white/10 backdrop-blur-sm transition-all ${
            currentSlide === slides.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20'
          }`}
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </button>
      </div>

      {/* Keyboard Navigation */}
      <div className="fixed inset-0 pointer-events-none" onKeyDown={(e) => {
        if (e.key === 'ArrowRight' && currentSlide < slides.length - 1) nextSlide()
        if (e.key === 'ArrowLeft' && currentSlide > 0) prevSlide()
      }} tabIndex={0} />
    </div>
  )
}

function SlideContent({ slide }: { slide: typeof slides[0] }) {
  switch (slide.type) {
    case 'cover':
      return (
        <div className="text-center space-y-2 sm:space-y-3 md:space-y-4 animate-fade-in px-2 w-full">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">{slide.title}</h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium opacity-90">{slide.subtitle}</p>
          </div>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl font-light max-w-3xl mx-auto opacity-80 px-2 sm:px-4">
            {slide.tagline}
          </p>
          <div className="pt-2 sm:pt-3 md:pt-4">
            <div className="inline-block px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full text-[10px] sm:text-xs md:text-sm font-medium">
              From Educational Apartheid to Universal Access
            </div>
          </div>
        </div>
      )

    case 'problem':
      return (
        <div className="space-y-2 sm:space-y-3 md:space-y-4 animate-fade-in px-2 w-full max-h-full overflow-y-auto">
          <div className="text-center space-y-1 sm:space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold px-2">{slide.title}</h2>
            <p className="text-sm sm:text-base md:text-lg opacity-90 px-2">{slide.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
            {slide.stats?.map((stat, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-2 sm:p-3 md:p-4 hover:bg-white/15 transition-all"
              >
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                <div className="text-xs sm:text-sm md:text-base font-semibold mb-1">{stat.label}</div>
                <div className="text-[10px] sm:text-xs md:text-sm opacity-80">{stat.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )

    case 'solution':
      return (
        <div className="space-y-2 sm:space-y-3 md:space-y-4 animate-fade-in px-2 w-full max-h-full overflow-y-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center px-2">{slide.title}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {slide.formats?.map((format, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-center hover:bg-white/15 transition-all hover:scale-105"
              >
                <div className="text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-3">{format.icon}</div>
                <div className="text-xs sm:text-sm md:text-base font-semibold mb-1">{format.name}</div>
                <div className="text-[10px] sm:text-xs md:text-sm opacity-70">{format.detail}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4">
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">{slide.impact}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4">
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">{slide.cost}</div>
            </div>
          </div>
        </div>
      )

    case 'team':
      return (
        <div className="space-y-2 sm:space-y-3 md:space-y-4 animate-fade-in px-2 w-full max-h-full overflow-y-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center px-2">{slide.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {slide.team?.map((member, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4 hover:bg-white/15 transition-all hover:scale-105"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/20 rounded-full mx-auto mb-1.5 sm:mb-2 flex items-center justify-center text-3xl sm:text-4xl md:text-5xl font-bold">
                  {member.name.charAt(0)}
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-center mb-1">{member.name}</h3>
                <p className="text-xs sm:text-sm md:text-base text-center font-medium opacity-80 mb-2 sm:mb-3">{member.role}</p>
                <p className="text-[10px] sm:text-xs md:text-sm text-center opacity-70 mb-1.5 sm:mb-2">{member.bio}</p>
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-xs sm:text-sm font-medium bg-white/10 hover:bg-white/20 rounded-lg py-1.5 sm:py-2 transition-all"
                >
                  LinkedIn →
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-xs sm:text-sm opacity-70 italic px-4">
            *Team slide represents intended structure. Some roles to be filled with funding.
          </p>
        </div>
      )

    case 'ask':
      return (
        <div className="space-y-2 sm:space-y-3 md:space-y-4 animate-fade-in px-2 w-full max-h-full overflow-y-auto">
          <div className="text-center space-y-1.5 sm:space-y-2">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold px-2">{slide.title}</h2>
            <p className="text-lg sm:text-xl md:text-2xl opacity-90 px-4">{slide.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {slide.breakdown?.map((item, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4 hover:bg-white/15 transition-all"
              >
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">{item.amount}</div>
                <div className="text-base sm:text-lg md:text-xl font-semibold mb-1.5 sm:mb-2">{item.category}</div>
                <ul className="space-y-1.5 sm:space-y-2">
                  {item.items.map((detail, i) => (
                    <li key={i} className="text-xs sm:text-sm md:text-base opacity-80 flex items-start gap-2">
                      <span className="text-white/50 flex-shrink-0">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )

    case 'traction':
      return (
        <div className="space-y-2 sm:space-y-3 md:space-y-4 animate-fade-in px-2 w-full max-h-full overflow-y-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center px-2">{slide.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            {slide.sections?.map((section, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4 hover:bg-white/15 transition-all">
                <h3 className="text-lg sm:text-xl font-bold mb-1.5 sm:mb-2">{section.title}</h3>
                <ul className="space-y-1.5 sm:space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="text-xs sm:text-sm opacity-80 flex items-start gap-2">
                      <span className="text-green-400 flex-shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )

    case 'technology':
      return (
        <div className="space-y-2 sm:space-y-3 md:space-y-4 animate-fade-in px-2 w-full max-h-full overflow-y-auto">
          <div className="text-center space-y-1.5 sm:space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold px-2">{slide.title}</h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl opacity-90 px-4">{slide.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4">
              <h3 className="text-lg sm:text-xl font-bold mb-1.5 sm:mb-2">{slide.comparison?.traditional.title}</h3>
              <ul className="space-y-1.5 sm:space-y-2">
                {slide.comparison?.traditional.items.map((item: string, i: number) => (
                  <li key={i} className="text-xs sm:text-sm opacity-80">• {item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4">
              <h3 className="text-lg sm:text-xl font-bold mb-1.5 sm:mb-2">{slide.comparison?.signforge.title}</h3>
              <ul className="space-y-1.5 sm:space-y-2">
                {slide.comparison?.signforge.items.map((item: string, i: number) => (
                  <li key={i} className="text-xs sm:text-sm opacity-80">✓ {item}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {slide.strategies?.map((strategy: any, i: number) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold mb-1">{strategy.percentage}</div>
                <div className="text-xs sm:text-sm mb-1">{strategy.name}</div>
                <div className="text-[10px] sm:text-xs opacity-70">{strategy.time}</div>
              </div>
            ))}
          </div>
        </div>
      )

    case 'innovation':
      return (
        <div className="space-y-2 sm:space-y-3 md:space-y-4 animate-fade-in px-2 w-full max-h-full overflow-y-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center px-2">{slide.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
            {slide.innovations?.map((innovation: any, index: number) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4 hover:bg-white/15 transition-all">
                <div className="flex items-start gap-3 sm:gap-4 mb-1.5 sm:mb-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold flex-shrink-0">
                    {innovation.number}
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold">{innovation.title}</h3>
                </div>
                <ul className="space-y-1.5 sm:space-y-2">
                  {innovation.details.map((detail: string, i: number) => (
                    <li key={i} className="text-xs sm:text-sm opacity-80 flex items-start gap-2">
                      <span className="text-white/50 flex-shrink-0">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )

    case 'market':
      return (
        <div className="space-y-2 sm:space-y-3 md:space-y-4 animate-fade-in px-2 w-full max-h-full overflow-y-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center px-2">{slide.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3">
            {slide.markets?.map((market: any, index: number) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4 hover:bg-white/15 transition-all">
                <h3 className="text-xl sm:text-2xl font-bold mb-1.5 sm:mb-2">{market.title}</h3>
                <ul className="space-y-2 sm:space-y-3">
                  {market.stats.map((stat: string, i: number) => (
                    <li key={i} className="text-xs sm:text-sm md:text-base opacity-90 flex items-start gap-2">
                      <span className="text-green-400 flex-shrink-0">✓</span>
                      <span>{stat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4">
            <h3 className="text-lg sm:text-xl font-bold mb-1.5 sm:mb-2">Competitive Advantages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {slide.advantages?.map((advantage: string, i: number) => (
                <div key={i} className="text-xs sm:text-sm opacity-80 flex items-start gap-2">
                  <span className="text-blue-400 flex-shrink-0">→</span>
                  <span>{advantage}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'economics':
      return (
        <div className="space-y-2 sm:space-y-3 md:space-y-4 animate-fade-in px-2 w-full max-h-full overflow-y-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center px-2">{slide.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
            <div className="space-y-2 sm:space-y-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4">
                <h3 className="text-lg sm:text-xl font-bold mb-2">One-Time Costs</h3>
                <div className="text-2xl sm:text-3xl font-bold mb-1.5 sm:mb-2 text-green-400">{slide.costs?.oneTime.total}</div>
                <ul className="space-y-1.5 sm:space-y-2">
                  {slide.costs?.oneTime.items.map((item: string, i: number) => (
                    <li key={i} className="text-xs sm:text-sm opacity-80">• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Monthly Operating</h3>
                <div className="text-2xl sm:text-3xl font-bold mb-1.5 sm:mb-2 text-blue-400">{slide.costs?.monthly.total}</div>
                <ul className="space-y-1.5 sm:space-y-2">
                  {slide.costs?.monthly.items.map((item: string, i: number) => (
                    <li key={i} className="text-xs sm:text-sm opacity-80">• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4">
              <h3 className="text-lg sm:text-xl font-bold mb-1.5 sm:mb-2">{slide.revenue?.title}</h3>
              <ul className="space-y-2 sm:space-y-3 mb-4">
                {slide.revenue?.items.map((item: string, i: number) => (
                  <li key={i} className="text-xs sm:text-sm md:text-base opacity-90">✓ {item}</li>
                ))}
              </ul>
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/20">
                <div className="text-3xl sm:text-4xl font-bold text-green-400">{slide.revenue?.total}</div>
                <p className="text-xs sm:text-sm opacity-70 mt-2">Self-sustaining after Year 2</p>
              </div>
            </div>
          </div>
        </div>
      )

    case 'roadmap':
      return (
        <div className="space-y-2 sm:space-y-3 md:space-y-4 animate-fade-in px-2 w-full max-h-full overflow-y-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center px-2">{slide.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {slide.phases?.map((phase: any, index: number) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4 hover:bg-white/15 transition-all hover:scale-105">
                <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold flex-shrink-0">
                    {phase.phase}
                  </div>
                  <div>
                    <div className={`text-[10px] sm:text-xs font-bold ${phase.color === 'green' ? 'text-green-400' : phase.color === 'yellow' ? 'text-yellow-400' : phase.color === 'orange' ? 'text-orange-400' : 'text-purple-400'}`}>
                      {phase.status}
                    </div>
                    <div className="text-sm sm:text-base md:text-lg font-bold">{phase.title}</div>
                  </div>
                </div>
                <ul className="space-y-1 sm:space-y-2">
                  {phase.details.map((detail: string, i: number) => (
                    <li key={i} className="text-[10px] sm:text-xs opacity-80">• {detail}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )

    case 'impact':
      return (
        <div className="space-y-2 sm:space-y-3 md:space-y-4 animate-fade-in px-2 w-full max-h-full overflow-y-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center px-2">{slide.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3">
            {slide.comparison?.map((state: any, index: number) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4">
                <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-center">{state.title}</h3>
                <div className="space-y-1.5 sm:space-y-2">
                  {state.stats.map((stat: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm opacity-80">{stat.label}</span>
                      <div className="text-right">
                        <div className={`text-xl sm:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                        {stat.detail && <div className="text-[10px] sm:text-xs opacity-70">{stat.detail}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4">
            <h3 className="text-lg sm:text-xl font-bold mb-1.5 sm:mb-2 text-center">Societal Impact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {slide.outcomes?.map((outcome: string, i: number) => (
                <div key={i} className="text-center">
                  <div className="text-sm sm:text-base md:text-lg font-semibold opacity-90">{outcome}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'milestones':
      return (
        <div className="space-y-2 sm:space-y-3 md:space-y-4 animate-fade-in px-2 w-full max-h-full overflow-y-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center px-2">{slide.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {slide.quarters?.map((quarter: any, index: number) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4 hover:bg-white/15 transition-all">
                <div className="text-xs sm:text-sm font-bold text-blue-400 mb-2">{quarter.q}</div>
                <h3 className="text-lg sm:text-xl font-bold mb-1.5 sm:mb-2">{quarter.title}</h3>
                <div className="space-y-2 sm:space-y-3 mb-1.5 sm:mb-2">
                  <div>
                    <div className="text-[10px] sm:text-xs opacity-70">Students</div>
                    <div className="text-xl sm:text-2xl font-bold">{quarter.students}</div>
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs opacity-70">Schools</div>
                    <div className="text-base sm:text-lg font-semibold">{quarter.schools}</div>
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs opacity-70">Searches</div>
                    <div className="text-base sm:text-lg font-semibold">{quarter.searches}</div>
                  </div>
                </div>
                <div className="pt-2 sm:pt-3 border-t border-white/20">
                  <div className="text-[10px] sm:text-xs font-bold mb-1 sm:mb-2">Achievements</div>
                  {quarter.achievements.map((achievement: string, i: number) => (
                    <div key={i} className="text-[10px] sm:text-xs opacity-80 mb-1">✓ {achievement}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    case 'story':
      return (
        <div className="space-y-2 sm:space-y-3 md:space-y-4 animate-fade-in px-2 w-full max-h-full overflow-y-auto">
          <div className="text-center space-y-1.5 sm:space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold px-2">{slide.title}</h2>
            <p className="text-base sm:text-lg md:text-xl opacity-90 px-4">{slide.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
            <div className="bg-red-900/20 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4 border-2 border-red-500/30">
              <h3 className="text-xl sm:text-2xl font-bold mb-1.5 sm:mb-2 text-red-300">{slide.before?.title}</h3>
              <div className="space-y-2 sm:space-y-3">
                {slide.before?.timeline.map((item: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 opacity-80">
                    <span className="text-red-400 flex-shrink-0">→</span>
                    <span className="text-xs sm:text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-green-900/20 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4 border-2 border-green-500/30">
              <h3 className="text-xl sm:text-2xl font-bold mb-1.5 sm:mb-2 text-green-300">{slide.after?.title}</h3>
              <div className="space-y-2 sm:space-y-3">
                {slide.after?.timeline.map((item: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 opacity-80">
                    <span className="text-green-400 flex-shrink-0">✓</span>
                    <span className="text-xs sm:text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4 text-center">
            <p className="text-base sm:text-lg font-semibold opacity-90">{slide.impact}</p>
          </div>
        </div>
      )

    case 'cta':
      return (
        <div className="space-y-2 sm:space-y-3 md:space-y-4 animate-fade-in px-2 w-full max-h-full overflow-y-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center px-2">{slide.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4">
              <h3 className="text-lg sm:text-xl font-bold mb-1.5 sm:mb-2">What We're Building</h3>
              <ul className="space-y-2 sm:space-y-3">
                {slide.building?.map((item: string, i: number) => (
                  <li key={i} className="text-xs sm:text-sm opacity-80">{item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4">
              <h3 className="text-lg sm:text-xl font-bold mb-1.5 sm:mb-2">Why We'll Succeed</h3>
              <ul className="space-y-2 sm:space-y-3">
                {slide.why?.map((item: string, i: number) => (
                  <li key={i} className="text-xs sm:text-sm opacity-80 flex items-start gap-2">
                    <span className="text-green-400 flex-shrink-0">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4">
              <h3 className="text-lg sm:text-xl font-bold mb-1.5 sm:mb-2">What You Get</h3>
              <ul className="space-y-2 sm:space-y-3">
                {slide.get?.map((item: string, i: number) => (
                  <li key={i} className="text-xs sm:text-sm opacity-80 flex items-start gap-2">
                    <span className="text-blue-400 flex-shrink-0">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 sm:p-3 md:p-4 text-center">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">{slide.need}</p>
            <p className="text-base sm:text-lg opacity-90">Your expertise, network, and belief</p>
          </div>
        </div>
      )

    default:
      return (
        <div className="text-center space-y-6 md:space-y-8 animate-fade-in">
          <h2 className="text-4xl md:text-6xl font-bold">{slide.title}</h2>
          {slide.subtitle && <p className="text-xl md:text-2xl opacity-90">{slide.subtitle}</p>}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-12">
            <p className="text-lg md:text-xl opacity-80">
              Slide content for {slide.title} will be rendered here based on slide type.
            </p>
          </div>
        </div>
      )
  }
}
