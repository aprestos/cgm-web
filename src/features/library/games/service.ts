import type { LibraryGame } from '@/features/library/games/game.model.ts'
import { LibraryGameStatus } from '@/features/library/games/game.model.ts'
import { supabase } from '@/lib/supabase.ts'
import { editionStore } from '@/stores/edition.ts'
import { tenantStore } from '@/stores/tenant.ts'
import logger from '@/lib/logger.ts'
import { toCamelCaseAs } from '@/utils/caseConverter.ts'

export enum SortOption {
  DEFAULT = 'trending',
  BEST_RATING = 'bestRating',
  NEWEST = 'newest',
  NAME = 'name',
}

export interface FilterOptions {
  searchQuery?: string
  selectedFilters?: Record<string, string[]>
  selectedSort?: SortOption
}

type GameUpdateCallback = (games: LibraryGame[]) => void

export const libraryService = {
  async count(): Promise<number> {
    const result = await supabase
      .from('library_games')
      .select('*', { count: 'exact', head: true })
    return result.count || 0
  },

  async get(): Promise<Array<LibraryGame>> {
    try {
      const { data } = await supabase
        .from('library_games')
        .select(
          'id,owner,notes,game:games(*),location:locations(id,name),edition_id,status,reserved_until',
        )
        .eq('tenant_id', tenantStore.value?.id)
        .eq('edition_id', editionStore.value?.id)
      return data ? toCamelCaseAs<LibraryGame>(data) : []
    } catch (error) {
      logger.error('Error on libraryService.get()', { error })
      return []
    }
  },

  async getById(id: string): Promise<LibraryGame | null> {
    try {
      const { data } = await supabase
        .from('library_games')
        .select('id,owner,notes,game:games(*),edition_id,status,reserved_until')
        .eq('id', id)
        .single()
      return data ? toCamelCaseAs<LibraryGame>(data) : null
    } catch (error) {
      logger.error('Unable to fetch library game by id', { error })
      return null
    }
  },

  async post(
    gameId: number,
    locationId: number,
    owner: string,
    status: LibraryGameStatus = LibraryGameStatus.notAvailable,
    notes?: string,
  ): Promise<void> {
    const { error } = await supabase.from('library_games').insert({
      tenant_id: tenantStore.value?.id,
      edition_id: editionStore.value?.id,
      game_id: gameId,
      location_id: locationId,
      status,
      owner: owner,
      notes: notes || undefined,
    })

    if (error) {
      throw new Error(`Failed to create library game: ${error.message}`)
    }
  },

  subscribeToUpdates(onUpdate: GameUpdateCallback): () => void {
    // Initial load using async/await
    const initializeData = async (): Promise<void> => {
      const games = await this.get()
      onUpdate(games)
    }

    // Call the async function
    void initializeData()

    const handleDatabaseChange = (): void => {
      // Fetch fresh data and update if changed
      void this.get().then((freshGames) => {
        onUpdate(freshGames)
      })
    }

    // Listen to changes on library_games table
    const libraryGamesChannel = supabase
      .channel('library-games-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'library_games',
        },
        handleDatabaseChange,
      )
      .subscribe()

    // Return cleanup function to remove both channels
    return () => {
      void supabase.removeChannel(libraryGamesChannel)
    }
  },

  applyFilters(games: LibraryGame[], filters: FilterOptions): LibraryGame[] {
    let filtered = games

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(
        (game) =>
          game.game.name.toLowerCase().includes(query) ||
          game.owner.toLowerCase().includes(query) ||
          game.notes?.toLowerCase().includes(query),
      )
    }

    // Apply selected filters
    if (filters.selectedFilters) {
      // Players filter
      if (filters.selectedFilters.players?.length) {
        const playerFilters = filters.selectedFilters.players
        filtered = filtered.filter((game) => {
          const minPlayers = game.game.minPlayers
          const maxPlayers = game.game.maxPlayers
          return playerFilters.some((playerCount) => {
            if (playerCount === '10+') {
              return minPlayers <= 10 && maxPlayers >= 10
            }
            const count = parseInt(playerCount)
            return count >= minPlayers && count <= maxPlayers
          })
        })
      }

      // Playtime filter
      if (filters.selectedFilters.playtime?.length) {
        const playtimeFilters = filters.selectedFilters.playtime
        filtered = filtered.filter((game) => {
          const maxPlaytime = game.game.maxPlaytime
          const minPlaytime = game.game.minPlaytime
          return playtimeFilters.some((time) => {
            const minutes = parseInt(time)
            return maxPlaytime >= minutes && minPlaytime <= minutes
          })
        })
      }

      // Tags/Category filter - implement category-specific filtering logic
      if (filters.selectedFilters.tags?.length) {
        const tagFilters = filters.selectedFilters.tags
        filtered = filtered.filter((game) => {
          return tagFilters.some((tag) => {
            switch (tag) {
              case 'new-arrivals':
                // Filter games from current year
                return parseInt(game.game.year) === new Date().getFullYear()
              case 'family':
                // Filter family-friendly games (suitable for all ages, typically min_age <= 8)
                return game.game.minAge <= 8 && game.game.maxPlayers >= 3
              case 'classics':
                // Filter classic games (older than 10 years)
                return parseInt(game.game.year) <= new Date().getFullYear() - 15
              case 'two-player-only':
                // Filter 2-player only games (older than 10 years)
                return game.game.minPlayers === 2 && game.game.maxPlayers === 2
              case 'children':
                // Filter children games (minage until 5)
                return game.game.minAge <= 5
              case 'Most played':
                // This would require play count data - for now return games with good player count range
                return game.game.minPlayers <= 4 && game.game.maxPlayers >= 4
              default:
                return false
            }
          })
        })
      }
    }

    // Apply sorting
    if (filters.selectedSort) {
      filtered = [...filtered].sort((a, b) => {
        switch (filters.selectedSort) {
          case SortOption.BEST_RATING:
            // Sort by best at player count (games with more "best at" recommendations)
            // TODO: Replace with actual rating when available
            return 0
          case SortOption.NEWEST:
            // Sort by newest year first
            return parseInt(b.game.year) - parseInt(a.game.year)
          case SortOption.NAME:
            // Sort alphabetically by name
            return a.game.name.localeCompare(b.game.name)
          default:
            return 0
        }
      })
    }

    return filtered
  },

  async search(query: string): Promise<Array<LibraryGame>> {
    const { data, error } = await supabase
      .from('library_games')
      .select('*')
      .eq('tenant_id', tenantStore.value?.id)
      .eq('edition_id', editionStore.value?.id)
      .or(
        `game_name.ilike.%${query}%,owner.ilike.%${query}%,notes.ilike.%${query}%`,
      )

    if (error) {
      logger.error('Failed to search for library games', { error })
      return []
    }

    return data ? toCamelCaseAs<LibraryGame>(data) : []
  },

  async updateGame(
    id: number,
    update: Partial<LibraryGame> & { location_id?: number },
  ) {
    await supabase.from('library_games').update(update).eq('id', id)
  },

  async deleteGame(libraryGameId: number): Promise<void> {
    const { error } = await supabase
      .from('library_games')
      .delete()
      .eq('id', libraryGameId)

    if (error) {
      logger.error(`Trying to delete game ${libraryGameId}`, { error })
      throw new Error('Unable to delete game')
    }
  },
} as const

// Provide proper default export
export default libraryService
