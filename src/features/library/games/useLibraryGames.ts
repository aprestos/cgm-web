import { computed, type ComputedRef } from 'vue'
import type { LibraryGame } from '@/features/library/games/game.model'
import { libraryService } from '@/features/library/games/service'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useEditionStore } from '@/features/events/edition.store'

/** Shared so the page and the list it contains resolve to one request. */
export const LIBRARY_GAMES_KEY = 'library-games'

/**
 * The library for the current tenant and edition, fetched during the render.
 *
 * A composable rather than a fetch inside `GameList`, because two components
 * need it and neither owns it: `GameList` draws the games, and
 * `PageLibraryHome` counts them for the page's title, its structured data and
 * its pagination links. Calling this twice makes one request — `useAsyncData`
 * hands the second caller the first one's data, which is what the shared key
 * is for.
 *
 * **Await this before anything that reads it**, including a head computed: a
 * `const` filled after a top-level `await` is in its temporal dead zone until
 * then, and unhead resolves the head while the await is still suspended. See
 * step 7.1 of `docs/ssr-migration.md` for what that looks like when it goes
 * wrong.
 *
 * `libraryService.get` handles its own errors and answers `[]`, so there is
 * nothing here that can turn a slow database into a 500.
 */
export async function useLibraryGames(): Promise<ComputedRef<LibraryGame[]>> {
  const tenantStore = useTenantStore()
  const editionStore = useEditionStore()

  const { data } = await useAsyncData(
    LIBRARY_GAMES_KEY,
    async (): Promise<LibraryGame[]> => {
      const tenantId = tenantStore.tenant?.id
      const editionId = editionStore.edition?.id
      if (!tenantId || !editionId) return []

      return await libraryService.get(tenantId, editionId)
    },
    { default: (): LibraryGame[] => [] },
  )

  return computed(() => data.value ?? [])
}
