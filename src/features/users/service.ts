import { supabase } from '@/lib/supabase'
import logger from '@/lib/logger.ts'
import { toCamelCaseAs } from '@/utils/caseConverter.ts'

export interface User {
  id: string
  name: string
  email: string
}

export const userService = {
  async search(query: string): Promise<User[]> {
    const url = new URL(
      `${import.meta.env.VITE_API_URL as string}/functions/v1/users`,
    )
    url.searchParams.set('q', query)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_API_ANON_PUBLIC_JWT as string,
      },
    })

    if (!response.ok) throw new Error('Failed to search users')
    const result = (await response.json()) as {
      results: User[]
    }
    return result?.results
  },

  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase.functions.invoke(`users/${id}`, {
      method: 'GET',
    })
    if (error) {
      logger.error('Unable to get user', { error })
      throw new Error('Unable to get user')
    }
    return data as User
  },

  async getByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .schema('public')
      .from('profiles')
      .select('id,name,email')
      .eq('email', email)
      .maybeSingle<{ id: string; name: string; email: string }>()

    if (error) {
      logger.error('Unable to get user', { error })
      throw new Error('Unable to get user')
    }

    if (data) return toCamelCaseAs<User>(data)
    else return undefined
  },

  async create(name: string | null, email: string): Promise<User> {
    const { data, error } = await supabase.functions.invoke('users', {
      body: {
        name,
        email,
      },
      method: 'POST',
    })

    if (data) return toCamelCaseAs<User>(data)
    else {
      logger.error('Unable to create user', { error })
      if ((error as { message: string })?.message)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        throw new Error(error.message as string)
      else throw new Error('Unable to create user')
    }
  },
}
