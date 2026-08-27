import { supabase } from '@/lib/supabase.ts'
import logger from '@/lib/logger.ts'
import { toCamelCaseAs } from '@/utils/caseConverter.ts'
import type { StripeConfiguration } from '@/features/settings/stripe.model.ts'

export const stripeService = {
  async connect(
    tenantId: string,
    originUri: string,
    accountType: StripeConfiguration['accountType'],
  ): Promise<string | undefined> {
    try {
      const result = await supabase.functions.invoke<{ url: string }>(
        'admin/payments/stripe/initiate',
        {
          method: 'POST',
          body: {
            tenant_id: tenantId,
            redirect_uri: `${originUri}/admin/stripe/callback`,
            account_type: accountType,
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
        'admin/payments/stripe/callback',
        {
          method: 'POST',
          body: {
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
      .schema('public')
      .from('stripe_accounts')
      .select('account_id,onboarding_status,charges_enabled,account_type')
      .eq('tenant_id', tenantId)
      .maybeSingle<{
        account_id: string
        onboarding_status: string
        charges_enabled: boolean
        account_type: StripeConfiguration['accountType']
      }>()
    if (error) {
      logger.error('Unable to get stripe configuration', { error })
      throw new Error('Unable to load stripe configuration')
    }

    return data ? toCamelCaseAs<StripeConfiguration>(data) : null
  },

  async disconnect(tenantId: string): Promise<void> {
    const { error } = await supabase.functions.invoke<void>(
      'admin/payments/stripe/disconnect',
      {
        method: 'POST',
        body: {
          tenant_id: tenantId,
        },
      },
    )
    if (error) {
      logger.error('unable to disconnect stripe settings', {
        error,
        tenantId,
      })
      throw new Error('Unable to disconnect stripe')
    }
  },
} as const
