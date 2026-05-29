export interface StripeConfiguration {
  accountId: string
  onboardingStatus: 'not_started' | 'pending' | 'complete' | 'restricted'
  chargesEnabled: boolean
}
