import { z } from 'zod'

const id = z.string().min(1).max(128)
const name = z.string().min(1).max(100)
const shortText = z.string().max(200)
const nonNegativeInt = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const positiveInt = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const timestamp = z.string().datetime({ offset: true })

const characterSchema = z.object({
  character_name: name,
  character_id: id,
  level: nonNegativeInt.max(1_000_000),
  mutation: shortText,
  trait: shortText,
}).strict()

const itemSchema = z.object({
  item_name: name,
  quantity: nonNegativeInt,
}).strict()

const fullStateSchema = z.object({
  player_id: positiveInt,
  player_name: name,
  cash: nonNegativeInt,
  highest_wave: nonNegativeInt,
  total_kills: nonNegativeInt,
  profile_version: nonNegativeInt.optional(),
  state_hash: z.string().max(256).optional(),
  inventory: z.array(characterSchema).max(500),
  items: z.array(itemSchema).max(500),
  equipped: z.array(characterSchema).max(50),
}).strict()

const envelopeFields = {
  event_id: z.string().uuid(),
  schema_version: z.literal(1),
  occurred_at: timestamp,
  server_job_id: z.string().min(1).max(200),
  place_id: positiveInt,
}

export const playerEventSchema = z.object({
  ...envelopeFields,
  event_type: z.enum(['join', 'leave']),
  payload: fullStateSchema.extend({
    joined_at: timestamp.optional(),
    left_at: timestamp.optional(),
    session_duration_seconds: nonNegativeInt.optional(),
  }).strict(),
}).strict()

export const fullSnapshotSchema = z.object({
  ...envelopeFields,
  event_type: z.literal('snapshot_full'),
  payload: fullStateSchema,
}).strict()

export const compactSnapshotSchema = z.object({
  ...envelopeFields,
  event_type: z.literal('snapshot_compact'),
  payload: z.object({
    player_id: positiveInt,
    player_name: name,
    cash: nonNegativeInt,
    highest_wave: nonNegativeInt,
    total_kills: nonNegativeInt,
    profile_version: nonNegativeInt.optional(),
    state_hash: z.string().max(256).optional(),
    changed_fields: z.record(z.string().max(100), z.unknown()).optional(),
  }).strict(),
}).strict()

export const giftSchema = z.object({
  ...envelopeFields,
  event_type: z.literal('gift'),
  payload: z.object({
    giver_name: name,
    giver_id: positiveInt,
    receiver_name: name,
    receiver_id: positiveInt,
    character_name: name,
    character_id: id,
    level: nonNegativeInt.max(1_000_000),
    mutation: shortText,
    trait: shortText,
  }).strict(),
}).strict()

export const saleSchema = z.object({
  ...envelopeFields,
  event_type: z.literal('sale'),
  payload: z.object({
    player_name: name,
    player_id: positiveInt,
    sale_type: z.enum(['SellOne', 'SellAll']),
    total_cash_received: nonNegativeInt,
    total_sold: nonNegativeInt.max(500),
    characters: z.array(characterSchema.extend({
      cash_received: nonNegativeInt,
    }).strict()).max(500),
  }).strict(),
}).strict()

export const purchaseSchema = z.object({
  ...envelopeFields,
  event_type: z.literal('purchase'),
  payload: z.object({
    player_name: name,
    player_id: positiveInt,
    product_name: name,
    robux_spent: nonNegativeInt.max(10_000_000),
    purchase_id: z.string().min(1).max(300).optional(),
  }).strict(),
}).strict()

export const securitySchema = z.object({
  ...envelopeFields,
  event_type: z.literal('security'),
  payload: z.object({
    category: z.string().min(1).max(100),
    severity: z.enum(['info', 'warning', 'critical']),
    player_id: positiveInt.optional(),
    player_name: name.optional(),
    details: z.record(z.string().max(100), z.unknown()).optional(),
  }).strict(),
}).strict()

export const ingestEventSchema = z.discriminatedUnion('event_type', [
  playerEventSchema,
  fullSnapshotSchema,
  compactSnapshotSchema,
  giftSchema,
  saleSchema,
  purchaseSchema,
  securitySchema,
])

export const ingestRequestShapeSchema = z.object({
  schema_version: z.literal(1),
  events: z.array(z.unknown()).min(1),
}).strict()

export type IngestEvent = z.infer<typeof ingestEventSchema>
