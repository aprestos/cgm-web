/**
 * Where the middleware puts the language it settled on, for the rest of the
 * request to read.
 *
 * A header rather than the cookie it came from, because a cached route varies
 * on header *names*: varying on `cookie` would put every session token in the
 * cache key and grow it without bound. This one has as many values as we have
 * languages, which `#shared/locales` lists.
 */
export const LOCALE_HEADER = 'x-app-locale'
