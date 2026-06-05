import { afterEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { validateRobloxApiKey } from '@/lib/auth'

const original = {
  current: process.env.ROBLOX_API_SECRET,
  previous: process.env.ROBLOX_API_SECRET_PREVIOUS,
}

afterEach(() => {
  process.env.ROBLOX_API_SECRET = original.current
  process.env.ROBLOX_API_SECRET_PREVIOUS = original.previous
})

describe('Roblox secret rotation', () => {
  it('accepts the current and temporary previous keys', () => {
    process.env.ROBLOX_API_SECRET = 'current'
    process.env.ROBLOX_API_SECRET_PREVIOUS = 'previous'
    const make = (key: string) => new NextRequest('http://localhost', { headers: { 'x-api-key': key } })
    expect(validateRobloxApiKey(make('current'))).toBe(true)
    expect(validateRobloxApiKey(make('previous'))).toBe(true)
    expect(validateRobloxApiKey(make('other'))).toBe(false)
  })
})
