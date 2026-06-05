import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import EmbeddedPostgres from 'embedded-postgres'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'
import type { Client } from 'pg'
import { NextRequest } from 'next/server'
import { handleIngestRequest } from '@/lib/ingestion/handler'
import type { IngestionRpcClient } from '@/lib/ingestion/service'

const databaseDir = join(tmpdir(), `anime-logs-postgres-${randomUUID()}`)
const port = 55432 + Math.floor(Math.random() * 500)
const postgres = new EmbeddedPostgres({
  databaseDir,
  port,
  user: 'postgres',
  password: 'postgres',
  persistent: false,
  onLog: () => {},
})

let client: Client

const event = (id: string, overrides: Record<string, unknown> = {}) => ({
  event_id: id,
  event_type: 'join',
  schema_version: 1,
  occurred_at: '2026-06-05T00:00:00Z',
  server_job_id: 'job-1',
  place_id: 123,
  payload: {
    player_id: 1,
    player_name: 'Player',
    cash: 100,
    highest_wave: 2,
    total_kills: 3,
    inventory: [],
    items: [],
    equipped: [],
  },
  ...overrides,
})

const purchase = (eventId: string, purchaseId: string) => ({
  event_id: eventId,
  event_type: 'purchase',
  schema_version: 1,
  occurred_at: '2026-06-05T00:00:00Z',
  server_job_id: 'job-1',
  place_id: 123,
  payload: {
    player_id: 1,
    player_name: 'Player',
    product_name: 'Product',
    robux_spent: 100,
    purchase_id: purchaseId,
  },
})

async function rpc(name: string, events: unknown[], queryClient = client) {
  const result = await queryClient.query(`select public.${name}($1::jsonb) as result`, [
    JSON.stringify(events),
  ])
  return result.rows[0].result as {
    accepted_event_ids: string[]
    duplicate_event_ids: string[]
    rejected: Array<{ event_id: string; reason: string }>
  }
}

beforeAll(async () => {
  await postgres.initialise()
  await postgres.start()
  client = postgres.getPgClient()
  await client.connect()

  for (const file of [
    'tests/postgres/production-schema.sql',
    'supabase/migrations/202606050001_scalability_indexes.sql',
    'supabase/migrations/202606050002_reliable_ingestion.sql',
  ]) {
    await client.query(await readFile(join(process.cwd(), file), 'utf8'))
  }
}, 120_000)

afterAll(async () => {
  await client?.end()
  await postgres.stop()
}, 60_000)

