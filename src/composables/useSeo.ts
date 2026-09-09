import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useRoute } from 'vue-router'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { useEditionStore } from '@/features/events/edition.store'

export interface SeoInput {
  /** The page's own title. The site's name is appended; omit it here. */
  title?: MaybeRefOrGetter<string | undefined>
  /**
   * A phrase that follows the site's name, for the page that *is* the site.
   * Only the landing page uses it — everywhere else has a `title` of its own.
   */
  tagline?: MaybeRefOrGetter<string | undefined>
  description?: MaybeRefOrGetter<string | undefined>
  /** Absolute URL. Falls back to a tenant photo, then the edition poster. */
  image?: MaybeRefOrGetter<string | undefined>
  /**
   * Whether this call owns the page's canonical. Only `app.vue` sets it false:
   * it runs for every route and cannot know the path is one worth naming.
   */
  canonical?: boolean
  /**
   * Query parameters that are part of *which page this is*, and so belong in
   * the canonical. Everything else is dropped, so a tracking parameter cannot
   * fork one page into several.
   */
  canonicalQuery?: string[]
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
  const canonical = computed(() => {
    const kept = new URLSearchParams()

    for (const name of input.canonicalQuery ?? []) {
      const value = route.query[name]
      if (typeof value === 'string' && value) kept.set(name, value)
    }

    const query = kept.toString()
    return `${origin}${route.path}${query ? `?${query}` : ''}`
  })

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
    if (own) return `${own} · ${siteName.value}`

    // The site's name is what somebody who already knows the event searches
    // for; the tagline is for everybody else, and it goes second because the
    // name is the part worth recognising in a list of results.
    const tagline = toValue(input.tagline)
    return tagline ? `${siteName.value} · ${tagline}` : siteName.value
  })

  const description = computed(() => toValue(input.description))

  /**
   * A photo of the convention before the edition's poster.
   *
   * A link preview card is a wide letterbox and a poster is portrait, so a
   * poster in one is cropped to a band across its middle. `tenant.images` is
   * the gallery on the landing page — photographs, and the only thing we have
   * that is likely to be landscape. Neither is measured; we cannot know the
   * proportions of a URL, so this is an assumption about what each field is
   * for, and `card` below hedges it.
   */
  const image = computed(
    () =>
      toValue(input.image) ??
      tenantStore.tenant?.images?.[0] ??
      editionStore.edition?.poster_url ??
      tenantStore.tenant?.logos?.square ??
      tenantStore.tenant?.logo,
  )

  /**
   * `summary_large_image` only when the picture is one we expect to be wide.
   *
   * Falling back to the small square card is not a worse preview than a
   * portrait poster stretched across a banner — it is a better one, because
   * the whole image survives.
   */
  const card = computed(() =>
    (toValue(input.image) ?? tenantStore.tenant?.images?.[0])
      ? 'summary_large_image'
      : 'summary',
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
    ogImageAlt: computed(() => (image.value ? siteName.value : undefined)),

    twitterCard: card,
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
  })
}
