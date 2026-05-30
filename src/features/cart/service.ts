import { supabase } from '@/lib/supabase'
import { toCamelCaseAs, toSnakeCaseAs } from '@/utils/caseConverter'
import type { Cart } from '@/features/cart/model.ts'

interface SaveCartItemsInput {
  tenantId: string
  cartId: string
  items: Array<{
    ticketId: number
    quantity: number
  }>
}

const client = supabase.schema('commerce')

export const cartService = {
  async getByOwner(tenantId: string, ownerId: string): Promise<Cart | null> {
    const { data, error } = await client
      .from('carts')
      .select(
        'id, owner_id, tenant_id, updated_at, items:cart_items(id, ticket_id, quantity)',
      )
      .eq('tenant_id', tenantId)
      .eq('owner_id', ownerId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data ? toCamelCaseAs<Cart>(data) : null
  },

  /**
   * Create a new cart
   */
  async create(tenantId: string, ownerId: string): Promise<Cart> {
    const input = toSnakeCaseAs<Record<string, unknown>>({
      tenantId,
      ownerId,
    } as Record<string, unknown>)

    const result = await client.from('carts').insert(input).select().single()

    const data = result.data as Record<string, unknown> | null
    const error = result.error

    if (error) throw error
    if (!data) throw new Error('Cart was not created')
    return toCamelCaseAs<Cart>(data)
  },

  async getOrCreate(tenantId: string, ownerId: string): Promise<Cart> {
    const existingByOwner = await this.getByOwner(tenantId, ownerId)
    if (existingByOwner) {
      return existingByOwner
    }

    return this.create(tenantId, ownerId)
  },

  async saveItems(input: SaveCartItemsInput): Promise<void> {
    const { tenantId, cartId, items } = input

    const { error: deleteError } = await client
      .from('cart_items')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('cart_id', cartId)

    if (deleteError) throw deleteError

    if (items.length > 0) {
      const payload = items.map((item) =>
        toSnakeCaseAs<Record<string, unknown>>({
          cartId,
          tenantId,
          ticketId: item.ticketId,
          quantity: item.quantity,
        }),
      )

      const { error: insertError } = await client
        .from('cart_items')
        .insert(payload)

      if (insertError) throw insertError
    }

    const { error: cartUpdateError } = await client
      .from('carts')
      .update({ updated_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .eq('id', cartId)

    if (cartUpdateError) throw cartUpdateError
  },
}

export default cartService
