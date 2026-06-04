export type EventType = 'join' | 'leave' | 'update'

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

export interface GiftLog {
  id: string
  player_name: string
  player_id: number
  gift_item: string
  gift_value: number
  created_at: string
}

export interface Server {
  id: string
  server_id: string
  player_count: number
  last_ping: string
  created_at: string
}

export interface PlayerEventWithSnapshot extends PlayerEvent {
  inventory: PlayerInventory[]
  items: PlayerItem[]
  equipped: PlayerEquipped[]
}

export interface EventPayload {
  event_type: 'join' | 'leave' | 'update'
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

export interface GiftPayload {
  player_name: string
  player_id: number
  gift_item: string
  gift_value: number
}
