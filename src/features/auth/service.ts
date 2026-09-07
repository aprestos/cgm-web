import type { Access, TenantAccess } from '@/features/auth/access.model.ts'
import { supabase } from '@/lib/supabase.ts'
import { useTenantStore } from '@/features/tenant/tenant.store'
import type { User } from '@/features/auth/user.model.ts'
import logger from '@/lib/logger.ts'

/*
 * Both entry points send the same one-time code and both create the account if
 * the address is new — the only difference is whether we have a name by the
 * time the code is verified.
 *
 * Sign-up carries the name in `data`, which Supabase writes to user metadata at
 * creation and the `user-tenant` function copies into the profile row, so those
 * users are never asked again. Someone who arrives at sign-in without an
 * account is not turned away for it; the confirmation screen asks them for a
 * name after they verify. Turning an unknown address away here would be a dead
 * end for exactly the people a tenant is trying to attract, and it would strand
 * anyone who simply picked the wrong door.
 *
 * Neither passes `emailRedirectTo`: the email carries a code, not a link, so
 * there is nowhere to send anyone back to. A redirect would tie logging in to
 * an allowlist holding every tenant's custom domain, and sign-in would break on
 * each new domain until that list was updated.
 */

export const authService = {
  async signUpWithEmail(name: string, email: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: {
          display_name: name,
          tenant_name: useTenantStore().tenant?.name,
        },
      },
    })

    if (error) {
      logger.error('Failed to send sign-up email', { error })
      throw new Error('Unable to send email. Please try again later.')
    }
  },

  async signInWithEmail(email: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: {
          tenant_name: useTenantStore().tenant?.name,
        },
      },
    })

    if (error) {
      logger.error('Failed to send sign-in email', { error })
      throw new Error('Unable to send email. Please try again later.')
    }
  },

  async validateOTP(email: string, token: string): Promise<void> {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })

    if (!data && error) {
      logger.error('Error validating OTP', { error })
      throw new Error('This code is invalid or expired')
    }
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut()
  },

  // User data methods (using getClaims)
  async getUser(): Promise<User | null> {
    const { data } = await supabase.auth.getClaims()

    if (!data?.claims?.sub) {
      return null
    }

    const tenantId: string = useTenantStore().tenant?.id as string
    let access: TenantAccess | undefined = undefined
    if (data.claims?.access) {
      access = (data.claims.access as Access)[tenantId]
    }

    return {
      email: data.claims.email || '',
      name: (data.claims.user_metadata?.display_name ?? '') as string,
      id: data.claims.sub,
      access,
    }
  },

  async isAuthenticated(): Promise<boolean> {
    const { data } = await supabase.auth.getClaims()
    return !!data?.claims?.sub
  },

  // Utility methods
  async setTenant(userId: string): Promise<void> {
    await supabase.functions.invoke('user-tenant', {
      body: {
        user_id: userId,
        tenant_id: useTenantStore().tenant?.id,
      },
      method: 'POST',
    })
  },

  async updateUserMetadata(metadata: Record<string, unknown>): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      data: metadata,
    })
    if (error) {
      throw error
    }
  },

  async updateProfile(
    userId: string,
    updates: Partial<User>,
  ): Promise<User | undefined> {
    const { data, error } = await supabase
      .schema('public')
      .from('profiles')
      .upsert({ id: userId, ...updates })
      .select()
      .single<User>()

    if (error) {
      logger.error('Unable to upsert user profile', { userId, error })
      throw new Error('Unable to upsert user profile')
    }
    return data
  },

  hasAnyOfTheRoles(user: User, roles: string[]): boolean {
    if (!roles || !user?.access?.role) return false

    if (user.access.role === 'super-admin') return true

    return roles.includes(user.access.role)
  },

  async hasPermission(domain: string, action: string): Promise<boolean> {
    const user = await this.getUser()

    if (user?.access?.role === 'super-admin') return true
    else return (user?.access?.permissions[domain] ?? []).includes(action)
  },
}
