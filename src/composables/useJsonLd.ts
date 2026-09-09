import { computed, toValue, type MaybeRefOrGetter } from 'vue'

/** A schema.org node. Deliberately loose: the shapes differ per page and the
 *  only thing this file enforces is that what goes out is safe to embed. */
export type JsonLd = Record<string, unknown>

/**
 * Puts a schema.org description of the page in its head.
 *
 * A convention is one of the few things search engines render specially —
 * dates, a venue and ticket prices can appear in the result itself rather than
 * only behind it — and all of that is already in the stores by the time a page
 * renders. Step 7 item 4 of `docs/ssr-migration.md`.
 *
 * Pass a getter that answers `null` when there is nothing worth saying:
 * incomplete structured data is worse than none, because it invites a search
 * engine to display a card with holes in it.
 */
export function useJsonLd(build: MaybeRefOrGetter<JsonLd | null>): void {
  const serialised = computed(() => {
    const data = toValue(build)
    if (!data) return null

    return (
      JSON.stringify({ '@context': 'https://schema.org', ...data })
        // A tenant writes their own event description, and a `</script>` in it
        // would end this block early and put the rest of the JSON in the page as
        // markup. The escapes are still valid JSON strings, so a parser reads
        // through them unchanged.
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026')
    )
  })

  useHead(
    computed(() => ({
      script: serialised.value
        ? [
            {
              type: 'application/ld+json',
              // `innerHTML` rather than `children`: unhead escapes the latter
              // as text, which would put `&quot;` through the whole document.
              innerHTML: serialised.value,
            },
          ]
        : [],
    })),
  )
}
