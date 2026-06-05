import { type NextRequest } from 'next/server'
import { ApiInputError, MAX_BATCH_ROWS, readJsonBody } from '@/lib/api-utils'
import { ingestEventSchema, ingestRequestShapeSchema, type IngestEvent } from '@/lib/ingestion/schemas'
import {
  ingestEvents,
  type IngestionRpcClient,
  type IngestAcknowledgement,
} from '@/lib/ingestion/service'

const MAX_SNAPSHOTS = 100

function validationReason(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  return error.issues
    .slice(0, 5)
    .map((issue) => `${issue.path.join('.') || 'event'}: ${issue.message}`)
    .join('; ')
}

export async function handleIngestRequest(
  request: NextRequest,
  client: IngestionRpcClient,
  requestId = crypto.randomUUID()
) {
  const startedAt = performance.now()
  let payloadBytes = Number(request.headers.get('content-length') ?? '0')

  try {
    const body = await readJsonBody<unknown>(request)
    if (!payloadBytes) payloadBytes = new TextEncoder().encode(JSON.stringify(body)).byteLength

    const requestShape = ingestRequestShapeSchema.safeParse(body)
    if (!requestShape.success) {
      logRequest('info', {
        request_id: requestId,
        accepted_count: 0,
        duplicate_count: 0,
        rejected_count: 1,
        duration_ms: Math.round(performance.now() - startedAt),
        payload_bytes: payloadBytes,
      })
      return response(
        { request_id: requestId, error: validationReason(requestShape.error) },
        422,
        requestId
      )
    }

    if (requestShape.data.events.length > MAX_BATCH_ROWS) {
      throw new ApiInputError(`events cannot contain more than ${MAX_BATCH_ROWS} rows`, 413)
    }
    const snapshotCount = requestShape.data.events.filter((event) =>
      typeof event === 'object' && event !== null &&
      ['snapshot_full', 'snapshot_compact'].includes(String((event as { event_type?: unknown }).event_type))
    ).length
    if (snapshotCount > MAX_SNAPSHOTS) {
      throw new ApiInputError(`events cannot contain more than ${MAX_SNAPSHOTS} snapshots`, 413)
    }

    const validEvents: IngestEvent[] = []
    const rejected: IngestAcknowledgement['rejected'] = []
    for (const rawEvent of requestShape.data.events) {
      const parsed = ingestEventSchema.safeParse(rawEvent)
      if (parsed.success) validEvents.push(parsed.data)
      else {
        const candidate = rawEvent as { event_id?: unknown }
        rejected.push({
          event_id: typeof candidate?.event_id === 'string' ? candidate.event_id : 'unknown',
          reason: validationReason(parsed.error),
        })
      }
    }

    const acknowledgement = validEvents.length
      ? await ingestEvents(client, validEvents)
      : { accepted_event_ids: [], duplicate_event_ids: [], rejected: [] }
    acknowledgement.rejected.push(...rejected)
    const status = validEvents.length === 0 && rejected.length > 0 ? 422 : 200

    logRequest('info', {
      request_id: requestId,
      accepted_count: acknowledgement.accepted_event_ids.length,
      duplicate_count: acknowledgement.duplicate_event_ids.length,
      rejected_count: acknowledgement.rejected.length,
      duration_ms: Math.round(performance.now() - startedAt),
      payload_bytes: payloadBytes,
    })
    return response({ request_id: requestId, ...acknowledgement }, status, requestId)
  } catch (error) {
    const status = error instanceof ApiInputError ? error.status : 503
    logRequest('error', {
      request_id: requestId,
      error: error instanceof Error ? error.message : 'Unknown ingestion failure',
      accepted_count: 0,
      duplicate_count: 0,
      rejected_count: 0,
      duration_ms: Math.round(performance.now() - startedAt),
      payload_bytes: payloadBytes,
    })
    return response(
      { request_id: requestId, error: error instanceof ApiInputError ? error.message : 'Temporary ingestion failure' },
      status,
      requestId
    )
  }
}

function response(body: object, status: number, requestId: string) {
  return Response.json(body, { status, headers: { 'x-request-id': requestId } })
}

function logRequest(level: 'info' | 'error', fields: Record<string, unknown>) {
  console[level](JSON.stringify({ service: 'roblox-ingestion', ...fields }))
}
