export enum LogoType {
  favicon = 'favicon',
  square = 'square',
  square_dark = 'square.dark',
  square_light = 'square.light',
  long = 'long',
  long_dark = 'long.dark',
  long_light = 'long.light',
}

export interface Tenant {
  id: string
  name: string
  domain: string
  logo?: string
  logos?: Partial<Record<LogoType, string | undefined>>
  currentEvent: string
  email?: string
  images?: string[]
  shortDescription?: string
  socialNetworks?: {
    facebook?: string
    instagram?: string
    x?: string
  }
}
