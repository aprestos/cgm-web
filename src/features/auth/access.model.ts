export type Access = {
  [key: string]: TenantAccess
}

export type TenantAccess = {
  role: string
  permissions: Record<string, string[]>
}
