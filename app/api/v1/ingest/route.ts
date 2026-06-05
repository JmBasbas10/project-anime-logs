import { type NextRequest } from 'next/server'
import { validateRobloxApiKey, unauthorized } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { handleIngestRequest } from '@/lib/ingestion/handler'

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  if (!validateRobloxApiKey(request)) {
    console.warn(JSON.stringify({
      service: 'roblox-ingestion',
      request_id: requestId,
      error: 'unauthorized',
      accepted_count: 0,
      duplicate_count: 0,
      rejected_count: 0,
      payload_bytes: Number(request.headers.get('content-length') ?? '0'),
    }))
    return unauthorized('Unauthorized', requestId)
  }

  return handleIngestRequest(request, createAdminSupabaseClient(), requestId)
}
