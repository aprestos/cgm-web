import { describe, expect, it } from 'vitest'
import { toCamelCase, toSnakeCase } from '../caseConverter'

describe('caseConverter', () => {
  describe('toCamelCase', () => {
    it('converts flat object keys from snake_case to camelCase', () => {
      const input = { first_name: 'John', last_name: 'Doe', age: 30 }
      const result = toCamelCase(input)
      expect(result).toEqual({ firstName: 'John', lastName: 'Doe', age: 30 })
    })

    it('converts nested object keys', () => {
      const input = {
        user_info: { first_name: 'John', home_address: { zip_code: '12345' } },
      }
      const result = toCamelCase(input)
      expect(result).toEqual({
        userInfo: { firstName: 'John', homeAddress: { zipCode: '12345' } },
      })
    })

    it('converts arrays of objects', () => {
      const input = [
        { edition_id: 1, tenant_id: 'a' },
        { edition_id: 2, tenant_id: 'b' },
      ]
      const result = toCamelCase(input)
      expect(result).toEqual([
        { editionId: 1, tenantId: 'a' },
        { editionId: 2, tenantId: 'b' },
      ])
    })

    it('preserves keys that are already camelCase', () => {
      const input = { alreadyCamel: true, snake_case: false }
      const result = toCamelCase(input)
      expect(result).toEqual({ alreadyCamel: true, snakeCase: false })
    })

    it('handles empty objects', () => {
      expect(toCamelCase({})).toEqual({})
    })

    it('handles arrays of primitives inside objects', () => {
      const input = { tag_list: ['a', 'b', 'c'] }
      const result = toCamelCase(input)
      expect(result).toEqual({ tagList: ['a', 'b', 'c'] })
    })
  })

  describe('toSnakeCase', () => {
    it('converts flat object keys from camelCase to snake_case', () => {
      const input = { firstName: 'John', lastName: 'Doe', age: 30 }
      const result = toSnakeCase(input)
      expect(result).toEqual({ first_name: 'John', last_name: 'Doe', age: 30 })
    })

    it('converts nested object keys', () => {
      const input = {
        userInfo: { firstName: 'John', homeAddress: { zipCode: '12345' } },
      }
      const result = toSnakeCase(input)
      expect(result).toEqual({
        user_info: { first_name: 'John', home_address: { zip_code: '12345' } },
      })
    })

    it('converts arrays of objects', () => {
      const input = [
        { editionId: 1, tenantId: 'a' },
        { editionId: 2, tenantId: 'b' },
      ]
      const result = toSnakeCase(input)
      expect(result).toEqual([
        { edition_id: 1, tenant_id: 'a' },
        { edition_id: 2, tenant_id: 'b' },
      ])
    })

    it('handles empty objects', () => {
      expect(toSnakeCase({})).toEqual({})
    })

    it('roundtrips correctly with toCamelCase', () => {
      const original = {
        edition_id: 1,
        tenant_id: 'abc',
        valid_from: '2026-01-01',
      }
      const camel = toCamelCase(original)
      const backToSnake = toSnakeCase(camel as Record<string, unknown>)
      expect(backToSnake).toEqual(original)
    })
  })
})
