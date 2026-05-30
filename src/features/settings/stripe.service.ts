import { supabase } from '@/lib/supabase.ts'
import logger from '@/lib/logger.ts'
import { toCamelCaseAs } from '@/utils/caseConverter.ts'
import type { StripeConfiguration } from '@/features/settings/stripe.model.ts'

export const stripeService = {
  async connect(
    tenantId: string,
    originUri: string,
  ): Promise<string | undefined> {
    try {
      const result = await supabase.functions.invoke<{ url: string }>(
        'payments/stripe/connect',
        {
          method: 'POST',
          body: {
            action: 'initiate',
            tenant_id: tenantId,
            redirect_uri: `${originUri}/stripe/callback`,
          },
        },
      )
      return result.data?.url
    } catch (error) {
      logger.error('unable to update settings', {
        error,
        tenantId,
      })
      throw error
    }
  },

  async callback(
    tenantId: string,
    code: string,
    state: string,
  ): Promise<string | undefined> {
    try {
      const result = await supabase.functions.invoke<{ url: string }>(
        'payments/stripe/connect',
        {
          method: 'POST',
          body: {
            action: 'callback',
            tenant_id: tenantId,
            code,
            state,
          },
        },
      )
      return result.data?.url
    } catch (error) {
      logger.error('unable to update settings', {
        error,
        tenantId,
      })
      throw error
    }
  },

  async getConfiguration(
    tenantId: string,
  ): Promise<StripeConfiguration | null> {
    const { data, error } = await supabase
      .schema('payments')
      .from('stripe_accounts')
      .select('account_id,onboarding_status,charges_enabled')
      .eq('tenant_id', tenantId)
      .maybeSingle<{
        account_id: string
        onboarding_status: string
        charges_enabled: boolean
      }>()
    if (error) {
      logger.error('Unable to get stripe configuration', { error })
      throw new Error('Unable to load stripe configuration')
    }

    return data ? toCamelCaseAs<StripeConfiguration>(data) : null
  },
} as const
