import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    fetch: (url, options = {}) => {
      const headers = new Headers()
      headers.set('Content-Type', 'application/json')
      headers.set('apikey', SUPABASE_KEY)
      headers.set('Authorization', `Bearer ${SUPABASE_KEY}`)
      if (options.body) headers.set('Prefer', 'return=representation')
      return fetch(url, { ...options, headers })
    }
  }
})
