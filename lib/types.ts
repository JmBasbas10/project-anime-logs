export type EventType = 'join' | 'leave'

// ── player_events + child snapshot tables ────────────────────────────────────
export interface PlayerEvent {
  id: string
  player_name: string
  player_id: number
  event_type: EventType
  cash: number
  highest_wave: number
  total_kills: number
  joined_at: string
  left_at: string | null
  session_duration_seconds: number | null
  created_at: string
}

export interface PlayerInventory {
  id: string
  event_id: string
  character_name: string
  character_id: string
  level: number
  mutation: string
  trait: string
}

export interface PlayerItem {
  id: string
  event_id: string
  item_name: string
  quantity: number
}

export interface PlayerEquipped {
  id: string
  event_id: string
  character_name: string
  character_id: string
  level: number
  mutation: string
  trait: string
}

export interface PlayerEventWithSnapshot extends PlayerEvent {
  inventory: PlayerInventory[]
  items: PlayerItem[]
  equipped: PlayerEquipped[]
}

export interface EventPayload {
  event_type: EventType
  player_name: string
  player_id: number
  cash: number
  highest_wave: number
  total_kills: number
  joined_at: string
  left_at?: string
  session_duration_seconds?: number
  inventory: Array<Omit<PlayerInventory, 'id' | 'event_id'>>
  items: Array<Omit<PlayerItem, 'id' | 'event_id'>>
  equipped: Array<Omit<PlayerEquipped, 'id' | 'event_id'>>
}

// ── player_snapshots + child tables ──────────────────────────────────────────
export interface PlayerSnapshot {
  id: string
  player_id: number
  player_name: string
  cash: number
  highest_wave: number
  total_kills: number
  batch_timestamp: string
  created_at: string
}

export interface SnapshotInventory {
  id: string
  snapshot_id: string
  character_name: string
  character_id: string
  level: number
  mutation: string
  trait: string
}

export interface SnapshotItem {
  id: string
  snapshot_id: string
  item_name: string
  quantity: number
}

export interface SnapshotEquipped {
  id: string
  snapshot_id: string
  character_name: string
  character_id: string
  level: number
  mutation: string
  trait: string
}

export interface PlayerSnapshotWithData extends PlayerSnapshot {
  inventory: SnapshotInventory[]
  items: SnapshotItem[]
  equipped: SnapshotEquipped[]
}

// ── batch payload ─────────────────────────────────────────────────────────────
export interface BatchPlayerPayload {
  player_name: string
  player_id: number
  cash: number
  highest_wave: number
  total_kills: number
  inventory: Array<Omit<SnapshotInventory, 'id' | 'snapshot_id'>>
  items: Array<Omit<SnapshotItem, 'id' | 'snapshot_id'>>
  equipped: Array<Omit<SnapshotEquipped, 'id' | 'snapshot_id'>>
}

export interface BatchPayload {
  timestamp: string
  players: BatchPlayerPayload[]
}

// ── gift_logs (character transfer between two players) ───────────────────────
export interface GiftLog {
  id: string
  giver_name: string
  giver_id: number
  receiver_name: string
  receiver_id: number
  character_name: string
  character_id: string
  level: number
  mutation: string
  trait: string
  created_at: string
  archived?: boolean
}

export interface BulkGiftPayload {
  gifts: Array<{
    giver_name: string
    giver_id: number
    receiver_name: string
    receiver_id: number
    character_name: string
    character_id: string
    level: number
    mutation: string
    trait: string
    timestamp?: string
  }>
}

// ── servers ───────────────────────────────────────────────────────────────────
export interface Server {
  id: string
  server_id: string
  player_count: number
  last_ping: string
  created_at: string
}
