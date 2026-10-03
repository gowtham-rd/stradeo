import { supabase } from './supabase'

// POST to one of Stradeo's AI routes with the user's session token attached.
/** True when the server says the Claude key isn't set up yet. */
export const AI_NOT_READY = 503
/** The user has used today's AI allowance. */
export const AI_LIMIT = 429

export async function aiPost(path: string, body: unknown): Promise<Response> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}
