import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useRoute } from 'vue-router'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useEditionStore } from '@/features/events/edition.store'

export interface SeoInput {
  /** The page's own title. The site's name is appended; omit it here. */
  title?: MaybeRefOrGetter<string | undefined>
  description?: MaybeRefOrGetter<string | undefined>
  /** Absolute URL. Falls back to the edition poster, then the tenant's logo. */
  image?: MaybeRefOrGetter<string | undefined>
  /**
   * Whether this call owns the page's canonical. Only `app.vue` sets it false:
   * it runs for every route and cannot know the path is one worth naming.
   */
  canonical?: boolean
  /** For pages that exist but are not worth indexing: checkout, 404, stubs. */
  noindex?: MaybeRefOrGetter<boolean | undefined>
}

/**
 * Everything a crawler or a link preview reads about the current page.
 *
 * Until step 7 there was one `<title>` for the whole app and no description,
 * canonical or `og:` tags anywhere — every page of every tenant looked to a
 * crawler like the same page. See `docs/ssr-migration.md`.
 *
 * The canonical is built from the request's own origin, which is the only way
 * it can be right when the same routes are served on a domain per tenant, and
 * from `route.path` so that a query string does not fork a page into several.
 */
export function useSeo(input: SeoInput = {}): void {
  const route = useRoute()
  const tenantStore = useTenantStore()
  const editionStore = useEditionStore()

  // The origin is fixed for the life of the app — a tenant is one host — while
  // the path is not, so only the path is reactive.
  const origin = useRequestURL({ xForwardedHost: true }).origin
  const canonical = computed(() => `${origin}${route.path}`)

  /**
   * What the site is called on this host: the edition's name rather than the
   * tenant's, because that is what the event is called this year and what
   * somebody would search for. A host that resolved to no tenant has neither.
   *
   * Read off the stores captured above rather than by calling `useStore()` in
   * here. A head computed is evaluated when the head is resolved, which is
   * after this setup has returned and there is no active Pinia to find — the
   * same trap as `plugins/tenant.ts` and the services in 4c, one layer up
   * again.
   */
  const siteName = computed(
    () =>
      editionStore.edition?.name ?? tenantStore.tenant?.name ?? 'congrem.io',
  )
  const title = computed(() => {
    const own = toValue(input.title)
    return own ? `${own} · ${siteName.value}` : siteName.value
  })

  const description = computed(() => toValue(input.description))

  const image = computed(
    () =>
      toValue(input.image) ??
      editionStore.edition?.poster_url ??
      tenantStore.tenant?.logos?.square ??
      tenantStore.tenant?.logo,
  )

  // No canonical on a page we are asking not to be indexed: it would name the
  // very URL the `robots` tag is telling a crawler to leave alone, and on the
  // 404 it would point at a URL that does not exist. An empty `link` array
  // cannot retract one another call already added, which is why `app.vue` does
  // not add one at all.
  if (input.canonical !== false) {
    useHead(
      computed(() => ({
        link: toValue(input.noindex)
          ? []
          : [{ rel: 'canonical', href: canonical.value }],
      })),
    )
  }

  useSeoMeta({
    title,
    description,
    // `noindex` on its own still lets a crawler follow the links out of the
    // page, which is what we want on checkout and a 404 — both link back into
    // pages that should be indexed.
    robots: computed(() =>
      toValue(input.noindex) ? 'noindex, follow' : 'index, follow',
    ),

    ogType: 'website',
    ogSiteName: siteName,
    ogUrl: canonical,
    ogTitle: title,
    ogDescription: description,
    ogImage: image,

    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
  })
}
