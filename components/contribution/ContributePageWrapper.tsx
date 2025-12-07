'use client'

/**
 * ContributePageWrapper
 * Wraps the contribution page with AuthGuard to require authentication
 */
import { AuthGuard } from '@/components/auth/AuthGuard'
import ContributionPage from '@/components/contribution/ContributionPage'

interface Props {
  maxAttempts?: number
}

export default function ContributePageWrapper({ maxAttempts = 1 }: Props) {
  return (
    <AuthGuard action="contribute signs">
      <ContributionPage maxAttempts={maxAttempts} />
    </AuthGuard>
  )
}
