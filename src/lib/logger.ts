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
 */
const tenantId = (): string | undefined =>
  getActivePinia() ? useTenantStore().tenant?.id : undefined

const currentLogLevel = parseLogLevel(logLevel)

let logtail: Logtail | undefined = undefined

if (isDevelopment) {
  console.log('Development environment detected, using console for logging.')
} else if (!token || !endpoint) {
  console.log(
    'Logtail token or endpoint not provided, using console for logging.',
  )
} else {
  logtail = new Logtail(token, {
    endpoint: `https://${endpoint}`,
  })
}

class Logger {
  info(message: string, content?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      void logtail?.info(message, {
        context: {
          tenant_id: tenantId(),
          event_id: tenantId(),
        },
        content,
      })
      void logtail?.flush()
    } else {
      console.info(message, content)
    }
  }

  warn(message: string, content?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      void logtail?.warn(message, {
        context: {
          tenant_id: tenantId(),
          event_id: tenantId(),
        },
        content,
      })
      void logtail?.flush()
    } else {
      console.warn(message, content)
    }
  }

  error(message: string, content?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      void logtail?.error(message, {
        context: {
          tenant_id: tenantId(),
          event_id: tenantId(),
        },
        content,
      })
      void logtail?.flush()
    } else {
      console.error(message, content)
    }
  }

  debug(message: string, content?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      void logtail?.debug(message, {
        context: {
          tenant_id: tenantId(),
          event_id: tenantId(),
        },
        content,
      })
    } else {
      console.debug(message, content)
    }
  }
  private shouldLog(level: number): boolean {
    return !!logtail && !isDevelopment && level >= currentLogLevel
  }
}

export default new Logger()
