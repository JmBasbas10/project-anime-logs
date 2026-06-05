import { type NextRequest } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { validateRobloxApiKey, validateReadApiKey, unauthorized } from '@/lib/auth'
import {
  chunksOf,
  inputErrorResponse,
  parsePagination,
  readJsonBody,
  requireBoundedArray,
} from '@/lib/api-utils'

interface SaleCharacterPayload {
  character_name: string
  character_id: string
  level: number
  mutation: string
  trait: string
  cash_received: number
}

interface SalePayload {
  player_name: string
  player_id: number
  sale_type: 'SellOne' | 'SellAll'
  total_cash_received: number
  total_sold: number
  timestamp?: string
  characters: SaleCharacterPayload[]
}

export async function GET(request: NextRequest) {
  if (!validateReadApiKey(request)) return unauthorized()

  const { page, limit, from, to } = parsePagination(request)
  const supabase = createAdminSupabaseClient()
  const { data, error, count } = await supabase
    .from('character_sales')
    .select('*, characters:sale_characters(*)', { count: 'planned' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return Response.json({ error: 'Unable to load sales' }, { status: 500 })
  return Response.json({ data, pagination: { page, limit, total: count ?? 0 } })
}

export async function POST(request: NextRequest) {
  if (!validateRobloxApiKey(request)) return unauthorized()

  let body: { sales: SalePayload[] }
  try {
    body = await readJsonBody<{ sales: SalePayload[] }>(request)
    requireBoundedArray(body.sales, 'sales')
  } catch (error) {
    return inputErrorResponse(error)
  }

  const supabase = createAdminSupabaseClient()
  const sales = body.sales.map((sale) => ({
    id: crypto.randomUUID(),
    player_name: sale.player_name,
    player_id: sale.player_id,
    sale_type: sale.sale_type,
    total_cash_received: sale.total_cash_received,
    total_sold: sale.total_sold,
    ...(sale.timestamp ? { created_at: sale.timestamp } : {}),
  }))

  const { error: saleError } = await supabase.from('character_sales').insert(sales)
  if (saleError) {
    return Response.json({ error: 'Sale insert failed' }, { status: 500 })
  }

  const characters = body.sales.flatMap((sale, index) =>
    (sale.characters ?? []).map((character) => ({
      sale_id: sales[index].id,
      character_name: character.character_name,
      character_id: character.character_id,
      level: character.level,
      mutation: character.mutation,
      trait: character.trait,
      cash_received: character.cash_received,
    }))
  )
  const results = await Promise.all(
    chunksOf(characters).map((rows) => supabase.from('sale_characters').insert(rows))
  )
  if (results.some((result) => result.error)) {
    return Response.json({ error: 'One or more sale detail inserts failed' }, { status: 500 })
  }

  return Response.json({ ok: true, count: body.sales.length }, { status: 201 })
}
