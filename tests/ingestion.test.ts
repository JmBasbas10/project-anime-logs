import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { handleIngestRequest } from '@/lib/ingestion/handler'
import { ingestEvents, type IngestionRpcClient, type RpcResult } from '@/lib/ingestion/service'
import type { IngestEvent } from '@/lib/ingestion/schemas'

const eventId = '11111111-1111-4111-8111-111111111111'

function purchase(id = eventId): IngestEvent {
  return {
    event_id: id,
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
      purchase_id: `purchase-${id}`,
    },
  }
}

function request(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/v1/ingest', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

class TransactionalMock implements IngestionRpcClient {
  stored = new Set<string>()
  calls: Array<{ name: string; events: IngestEvent[] }> = []

  async rpc(name: string, args: { p_events: IngestEvent[] }): Promise<RpcResult> {
    this.calls.push({ name, events: args.p_events })
    const accepted: string[] = []
    const duplicate: string[] = []
    const rejected: Array<{ event_id: string; reason: string }> = []
    for (const event of args.p_events) {
      if ('force_child_failure' in event.payload) {
        rejected.push({ event_id: event.event_id, reason: 'child insert failed' })
      } else if (this.stored.has(event.event_id)) {
        duplicate.push(event.event_id)
      } else {
        this.stored.add(event.event_id)
        accepted.push(event.event_id)
      }
    }
    return {
      data: {
        accepted_event_ids: accepted,
        duplicate_event_ids: duplicate,
        rejected,
      },
      error: null,
    }
  }
}

describe('reliable ingestion', () => {
  it('acknowledges a retry as a duplicate and stores one record', async () => {
    const client = new TransactionalMock()
    expect((await ingestEvents(client, [purchase()])).accepted_event_ids).toEqual([eventId])
    expect((await ingestEvents(client, [purchase()])).duplicate_event_ids).toEqual([eventId])
    expect(client.stored.size).toBe(1)
  })

  it('acknowledges duplicates inside a repeated batch', async () => {
    const client = new TransactionalMock()
    await ingestEvents(client, [purchase()])
    const result = await ingestEvents(client, [purchase(), purchase()])
    expect(result.duplicate_event_ids).toEqual([eventId, eventId])
  })

  it('does not retain a parent when a child insert fails', async () => {
    const client = new TransactionalMock()
    const broken = {
      ...purchase(),
      payload: { ...purchase().payload, force_child_failure: true },
    } as unknown as IngestEvent
    const result = await ingestEvents(client, [broken])
    expect(result.rejected).toHaveLength(1)
    expect(client.stored.has(eventId)).toBe(false)
  })

  it('accepts a valid event while permanently rejecting an invalid neighbor', async () => {
    const client = new TransactionalMock()
    const response = await handleIngestRequest(request({
      schema_version: 1,
      events: [purchase(), { ...purchase('bad-id'), event_id: 'bad-id' }],
    }), client, 'request-1')
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.accepted_event_ids).toEqual([eventId])
    expect(body.rejected).toHaveLength(1)
  })

  it('returns 413 for excessive record counts', async () => {
    const response = await handleIngestRequest(request({
      schema_version: 1,
      events: Array.from({ length: 251 }, () => ({})),
    }), new TransactionalMock(), 'request-2')
    expect(response.status).toBe(413)
  })

  it('returns 400 for invalid JSON', async () => {
    const response = await handleIngestRequest(
      request('{broken-json'),
      new TransactionalMock(),
      'request-invalid-json'
    )
    expect(response.status).toBe(400)
  })

  it('returns 413 for an oversized body', async () => {
    const response = await handleIngestRequest(request('{}', {
      'content-length': '1000001',
    }), new TransactionalMock(), 'request-3')
    expect(response.status).toBe(413)
  })

  it('returns 422 when every event fails permanent validation', async () => {
    const response = await handleIngestRequest(request({
      schema_version: 1,
      events: [{ event_id: 'not-a-uuid', event_type: 'purchase' }],
    }), new TransactionalMock(), 'request-4')
    expect(response.status).toBe(422)
  })

  it('returns 503 for a temporary RPC failure', async () => {
    const client: IngestionRpcClient = {
      rpc: async () => ({ data: null, error: { message: 'database unavailable' } }),
    }
    const response = await handleIngestRequest(request({
      schema_version: 1,
      events: [purchase()],
    }), client, 'request-5')
    expect(response.status).toBe(503)
  })

  it('dispatches mixed event batches to the correct RPCs', async () => {
    const client = new TransactionalMock()
    const gift: IngestEvent = {
      event_id: '22222222-2222-4222-8222-222222222222',
      event_type: 'gift',
      schema_version: 1,
      occurred_at: '2026-06-05T00:00:00Z',
      server_job_id: 'job-1',
      place_id: 123,
      payload: {
        giver_name: 'One', giver_id: 1, receiver_name: 'Two', receiver_id: 2,
        character_name: 'Hero', character_id: 'hero-1', level: 1,
        mutation: 'Normal', trait: 'None',
      },
    }
    await ingestEvents(client, [purchase(), gift])
    expect(client.calls.map((call) => call.name).sort()).toEqual(['ingest_gifts', 'ingest_purchases'])
  })

  it('returns a request ID in the body and header', async () => {
    const response = await handleIngestRequest(request({
      schema_version: 1,
      events: [purchase()],
    }), new TransactionalMock(), 'known-request-id')
    expect(response.headers.get('x-request-id')).toBe('known-request-id')
    expect((await response.json()).request_id).toBe('known-request-id')
  })
})
