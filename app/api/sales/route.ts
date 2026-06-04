import { type NextRequest } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { validateRobloxApiKey, validateReadApiKey, unauthorized } from '@/lib/auth'

interface SaleCharacterPayload {
  character_name: string
  character_id: string
  level: number
  mutation: string
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

  const { searchParams } = new URL(request.url)
  const page  = Math.max(1, Number(searchParams.get('page')  ?? '1'))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '50')))
  const from  = (page - 1) * limit

  const supabase = createAdminSupabaseClient()
  const { data, error, count } = await supabase
    .from('character_sales')
    .select('*, characters:sale_characters(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data, pagination: { page, limit, total: count ?? 0 } })
}

export async function POST(request: NextRequest) {
  if (!validateRobloxApiKey(request)) return unauthorized()

  let body: { sales: SalePayload[] }
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!Array.isArray(body.sales) || body.sales.length === 0)
    return Response.json({ error: 'sales array is required' }, { status: 400 })

  const supabase = createAdminSupabaseClient()

  // Process each sale sequentially to capture the generated sale_id for children
  const errors: string[] = []

  await Promise.all(body.sales.map(async (sale) => {
    const { data: saleRow, error: saleErr } = await supabase
      .from('character_sales')
      .insert({
        player_name:         sale.player_name,
        player_id:           sale.player_id,
        sale_type:           sale.sale_type,
        total_cash_received: sale.total_cash_received,
        total_sold:          sale.total_sold,
        ...(sale.timestamp ? { created_at: sale.timestamp } : {}),
      })
      .select('id')
      .single()

    if (saleErr || !saleRow) {
      errors.push(saleErr?.message ?? 'sale insert failed')
      return
    }

    if (sale.characters?.length) {
      const { error: charErr } = await supabase.from('sale_characters').insert(
        sale.characters.map(c => ({
          sale_id:        saleRow.id,
          character_name: c.character_name,
          character_id:   c.character_id,
          level:          c.level,
          mutation:       c.mutation,
          cash_received:  c.cash_received,
        }))
      )
      if (charErr) errors.push(charErr.message)
    }
  }))

  if (errors.length)
    return Response.json({ errors }, { status: 500 })

  return Response.json({ ok: true, count: body.sales.length }, { status: 201 })
}
