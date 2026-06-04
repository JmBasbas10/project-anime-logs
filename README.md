# Anime Logs — Roblox Game Dashboard

A full-stack dashboard built with **Next.js 16**, **Supabase**, **Tailwind CSS**, and **shadcn/ui** for monitoring Roblox game events in real time.

---

## Features

- **Player Logs** — join/leave events with expandable inventory, items, and equipped snapshots
- **Gift Logs** — all gift transactions with player, item, and value
- **Active Servers** — live server list with player count and last ping
- **Player Lookup** — full session history for any player by username
- **Auth** — Discord OAuth via Supabase (dashboard protected)
- **API** — REST endpoints for Roblox game server and Discord bot integration

---

## Running Locally

**1. Install dependencies**

```bash
npm install
```

**2. Set up environment variables**

```bash
cp .env.local.example .env.local
```

Fill in all values in `.env.local` (see [Environment Variables](#environment-variables) below).

**3. Enable Discord OAuth in Supabase**

In your Supabase project → Authentication → Providers → Discord, enable it and add the callback URL:

```
https://your-project.supabase.co/auth/v1/callback
```

**4. Start the dev server**

```bash
npm run dev
```

Open `http://localhost:3000`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key — used server-side only to bypass RLS |
| `ROBLOX_API_SECRET` | Yes | Secret shared with your Roblox game server, sent as `x-api-key` header |
| `DISCORD_BOT_API_KEY` | Yes | Read-only key for your Discord bot, also sent as `x-api-key` header |

---

## API Routes

All routes live under `/app/api/`. Authentication is header-based — no cookies.

### POST `/api/events`

Receives a join or leave event from the Roblox game server.

**Auth:** `x-api-key: <ROBLOX_API_SECRET>`

**Request body:**

```json
{
  "event_type": "join",
  "player_name": "abruti01",
  "player_id": 2838362380,
  "cash": 50991,
  "highest_wave": 62,
  "total_kills": 5908,
  "joined_at": "2026-06-04T05:22:32Z",
  "left_at": "2026-06-04T05:45:00Z",
  "session_duration_seconds": 1348,
  "inventory": [
    { "character_name": "Saitama", "character_id": "22cd98b8-...", "level": 1, "mutation": "Normal", "trait": "None" }
  ],
  "items": [
    { "item_name": "Rare Fragment", "quantity": 5 }
  ],
  "equipped": [
    { "character_name": "Gojo", "character_id": "199ab327-...", "level": 1, "mutation": "Normal", "trait": "Far Sight II" }
  ]
}
```

**Response:** `201 { "id": "<uuid>" }`

---

### POST `/api/gifts`

Receives a gift event from the Roblox game server.

**Auth:** `x-api-key: <ROBLOX_API_SECRET>`

**Request body:**

```json
{
  "player_name": "abruti01",
  "player_id": 2838362380,
  "gift_item": "Rare Fragment",
  "gift_value": 100
}
```

**Response:** `201 { "id": "<uuid>" }`

---

### GET `/api/logs`

Returns paginated player events with all snapshot data joined.

**Auth:** `x-api-key: <ROBLOX_API_SECRET>` or `x-api-key: <DISCORD_BOT_API_KEY>`

**Query params:**

| Param | Default | Description |
|---|---|---|
| `page` | `1` | Page number |
| `limit` | `50` | Results per page (max 100) |
| `event_type` | — | Filter by `join` or `leave` |

**Response:**

```json
{
  "data": [ ...player_events with inventory/items/equipped arrays... ],
  "pagination": { "page": 1, "limit": 50, "total": 240, "pages": 5 }
}
```

---

### GET `/api/gifts`

Returns paginated gift logs.

**Auth:** `x-api-key: <ROBLOX_API_SECRET>` or `x-api-key: <DISCORD_BOT_API_KEY>`

**Query params:** `page`, `limit`

---

### GET `/api/servers`

Returns all active servers sorted by most recent ping.

**Auth:** `x-api-key: <ROBLOX_API_SECRET>` or `x-api-key: <DISCORD_BOT_API_KEY>`

---

### GET `/api/players/[username]`

Returns full session history for a player including all snapshots.

**Auth:** `x-api-key: <ROBLOX_API_SECRET>` or `x-api-key: <DISCORD_BOT_API_KEY>`

**Response:**

```json
{
  "username": "abruti01",
  "sessions": [ ...player_events with inventory/items/equipped arrays... ]
}
```

---

## Supabase Tables

These tables must exist in your Supabase project. The app types against them but does **not** create them.

```sql
-- player_events
id uuid PK, player_name text, player_id bigint,
event_type text (join|leave), cash bigint, highest_wave int,
total_kills bigint, joined_at timestamptz, left_at timestamptz,
session_duration_seconds int, created_at timestamptz

-- player_inventory
id uuid PK, event_id uuid FK→player_events.id,
character_name text, character_id text, level int, mutation text, trait text

-- player_items
id uuid PK, event_id uuid FK→player_events.id,
item_name text, quantity int

-- player_equipped
id uuid PK, event_id uuid FK→player_events.id,
character_name text, character_id text, level int, mutation text, trait text

-- gift_logs
id uuid PK, player_name text, player_id bigint,
gift_item text, gift_value numeric, created_at timestamptz

-- servers
id uuid PK, server_id text, player_count int,
last_ping timestamptz, created_at timestamptz
```

---

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router)
- [Supabase](https://supabase.com) — database + auth
- [Tailwind CSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- TypeScript
