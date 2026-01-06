export interface Tenant {
  id: string
  name: string
  domain: string
  logo?: string
  current_event: string
  email?: string
  images?: string[]
  short_description?: string
}
