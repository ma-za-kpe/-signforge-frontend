import { Suspense } from 'react'
import ContributionPage from '@/components/contribution/ContributionPage'

export const metadata = {
  title: 'Contribute - SignForge GSL',
  description: 'Help build Ghana\'s first community-powered sign language video database',
}

export default function Contribute() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A2E5] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contribution page...</p>
        </div>
      </div>
    }>
      <ContributionPage />
    </Suspense>
  )
}
