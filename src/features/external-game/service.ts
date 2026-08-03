import type { Game, GameSearchResult } from '@/features/external-game/model.ts'
import { supabase } from '@/lib/supabase.ts'

// Shape returned by the games edge function (snake_case)
interface GameSearchApiResult {
  id?: number
  external_id: string
  bgg_id: string
  name: string
  year: number | null
}

export const gameService = {
  async get(id: string): Promise<Game> {
    const result = await supabase.functions.invoke(`games/${id}`, {
      method: 'GET',
    })
    return result.data as Game
  },

  async search(query: string): Promise<GameSearchResult[]> {
    const result = await supabase.functions.invoke<{
      results: GameSearchApiResult[]
    }>(`games?query=${encodeURIComponent(query)}`, {
      method: 'GET',
    })
    return (result.data?.results ?? []).map((game) => ({
      id: game.id,
      externalId: game.external_id,
      bggId: game.bgg_id,
      name: game.name,
      year: game.year,
    }))
  },
} as const

export default gameService
