import type { IngestEvent } from '@/lib/ingestion/schemas'

export interface RejectedEvent {
  event_id: string
  reason: string
}

export interface IngestAcknowledgement {
  accepted_event_ids: string[]
  duplicate_event_ids: string[]
  rejected: RejectedEvent[]
}

export interface RpcResult {
  data: unknown
  error: { message: string } | null
}

export interface IngestionRpcClient {
  rpc(name: string, args: { p_events: IngestEvent[] }): PromiseLike<RpcResult>
}

const RPC_BY_TYPE: Record<IngestEvent['event_type'], string> = {
  join: 'ingest_player_events',
  leave: 'ingest_player_events',
  snapshot_full: 'ingest_player_snapshots',
  snapshot_compact: 'ingest_player_snapshots',
  gift: 'ingest_gifts',
  sale: 'ingest_sales',
  purchase: 'ingest_purchases',
  security: 'ingest_security_events',
}

function emptyAcknowledgement(): IngestAcknowledgement {
  return { accepted_event_ids: [], duplicate_event_ids: [], rejected: [] }
}

function normalizeAcknowledgement(data: unknown): IngestAcknowledgement {
  const value = typeof data === 'string' ? JSON.parse(data) as unknown : data
  if (!value || typeof value !== 'object') throw new Error('Invalid ingestion RPC response')
  const result = value as Partial<IngestAcknowledgement>
  return {
    accepted_event_ids: Array.isArray(result.accepted_event_ids) ? result.accepted_event_ids : [],
    duplicate_event_ids: Array.isArray(result.duplicate_event_ids) ? result.duplicate_event_ids : [],
    rejected: Array.isArray(result.rejected) ? result.rejected : [],
  }
}

export async function ingestEvents(
  client: IngestionRpcClient,
  events: IngestEvent[]
): Promise<IngestAcknowledgement> {
  const grouped = new Map<string, IngestEvent[]>()
  for (const event of events) {
    const rpc = RPC_BY_TYPE[event.event_type]
    const group = grouped.get(rpc) ?? []
    group.push(event)
    grouped.set(rpc, group)
  }

  const acknowledgement = emptyAcknowledgement()
  const results = await Promise.all(
    [...grouped].map(async ([rpc, group]) => {
      const { data, error } = await client.rpc(rpc, { p_events: group })
      if (error) throw new Error(`${rpc}: ${error.message}`)
      return normalizeAcknowledgement(data)
    })
  )

  for (const result of results) {
    acknowledgement.accepted_event_ids.push(...result.accepted_event_ids)
    acknowledgement.duplicate_event_ids.push(...result.duplicate_event_ids)
    acknowledgement.rejected.push(...result.rejected)
  }
  return acknowledgement
}
