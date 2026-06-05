import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const insert = vi.fn(async () => ({ error: null }))
vi.mock('@/lib/supabase', () => ({
  createAdminSupabaseClient: () => ({
    from: () => ({ insert }),
  }),
}))

import { POST } from '@/app/api/events/route'

describe('legacy event endpoint', () => {
  beforeEach(() => {
    insert.mockClear()
    process.env.ROBLOX_API_SECRET = 'legacy-secret'
  })

  it('continues accepting the existing payload format', async () => {
    const response = await POST(new NextRequest('http://localhost/api/events', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 'legacy-secret',
      },
      body: JSON.stringify({
        event_type: 'join',
        player_name: 'LegacyPlayer',
        player_id: 123,
        cash: 10,
        highest_wave: 2,
        total_kills: 3,
        joined_at: '2026-06-05T00:00:00Z',
        inventory: [],
        items: [],
        equipped: [],
      }),
    }))

    expect(response.status).toBe(201)
    expect(insert).toHaveBeenCalledTimes(1)
  })
})
