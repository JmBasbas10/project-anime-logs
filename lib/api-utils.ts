import { type NextRequest } from 'next/server'

export const MAX_INGEST_BODY_BYTES = 1_000_000
export const MAX_BATCH_ROWS = 250
export const INSERT_CHUNK_SIZE = 500

export class ApiInputError extends Error {
  constructor(
    message: string,
    public readonly status = 400
  ) {
    super(message)
  }
}

export async function readJsonBody<T>(
  request: NextRequest,
  maxBytes = MAX_INGEST_BODY_BYTES
): Promise<T> {
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new ApiInputError('Content-Type must be application/json', 415)
  }

  const contentLength = Number(request.headers.get('content-length') ?? '0')
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new ApiInputError(`Request body exceeds ${maxBytes} bytes`, 413)
  }

  const text = await request.text()
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new ApiInputError(`Request body exceeds ${maxBytes} bytes`, 413)
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new ApiInputError('Invalid JSON')
  }
}

export function inputErrorResponse(error: unknown) {
  if (error instanceof ApiInputError) {
    return Response.json({ error: error.message }, { status: error.status })
  }
  return Response.json({ error: 'Invalid request body' }, { status: 400 })
}

export function requireBoundedArray<T>(
  value: unknown,
  field: string,
  maxRows = MAX_BATCH_ROWS
): asserts value is T[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ApiInputError(`${field} array is required`)
  }
  if (value.length > maxRows) {
    throw new ApiInputError(`${field} cannot contain more than ${maxRows} rows`, 413)
  }
}

export function chunksOf<T>(rows: T[], size = INSERT_CHUNK_SIZE): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size))
  }
  return chunks
}

export function parsePagination(request: NextRequest, defaultLimit = 50) {
  const pageValue = Number(request.nextUrl.searchParams.get('page') ?? '1')
  const limitValue = Number(request.nextUrl.searchParams.get('limit') ?? String(defaultLimit))
  const page = Number.isFinite(pageValue) ? Math.max(1, Math.floor(pageValue)) : 1
  const limit = Number.isFinite(limitValue)
    ? Math.min(100, Math.max(1, Math.floor(limitValue)))
    : defaultLimit
  const from = (page - 1) * limit

  return { page, limit, from, to: from + limit - 1 }
}
