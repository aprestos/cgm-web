import { Logtail } from '@logtail/browser'
import { getActivePinia } from 'pinia'
import { useTenantStore } from '@/features/tenant/tenant.store'

const isDevelopment =
  import.meta.env.VITE_ENVIRONMENT === 'development' || false
const token = import.meta.env.VITE_BETTER_STACK_TOKEN as string
const endpoint = import.meta.env.VITE_BETTER_STACK_ENDPOINT as string
const logLevel = (import.meta.env.VITE_LOG_LEVEL as string) || 'info'

enum LogLevel {
  DEBUG = 10,
  INFO = 20,
  WARN = 30,
  ERROR = 99,
}

const parseLogLevel = (level: string): number => {
  const levelMap: Record<string, number> = {
    debug: LogLevel.DEBUG,
    info: LogLevel.INFO,
    warn: LogLevel.WARN,
    error: LogLevel.ERROR,
  }
  return levelMap[level.toLowerCase()] ?? LogLevel.INFO
}

/**
 * Tenant id for the log context, when there is an app to read it from.
 *
 * Logging must never be the thing that throws, and it is reachable from
 * module scope and from failure paths that run before the app is installed,
 * so no active Pinia simply means the line carries no tenant.
 *
 * Never on a server: `getActivePinia()` is a module global, and between two
 * concurrent renders it points at whichever request suspended last. A log line
 * stamped with the wrong tenant is worse than one stamped with none.
 */
const tenantId = (): string | undefined =>
  typeof window !== 'undefined' && getActivePinia()
    ? useTenantStore().tenant?.id
    : undefined

const currentLogLevel = parseLogLevel(logLevel)

/**
 * The Better Stack sink, when there is one worth building.
 *
 * Browser only. `@logtail/browser` batches and flushes on browser lifecycle
 * events a render does not have, so on a server this answers undefined and
 * `shipFromServer` posts instead.
 */
function createLogtail(): Logtail | undefined {
  if (typeof window === 'undefined') return undefined

  if (isDevelopment) {
    console.log('Development environment detected, using console for logging.')
    return undefined
  }

  if (!token || !endpoint) {
    console.log(
      'Logtail token or endpoint not provided, using console for logging.',
    )
    return undefined
  }

  return new Logtail(token, {
    endpoint: `https://${endpoint}`,
  })
}

const logtail = createLogtail()

/** Whether anything anywhere is listening. */
const shipsSomewhere = !isDevelopment && !!token && !!endpoint

/**
 * A log line, from a server, to Better Stack's HTTP ingest.
 *
 * The SDK is not usable here — it is the browser build, and the node one would
 * be a dependency for the sake of a POST — so this is the same request it
 * would have made. Server lines used to go to the console and stop at
 * whatever was reading stdout.
 *
 * Fire and forget, and it swallows its own failures: logging is never allowed
 * to be the thing that breaks a render, and a line that does not arrive is a
 * smaller problem than a page that does not.
 */
function shipFromServer(
  level: string,
  message: string,
  content?: Record<string, unknown>,
): void {
  if (!shipsSomewhere) return

  void fetch(`https://${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      dt: new Date().toISOString(),
      level,
      message,
      // No tenant: reading it here means `getActivePinia()`, which between two
      // concurrent renders points at whichever request suspended last. A line
      // stamped with the wrong tenant is worse than one stamped with none.
      source: 'server',
      content,
    }),
  }).catch(() => {
    console.error(message, content)
  })
}

class Logger {
  info(message: string, content?: Record<string, unknown>): void {
    this.send(LogLevel.INFO, 'info', message, content)
  }

  warn(message: string, content?: Record<string, unknown>): void {
    this.send(LogLevel.WARN, 'warn', message, content)
  }

  error(message: string, content?: Record<string, unknown>): void {
    this.send(LogLevel.ERROR, 'error', message, content)
  }

  debug(message: string, content?: Record<string, unknown>): void {
    this.send(LogLevel.DEBUG, 'debug', message, content)
  }

  /**
   * One path for all four levels, and the only place that knows there are two
   * sinks. Below the configured level, or with nothing configured at all, a
   * line still goes to the console — which in a browser is the developer's and
   * on a server is whatever is reading stdout.
   */
  private send(
    level: number,
    name: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    content?: Record<string, unknown>,
  ): void {
    if (level < currentLogLevel || !shipsSomewhere) {
      console[name](message, content)
      return
    }

    if (typeof window === 'undefined') {
      shipFromServer(name, message, content)
      return
    }

    void logtail?.[name](message, {
      context: {
        tenant_id: tenantId(),
        event_id: tenantId(),
      },
      content,
    })

    // `debug` was the one level that never flushed; keeping that, since it is
    // the noisiest and the least worth a request each.
    if (name !== 'debug') void logtail?.flush()
  }
}

export default new Logger()
