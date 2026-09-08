import { supabase } from '@/lib/supabase.ts'
import type { LibraryGame } from '@/features/library/games/game.model.ts'
import logger from '@/lib/logger.ts'
import { DateTime } from 'luxon'

export interface LibraryReservation {
  tenant_id: string
  edition_id: string
  id: number
  library_game: Partial<LibraryGame>
  display_id: number
  user_id: string
  expires_at: string
  status: string
}

type ReservationUpdateCallback = (reservations: LibraryReservation[]) => void

export const libraryReservationService = {
  async getByDisplayId(
    tenantId: string,
    editionId: number,
    displayId: string,
  ): Promise<LibraryReservation | null> {
    const now = DateTime.now().minus({ minute: 1 }).toISO()
    const { data, error } = await supabase
      .from('library_reservations')
      .select(
        'id,display_id,user_id,expires_at,library_game:library_games(id,game:games(name,year,image),location:locations(id,name))',
      )
      .eq('tenant_id', tenantId)
      .eq('edition_id', editionId)
      .eq('status', 'active')
      .eq('display_id', displayId)
      .gte('expires_at', now)
      .single()

    if (error) {
      logger.error('Failed to get reservation by id', { error })
      throw new Error('Reservation not found')
    }

    return data as unknown as LibraryReservation | null
  },

  async get(
    tenantId: string,
    editionId: number,
    userId: string,
  ): Promise<Array<LibraryReservation>> {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('library_reservations')
      .select(
        'id,status,display_id,expires_at,user_id,library_game:library_games(id,game:games(name,year,image),location:locations(id,name))',
      )
      .eq('tenant_id', tenantId)
      .eq('edition_id', editionId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', now)

    if (error) {
      logger.error('Failed to get reservation by id', { error })
      throw new Error('Unable to fetch reservations')
    }

    return data as unknown as LibraryReservation[]
  },

  async countByGame(
    tenantId: string,
    editionId: number,
    libraryGameId: number,
  ): Promise<number> {
    try {
      const result = await supabase
        .from('library_reservations')
        .select('*', { count: 'exact', head: true })
        .eq('library_game_id', libraryGameId)
        .eq('tenant_id', tenantId)
        .eq('edition_id', editionId)

      return result.count || 0
    } catch (error) {
      logger.error('Error counting reservations by library game:', { error })
      return 0
    }
  },

  async post(
    tenantId: string,
    editionId: number,
    libraryGameId: number,
  ): Promise<void> {
    const { error } = await supabase.functions.invoke('library/reservations', {
      method: 'POST',
      body: {
        library_game_id: libraryGameId,
        tenant_id: tenantId,
        edition_id: editionId,
      },
    })

    if (error) {
      logger.error('Error creating reservation', { error })
      throw new Error('Failed to reserve game')
    }
  },

  async delete(
    tenantId: string,
    editionId: number,
    reservationId: number,
  ): Promise<void> {
    const { error } = await supabase
      .from('library_reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationId)
      .eq('tenant_id', tenantId)
      .eq('edition_id', editionId)

    if (error) {
      logger.error('Error cancelling reservation', { error })
      throw new Error('Failed to cancel reservation')
    }
  },

  subscribeToUpdates(
    tenantId: string,
    editionId: number,
    userId: string,
    onUpdate: ReservationUpdateCallback,
  ): () => void {
    // Initial load using async/await
    const initializeData = async (): Promise<void> => {
      const reservations = await this.get(tenantId, editionId, userId)
      onUpdate(reservations)
    }

    // Call the async function
    void initializeData()

    const handleDatabaseChange = (): void => {
      // Fetch fresh data and update if changed
      void this.get(tenantId, editionId, userId).then((freshReservations) => {
        onUpdate(freshReservations)
      })
    }

    // Listen to changes on library_reservations table
    const libraryReservationsChannel = supabase
      .channel('library-reservations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'library_reservations',
        },
        handleDatabaseChange,
      )
      .subscribe()

    // Return cleanup function to remove channel
    return () => {
      void supabase.removeChannel(libraryReservationsChannel)
    }
  },
} as const

// Provide proper default export
export default libraryReservationService
