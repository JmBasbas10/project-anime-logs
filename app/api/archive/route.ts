import { type NextRequest } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { validateDashboardSession, unauthorized } from '@/lib/auth'

const ALLOWED_TABLES = [
  'player_events',
  'player_snapshots',
  'character_sales',
  'gift_logs',
  'product_purchases',
] as const

type AllowedTable = (typeof ALLOWED_TABLES)[number]

export async function PATCH(request: NextRequest) {
  if (!(await validateDashboardSession(request))) return unauthorized()

  let body: { table: AllowedTable; id: string; archived: boolean }
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!ALLOWED_TABLES.includes(body.table))
    return Response.json({ error: 'Invalid table' }, { status: 400 })

  const supabase = createAdminSupabaseClient()
  const { error } = await supabase
    .from(body.table)
    .update({ archived: body.archived })
    .eq('id', body.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
