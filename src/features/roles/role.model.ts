/** Roles a user can have within a tenant (matches the `app_role` enum in the DB). */
export type AppRole = 'super-admin' | 'admin' | 'staff' | 'user'

export const ASSIGNABLE_ROLES: AppRole[] = ['admin', 'staff', 'user']

/** Minimal profile information attached to a role assignment. */
export interface RoleUser {
  id: string
  name: string | null
  email: string | null
}

/** A role assigned to a user within a tenant (row of `public.user_roles`). */
export interface UserRole {
  userId: string
  tenantId: string
  role: AppRole
  createdAt: string
  user?: RoleUser
}