describe.sequential('Postgres ingestion RPCs', () => {
  it('applies both migrations against the production-shaped schema', async () => {
    const functions = await client.query(`
      select count(*)::integer as count
      from pg_proc
      where proname like 'ingest_%'
    `)
    expect(functions.rows[0].count).toBe(6)
  })

  it('acknowledges a retry of the same source_event_id', async () => {
    const id = randomUUID()
    expect((await rpc('ingest_player_events', [event(id)])).accepted_event_ids).toEqual([id])
    expect((await rpc('ingest_player_events', [event(id)])).duplicate_event_ids).toEqual([id])
    const count = await client.query('select count(*)::integer as count from player_events where source_event_id = $1', [id])
    expect(count.rows[0].count).toBe(1)
  })

  it('handles concurrent retries of the same source_event_id', async () => {
    const id = randomUUID()
    const second = postgres.getPgClient()
    await second.connect()
    try {
      const results = await Promise.all([
        rpc('ingest_player_events', [event(id)]),
        rpc('ingest_player_events', [event(id)], second),
      ])
      expect(results.flatMap((result) => result.accepted_event_ids)).toEqual([id])
      expect(results.flatMap((result) => result.duplicate_event_ids)).toEqual([id])
    } finally {
      await second.end()
    }
  })

  it('rolls back the parent when child insertion fails', async () => {
    const id = randomUUID()
    const broken = event(id)
    broken.payload.inventory = [{
      character_name: 'Broken',
      character_id: 'broken',
      level: null,
      mutation: 'Normal',
      trait: 'None',
    }] as never[]
    const result = await rpc('ingest_player_events', [broken])
    expect(result.rejected).toHaveLength(1)
    const count = await client.query('select count(*)::integer as count from player_events where source_event_id = $1', [id])
    expect(count.rows[0].count).toBe(0)
  })

  it('keeps valid neighboring events when one event has permanent invalid data', async () => {
    const validId = randomUUID()
    const invalidId = randomUUID()
    const invalid = event(invalidId)
    invalid.payload.cash = 'not-a-number' as never
    const result = await rpc('ingest_player_events', [invalid, event(validId)])
    expect(result.accepted_event_ids).toEqual([validId])
    expect(result.rejected[0].event_id).toBe(invalidId)
  })

  it('allows temporary database failures to escape the RPC', async () => {
    await client.query(`
      create or replace function test_temporary_failure() returns trigger
      language plpgsql as $$
      begin
        if new.giver_name = 'TEMPORARY_FAILURE' then
          raise exception using errcode = '40001', message = 'retry transaction';
        end if;
        return new;
      end $$;
      create trigger gift_temporary_failure before insert on gift_logs
      for each row execute function test_temporary_failure();
    `)
    const id = randomUUID()
    const gift = {
      event_id: id, event_type: 'gift', schema_version: 1,
      occurred_at: '2026-06-05T00:00:00Z', server_job_id: 'job-1', place_id: 123,
      payload: {
        giver_name: 'TEMPORARY_FAILURE', giver_id: 1, receiver_name: 'Two', receiver_id: 2,
        character_name: 'Hero', character_id: randomUUID(), level: 1,
        mutation: 'Normal', trait: 'None',
      },
    }
    await expect(rpc('ingest_gifts', [gift])).rejects.toMatchObject({ code: '40001' })
    await client.query('drop trigger gift_temporary_failure on gift_logs')
  })

  it('maps a real temporary database failure to an API 503', async () => {
    await client.query(`
      create trigger gift_temporary_failure before insert on gift_logs
      for each row execute function test_temporary_failure();
    `)
    const id = randomUUID()
    const gift = {
      event_id: id, event_type: 'gift', schema_version: 1,
      occurred_at: '2026-06-05T00:00:00Z', server_job_id: 'job-1', place_id: 123,
      payload: {
        giver_name: 'TEMPORARY_FAILURE', giver_id: 1, receiver_name: 'Two', receiver_id: 2,
        character_name: 'Hero', character_id: randomUUID(), level: 1,
        mutation: 'Normal', trait: 'None',
      },
    }
    const rpcClient: IngestionRpcClient = {
      rpc: async (name, args) => {
        try {
          return { data: await rpc(name, args.p_events), error: null }
        } catch (error) {
          return { data: null, error: { message: error instanceof Error ? error.message : 'database failure' } }
        }
      },
    }
    const response = await handleIngestRequest(new NextRequest('http://localhost/api/v1/ingest', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ schema_version: 1, events: [gift] }),
    }), rpcClient, 'postgres-temporary-failure')
    expect(response.status).toBe(503)
    await client.query('drop trigger gift_temporary_failure on gift_logs')
  })

  it('does not acknowledge an unrelated unique violation as a duplicate', async () => {
    await client.query('create unique index gift_logs_character_id_test_uidx on gift_logs(character_id)')
    const characterId = randomUUID()
    const makeGift = (id: string) => ({
      event_id: id, event_type: 'gift', schema_version: 1,
      occurred_at: '2026-06-05T00:00:00Z', server_job_id: 'job-1', place_id: 123,
      payload: {
        giver_name: 'One', giver_id: 1, receiver_name: 'Two', receiver_id: 2,
        character_name: 'Hero', character_id: characterId, level: 1,
        mutation: 'Normal', trait: 'None',
      },
    })
    await rpc('ingest_gifts', [makeGift(randomUUID())])
    await expect(rpc('ingest_gifts', [makeGift(randomUUID())])).rejects.toMatchObject({ code: '23505' })
    await client.query('drop index gift_logs_character_id_test_uidx')
  })

  it('acknowledges duplicate purchase_id without creating another purchase', async () => {
    const purchaseId = `receipt-${randomUUID()}`
    const firstId = randomUUID()
    const secondId = randomUUID()
    expect((await rpc('ingest_purchases', [purchase(firstId, purchaseId)])).accepted_event_ids).toEqual([firstId])
    expect((await rpc('ingest_purchases', [purchase(secondId, purchaseId)])).duplicate_event_ids).toEqual([secondId])
    const count = await client.query('select count(*)::integer as count from product_purchases where purchase_id = $1', [purchaseId])
    expect(count.rows[0].count).toBe(1)
  })

  it('ingests full and compact snapshots', async () => {
    const fullId = randomUUID()
    const compactId = randomUUID()
    const basePayload = {
      player_id: 1, player_name: 'Player', cash: 1, highest_wave: 2, total_kills: 3,
    }
    const result = await rpc('ingest_player_snapshots', [
      {
        event_id: fullId, event_type: 'snapshot_full', schema_version: 1,
        occurred_at: '2026-06-05T00:00:00Z', server_job_id: 'job-1', place_id: 123,
        payload: { ...basePayload, inventory: [], items: [], equipped: [] },
      },
      {
        event_id: compactId, event_type: 'snapshot_compact', schema_version: 1,
        occurred_at: '2026-06-05T00:00:00Z', server_job_id: 'job-1', place_id: 123,
        payload: { ...basePayload, changed_fields: { cash: true } },
      },
    ])
    expect(result.accepted_event_ids).toEqual([fullId, compactId])
    const rows = await client.query('select snapshot_kind from player_snapshots where source_event_id = any($1::uuid[]) order by snapshot_kind', [[fullId, compactId]])
    expect(rows.rows.map((row) => row.snapshot_kind)).toEqual(['compact', 'full'])
  })
})
