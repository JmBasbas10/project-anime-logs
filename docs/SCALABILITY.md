# Scalability Plan

## Current Target

Five thousand daily players is manageable for Postgres and a Next.js API, but
the important number is events per second and snapshot size. A three-minute
full snapshot cadence can create millions of child rows long before the parent
tables become large.

## Recommended Architecture

1. Roblox servers buffer events in memory and send bounded batches.
2. The public ingestion endpoint authenticates, validates size/schema, and
   writes quickly. Do not perform dashboard analytics in ingestion requests.
3. Postgres stores append-only events and maintains small summary tables or
   materialized views for dashboard cards and player lookup.
4. Dashboard pages read summaries and bounded recent windows. They never scan
   raw history during a page request.
5. Scheduled jobs roll up old data and delete or archive raw snapshots.

At substantially higher traffic, place a durable queue between Roblox and the
database. Vercel route handlers are request-scoped and cannot be the queue.

## Roblox Sender Contract

- Batch normal events every 5-15 seconds or at 50 events, whichever comes first.
- Cap each request below 1 MB and 250 events. Snapshot batches are capped at 100
  players by the API because inventories make them much larger.
- Add a stable `event_id` UUID generated once by the game server. Retry the same
  ID so the database can deduplicate it.
- Retry `429` and `5xx` responses with exponential backoff plus jitter. Do not
  retry permanent `4xx` validation failures.
- Keep failed batches until acknowledged. Put a hard queue cap in place and
  drop low-value periodic snapshots before purchases, gifts, or security events.
- Flush on `BindToClose`, but treat it as a best effort rather than the only
  durability mechanism.
- Never put the API key in replicated storage. Rotate the currently hardcoded
  Roblox key.
- Send deltas for routine telemetry. Full inventory snapshots should be taken
  on join/leave and much less frequently than every three minutes unless they
  are essential.

## Database

Apply `supabase/migrations/202606050001_scalability_indexes.sql` first.

- Keep foreign keys with `on delete cascade` on all child tables.
- Add source event IDs with unique constraints before enabling retries.
- Partition the largest append-only tables by month after they reach tens of
  millions of rows, not before.
- Keep 30-90 days of raw periodic snapshots, then retain daily rollups.
- Build summary tables for latest player state, daily revenue, daily active
  users, and event counts. Refresh them asynchronously.
- Use a transaction or Postgres RPC for each parent-plus-children insert. The
  current API detects partial failures, but only a database transaction can
  guarantee atomicity.
- Monitor database size, index hit rate, slow queries, connection count, API
  p95 latency, rejected payloads, and sender retry/queue depth.

## Next Steps

## Reliable Ingestion Contract

Phase 1 adds `POST /api/v1/ingest`. It accepts mixed version-1 events:

```json
{
  "schema_version": 1,
  "events": [
    {
      "event_id": "11111111-1111-4111-8111-111111111111",
      "event_type": "purchase",
      "schema_version": 1,
      "occurred_at": "2026-06-05T00:00:00Z",
      "server_job_id": "roblox-job-id",
      "place_id": 123,
      "payload": {
        "player_id": 1,
        "player_name": "Player",
        "product_name": "Starter Pack",
        "robux_spent": 100,
        "purchase_id": "roblox-receipt-id"
      }
    }
  ]
}
```

Supported event types are `join`, `leave`, `snapshot_full`,
`snapshot_compact`, `gift`, `sale`, `purchase`, and `security`.

The API returns only after the transactional RPCs commit:

```json
{
  "request_id": "request-uuid",
  "accepted_event_ids": ["event-uuid"],
  "duplicate_event_ids": [],
  "rejected": [{ "event_id": "event-uuid", "reason": "permanent reason" }]
}
```

Roblox must remove accepted and duplicate IDs from its queue. Permanently
rejected IDs should be logged and removed. Retry the same IDs only after
`429`, `500`, or `503`.

## Migration Order

Review and manually apply migrations in this order:

1. `supabase/migrations/202606050001_scalability_indexes.sql`
2. `supabase/migrations/202606050002_reliable_ingestion.sql`
3. Deploy the dashboard/API application.
4. Smoke-test `/api/v1/ingest` with one event and a retry of the same ID.
5. Deploy the new Roblox sender with retries disabled.
6. Confirm acknowledgements and observability logs.
7. Enable Roblox retries.

Do not enable retries before migration `202606050002_reliable_ingestion.sql`
is applied. The unique `source_event_id` constraints and transactional RPCs are
what make retries safe.

## Secret Rotation

1. Set the new key in `ROBLOX_API_SECRET`.
2. Temporarily set the old key in `ROBLOX_API_SECRET_PREVIOUS`.
3. Deploy the API, then deploy Roblox servers with the new key.
4. After old Roblox servers have drained, remove
   `ROBLOX_API_SECRET_PREVIOUS` and redeploy.

The API accepts both keys during the transition and never logs either value.

## Database Failure Classification

The ingestion RPCs isolate permanent event-specific failures such as malformed
numeric data, missing required values, failed checks, and foreign-key failures.
Those events are returned in `rejected`.

Retryable or unexpected database failures are not converted into rejections.
Deadlocks, serialization failures, timeouts, resource failures, internal
errors, and unrelated unique-constraint violations escape the RPC so the API
returns `500` or `503` and Roblox retries the same event IDs.

An event is acknowledged as an idempotent duplicate only when its
`source_event_id` already exists. Purchases are also acknowledged as duplicates
when their Roblox `purchase_id` already exists.

## Legacy Compatibility

The existing `/api/events`, `/api/batch`, `/api/gifts`, `/api/sales`, and
`/api/purchases` formats remain available. The database assigns compatibility
event IDs to legacy inserts, but old requests do not contain stable sender IDs.
Therefore, retrying a legacy request can still create duplicate business data.

## Future Queue Boundary

At higher sustained throughput, put a durable queue between `/api/v1/ingest`
and Postgres. Vercel route handlers remain request-scoped and must never use an
in-memory delivery queue.
