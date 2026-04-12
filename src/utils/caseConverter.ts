/**
 * Utility for converting between snake_case (DB) and camelCase (app) at the service boundary.
 *
 * Usage:
 *   - Define your models in camelCase (TypeScript convention)
 *   - Use `toCamelCase()` when reading FROM the database
 *   - Use `toSnakeCase()` when writing TO the database
 *   - Apply these ONLY in the service layer
 */

// ─── Type-level conversion ───────────────────────────────────────────────────

/** Converts a snake_case string to camelCase at the type level */
type SnakeToCamel<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Head}${Capitalize<SnakeToCamel<Tail>>}`
  : S

/** Converts a camelCase string to snake_case at the type level */
type CamelToSnake<S extends string> = S extends `${infer Head}${infer Tail}`
  ? Head extends Uppercase<Head>
    ? Head extends Lowercase<Head>
      ? `${Head}${CamelToSnake<Tail>}`
      : `_${Lowercase<Head>}${CamelToSnake<Tail>}`
    : `${Head}${CamelToSnake<Tail>}`
  : S

/** Recursively converts all keys of an object from snake_case to camelCase */
export type CamelCaseKeys<T> =
  T extends Array<infer U>
    ? Array<CamelCaseKeys<U>>
    : T extends Record<string, unknown>
      ? {
          [K in keyof T as K extends string
            ? SnakeToCamel<K>
            : K]: CamelCaseKeys<T[K]>
        }
      : T

/** Recursively converts all keys of an object from camelCase to snake_case */
export type SnakeCaseKeys<T> =
  T extends Array<infer U>
    ? Array<SnakeCaseKeys<U>>
    : T extends Record<string, unknown>
      ? {
          [K in keyof T as K extends string
            ? CamelToSnake<K>
            : K]: SnakeCaseKeys<T[K]>
        }
      : T

// ─── Runtime conversion ─────────────────────────────────────────────────────

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  )
}

/** Converts all keys of an object from snake_case to camelCase (recursive) */
export function toCamelCase<T extends Record<string, unknown>>(
  obj: T,
): CamelCaseKeys<T>
export function toCamelCase<T extends Record<string, unknown>>(
  obj: T[],
): Array<CamelCaseKeys<T>>
export function toCamelCase<T extends Record<string, unknown>>(
  obj: T | T[],
): CamelCaseKeys<T> | Array<CamelCaseKeys<T>> {
  if (Array.isArray(obj)) {
    return obj.map((item) => toCamelCase(item))
  }

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key)
    if (Array.isArray(value)) {
      result[camelKey] = value.map((item: unknown) =>
        isPlainObject(item) ? toCamelCase(item) : item,
      )
    } else if (isPlainObject(value)) {
      result[camelKey] = toCamelCase(value)
    } else {
      result[camelKey] = value
    }
  }
  return result as CamelCaseKeys<T>
}

/**
 * Converts snake_case keys to camelCase and asserts the result as the target type.
 * Use when the input is loosely typed (e.g. Supabase without generated DB types)
 * and you know the expected output shape.
 *
 * @example
 *   // Instead of: toCamelCase(data) as unknown as Ticket
 *   toCamelCaseAs<Ticket>(data)
 */
export function toCamelCaseAs<TTarget>(obj: Record<string, unknown>): TTarget
export function toCamelCaseAs<TTarget>(
  obj: Record<string, unknown>[],
): TTarget[]
export function toCamelCaseAs<TTarget>(
  obj: Record<string, unknown> | Record<string, unknown>[],
): TTarget | TTarget[] {
  return toCamelCase(obj as Record<string, unknown>) as TTarget
}

/** Converts all keys of an object from camelCase to snake_case (recursive) */
export function toSnakeCase<T extends Record<string, unknown>>(
  obj: T,
): SnakeCaseKeys<T>
export function toSnakeCase<T extends Record<string, unknown>>(
  obj: T[],
): Array<SnakeCaseKeys<T>>
export function toSnakeCase<T extends Record<string, unknown>>(
  obj: T | T[],
): SnakeCaseKeys<T> | Array<SnakeCaseKeys<T>> {
  if (Array.isArray(obj)) {
    return obj.map((item) => toSnakeCase(item))
  }

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key)
    if (Array.isArray(value)) {
      result[snakeKey] = value.map((item: unknown) =>
        isPlainObject(item) ? toSnakeCase(item) : item,
      )
    } else if (isPlainObject(value)) {
      result[snakeKey] = toSnakeCase(value)
    } else {
      result[snakeKey] = value
    }
  }
  return result as SnakeCaseKeys<T>
}

/**
 * Converts camelCase keys to snake_case and asserts the result as the target type.
 * Use when you need a specific snake_case shape for database writes.
 *
 * @example
 *   // Instead of: toSnakeCase(input as unknown as Record<string, unknown>)
 *   toSnakeCaseAs<InsertRow>(input)
 */
export function toSnakeCaseAs<TTarget>(obj: Record<string, unknown>): TTarget
export function toSnakeCaseAs<TTarget>(
  obj: Record<string, unknown>[],
): TTarget[]
export function toSnakeCaseAs<TTarget>(
  obj: Record<string, unknown> | Record<string, unknown>[],
): TTarget | TTarget[] {
  return toSnakeCase(obj as Record<string, unknown>) as TTarget
}
