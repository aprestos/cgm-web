export enum LogoType {
  favicon = 'favicon',
  square = 'square',
  long = 'long',
}

export interface Tenant {
  id: string
  name: string
  domain: string
  logo?: string
  logos?: Record<LogoType, string>
  current_event: string
  email?: string
  images?: string[]
  short_description?: string
}
