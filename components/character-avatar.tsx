'use client'

import { useEffect, useState } from 'react'

// Resolves anime character images via the free Jikan (MyAnimeList) API.
// Results are cached in localStorage + memory; requests are queued to respect
// Jikan's ~3 req/sec rate limit. Unmatched names fall back to an initial avatar.

const memCache = new Map<string, string | null>()
const STORAGE_PREFIX = 'charimg:'

// ── simple sequential queue (≈3 req/sec) ──────────────────────────────────────
let chain: Promise<void> = Promise.resolve()
function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn)
  chain = run.then(() => new Promise(r => setTimeout(r, 350)), () => new Promise(r => setTimeout(r, 350)))
  return run
}

async function resolveImage(name: string): Promise<string | null> {
  const key = name.trim().toLowerCase()
  if (memCache.has(key)) return memCache.get(key) ?? null

  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key)
    if (stored !== null) {
      const val = stored || null
      memCache.set(key, val)
      return val
    }
  } catch { /* localStorage unavailable */ }

  const img = await enqueue(async () => {
    try {
      const res = await fetch(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(name)}&limit=1`)
      if (!res.ok) return null
      const json = await res.json()
      const c = json?.data?.[0]?.images
      return (c?.webp?.image_url || c?.jpg?.image_url || null) as string | null
    } catch {
      return null
    }
  })

  memCache.set(key, img)
  try { localStorage.setItem(STORAGE_PREFIX + key, img ?? '') } catch { /* ignore */ }
  return img
}

function colorFor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return `hsl(${h} 45% 35%)`
}

interface Props {
  name: string
  size?: number
}

export function CharacterAvatar({ name, size = 32 }: Props) {
  const key = name.trim().toLowerCase()
  const [src, setSrc] = useState<string | null>(() => memCache.get(key) ?? null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    resolveImage(name).then(img => { if (active) setSrc(img) })
    return () => { active = false }
  }, [name])

  const showImg = src && !failed

  return (
    <span
      className="d-inline-flex align-items-center justify-content-center rounded-circle overflow-hidden flex-shrink-0"
      style={{
        width: size, height: size,
        background: showImg ? 'transparent' : colorFor(name),
        fontSize: size * 0.42, fontWeight: 600, color: '#fff',
        border: '1px solid var(--bs-border-color)',
      }}
      title={name}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          onError={() => setFailed(true)}
        />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  )
}
