export type Game = GameSummary & {
  minPlayers: number
  maxPlayers: number
  minPlaytime: number
  maxPlaytime: number
  minAge: number
  bestAt: string
  recommendedAt: string
  languageDependence?: string
}

export interface GameSummary {
  id: number
  externalId: string
  bggId: string
  name: string
  image: string
  year: string
}

export interface ExternalGameSearchResult {
  id: string
}
